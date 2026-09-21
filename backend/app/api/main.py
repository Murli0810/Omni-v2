from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import Point
from datetime import datetime, timezone

from app.core.database import get_db, engine, Base, sessionLocal
from app.db.models import Event, Telemetry, DefectMaster, Device
from app.db.schemas import EventCreate, EventOut, TelemetryCreate, DefectMasterOut, HeatmapPoint, SummaryStats
from app.services.dedup import dedup_event
from app.core.dispatch import dispatch_event
from app.core.ws_manager import manager
from app.services.recommendations import generate_recommendation, count_nearby_pedestrian_alerts
from app.db.schemas import RecommendationOut
from app.db.models import Recommendation


app= FastAPI(title="Omni Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"status": "Omni backend running"}

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/events", response_model=EventOut)
async def create_event(event: EventCreate, background_tasks: BackgroundTasks, db: Session= Depends(get_db)):
    geom= from_shape(Point(event.lon, event.lat), srid=4326)
    new_event= Event(
        event_type= event.event_type,
        priority= event.priority,
        confidence= event.confidence,
        geom= geom,
        bus_id= event.bus_id,
        snapshot_url= event.snapshot_url,
        extra= event.extra,
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    if event.priority=="routine":
        dedup_event(
            db,
            defect_type=event.event_type,
            geom=geom,
            snapshot_url=event.snapshot_url,
        )

    if event.event_type=="pedestrian_alert":
        background_tasks.add_task(process_pedestrian_recommendation, event.lat, event.lon)

    point= to_shape(new_event.geom)
    event_out= EventOut(
        id=new_event.id,
        event_type=new_event.event_type,
        priority=new_event.priority,
        confidence=new_event.confidence,
        lat=point.y,
        lon=point.x,
        bus_id=new_event.bus_id,
        snapshot_url=new_event.snapshot_url,
        extra=new_event.extra,
        created_at=new_event.created_at,
    )

    await dispatch_event(event_out.model_dump())
    return event_out

def process_pedestrian_recommendation(lat: float, lon: float):
    db= sessionLocal()
    try:
        alert_count= count_nearby_pedestrian_alerts(db, lat, lon)
        generate_recommendation(db, lat, lon, pedestrian_alert_count=alert_count)
    finally:
        db.close()

@app.post("/api/telemetry")
def create_telemetry(telemetry: TelemetryCreate, db: Session= Depends(get_db)):
    new_telemetry= Telemetry(
        bus_id=telemetry.bus_id,
        recorded_at=telemetry.recorded_at,
        vehicle_count=telemetry.vehicle_count,
        class_breakdown=telemetry.class_breakdown,
        geom=from_shape(Point(telemetry.lon, telemetry.lat), srid=4326),
    )
    db.add(new_telemetry)
    db.commit()
    db.refresh(new_telemetry)
    return {"status": "ok", "id": new_telemetry.id}

@app.get("/api/recommendations", response_model=List[RecommendationOut])
def get_recommendations(db: Session = Depends(get_db)):
    recs= db.query(Recommendation).order_by(Recommendation.created_at.desc()).all()
    result= []
    for rec in recs:
        point= to_shape(rec.geom)
        result.append(RecommendationOut(
            lat=point.y,
            lon=point.x,
            recommendation=rec.recommendation,
            reason=rec.reason,
            priority=rec.priority,
        ))
    return result

@app.get("/api/defects/master", response_model=List[DefectMasterOut])
def get_defects_master(type: Optional[str] = None, ward: Optional[str]= None, db:Session= Depends(get_db)):
    query= db.query(DefectMaster)
    if type:
        query= query.filter(DefectMaster.defect_type == type)

    defects= query.order_by(DefectMaster.last_seen_at.desc()).all()

    result= []
    for d in defects:
        point= to_shape(d.geom)
        result.append(DefectMasterOut(
            id= str(d.id),
            defect_type=d.defect_type,
            lat=point.y,
            lon=point.x,
            confidence_score=d.confidence_score,
            sighting_count=d.sighting_count,
            status=d.status,
            latest_snapshot=d.latest_snapshot,
        ))
    return result

@app.get("/api/heatmap", response_model=List[HeatmapPoint])
def get_heatmap(db:Session = Depends(get_db)):
    results= db.execute(text("""
    SELECT
        ROUND(ST_Y(geom)::numeric, 3) AS lat,
        ROUND(ST_X(geom)::numeric, 3) AS lon,
        SUM(vehicle_count::text::integer) AS weight
    FROM telemetry
    GROUP BY lat, lon
    """)).fetchall()

    return [HeatmapPoint(lat=float(r.lat), lon=float(r.lon), weight=float(r.weight)) for r in results]

@app.get("/api/events", response_model=List[EventOut])
def get_event(db:Session = Depends(get_db), type: Optional[str]= None, priority: Optional[str]= None, since: Optional[str]= None):
    query= db.query(Event)
    if type:
        query= query.filter(Event.event_type == type)
    if priority:
        query= query.filter(Event.priority == priority)
    if since:
        query= query.filter(Event.created_at >= since)

    events= query.order_by(Event.created_at.desc()).limit(200).all()

    result= []
    for e in events:
        point= to_shape(e.geom)
        result.append(EventOut(
            id=e.id,
            event_type=e.event_type,
            priority=e.priority,
            confidence=e.confidence,
            lat=point.y,
            lon=point.x,
            bus_id=e.bus_id,
            snapshot_url=e.snapshot_url,
            extra=e.extra,
            created_at=e.created_at,
        ))
    return result

@app.get("/api/stats/summary", response_model=SummaryStats)
def get_summary_stats(db:Session = Depends(get_db)):
    total_defects= db.query(func.count(DefectMaster.id)).scalar() or 0

    today_start= datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    incidents_today= (
        db.query(func.count(Event.id))
        .filter(Event.priority == "critical")
        .filter(Event.created_at >= today_start)
        .scalar() or 0
    )

    active_buses= db.query(func.count(Device.device_id)).filter(Device.status == "ACTIVE").scalar() or 0

    return SummaryStats(
        total_defects=total_defects,
        incidents_today=incidents_today,
        active_buses=active_buses,
    )