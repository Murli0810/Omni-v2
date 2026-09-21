import requests
import json
import os
from sqlalchemy import func
from app.db.models import Event
from sqlalchemy.orm import Session
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from app.db.models import Recommendation
from geoalchemy2 import Geography

OVERPASS_MIRRORS = [
    "https://overpass.nextgis.com/my-ghfnzhXXHY1VFuD8gYam1sXpuf1ndn4T/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]

HEADERS= {"User-Agent": "Omni-v2/hackathon (contact: agarwalmurli08@gmail.com)"}
CACHE_FILE= "recommendation_cache.json"

def _load_cache() -> dict:
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    return {}

def _save_cache(cache: dict):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f)


def is_near_school(lat: float, lon: float, radius_m: int = 150) -> dict:
    cache_key= f"{round(lat, 3)}_{round(lon, 3)}_{radius_m}"
    cache= _load_cache()
    if cache_key in cache:
        return cache[cache_key]

    query = f"""
    [out:json];
    nwr["amenity"="school"](around:{radius_m},{lat},{lon});
    out center;
    """

    data= None
    for url in OVERPASS_MIRRORS:
        try:
            response= requests.post(url, data={"data": query}, headers=HEADERS, timeout=15)
            response.raise_for_status()
            data= response.json()
            break
        except requests.exceptions.RequestException:
            continue

    if data is None:
        result= {"near_school": False, "schools": [], "lookup_failed": True}
        return result

    schools= [
        {
            "name": el.get("tags", {}).get("name", "unnamed school"),
            "lat": el.get("lat") or el.get("center", {}).get("lat"),
            "lon": el.get("lon") or el.get("center",{}).get("lon"),
        } for el in data.get("elements", [])
    ]
    result= {"near_school": len(schools) > 0, "schools": schools, "lookup_failed": False}

    cache[cache_key]= result
    _save_cache(cache)
    return result

def evaluate_infrastructure_need(event_lat: float, event_lon: float, pedestrian_alert_count: int, radius_m: int = 150) -> dict:
    result= is_near_school(event_lat, event_lon, radius_m)

    if result["near_school"] and pedestrian_alert_count >= 3:
        return {
            "recommendation": "Install speed breaker / school-zone signage",
            "reason": f"{pedestrian_alert_count} pedestrian alerts recorded near {result['schools'][0]['name']}",
            "priority": "High",
        }
    elif result["near_school"]:
        return {
            "recommendation":"Monitor - school zone, low alter frequency so far",
            "reason": "Near a school but not enough alerts yet to escalate",
            "priority": "Medium",
        }
    return {"recommendation":None, "reason":None, "priority":"Low"}

RECOMMENDATION_DEDUP_RADIUS_M = 50

def find_existing_recommendation(db: Session, lat: float, lon: float, radius_m: int = RECOMMENDATION_DEDUP_RADIUS_M):
    point= from_shape(Point(lat, lon), srid=4326)

    return (
        db.query(Recommendation).filter(func.ST_Dwithin(func.cast(Recommendation.geom, Geography), func.cast(point, Geography), radius_m)).first()
    )

def generate_recommendation(db: Session, lat: float, lon: float, pedestrian_alert_count: int):
    result= evaluate_infrastructure_need(lat, lon, pedestrian_alert_count)
    existing= find_existing_recommendation(db, lat, lon)

    if result["recommendation"] is None:
        return existing

    if existing:
        existing.recommendation= result["recommendation"]
        existing.reason= result["reason"]
        existing.priority= result["priority"]
        db.commit()
        db.refresh(existing)
        return existing

    new_rec= Recommendation(
        geom= from_shape(Point(lat, lon), srid=4326),
        recommendation= result["recommendation"],
        reason= result["reason"],
        priority= result["priority"],
    )
    db.add(new_rec)
    db.commit()
    db.refresh(new_rec)
    return new_rec

Pedestrian_Alert_Radius_M= 150
def count_nearby_pedestrian_alerts(db: Session, lat: float, lon: float, radius_m: int = Pedestrian_Alert_Radius_M) -> int:
    point= from_shape(Point(lat, lon), srid=4326)

    count= (
        db.query(func.count(Event.id)).filter(Event.event_type=="pedestrian_alert").filter(func.ST_DWithin(func.cast(Event.geom, Geography),func.cast(point, Geography),radius_m,)).scalar()
    )
    return count or 0