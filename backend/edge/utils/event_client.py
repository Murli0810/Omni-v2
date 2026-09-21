import requests
import time

backend_url= "http://127.0.0.1:8000"

def send_event(event_type: str, priority: str, confidence: float, lat: float, lon: float, bus_id: str = "bus-101", snapshot_url: str= None, extra: dict= None, retries: int= 1, timeout: int = 8):
    payload= {
        "event_type": event_type,
        "priority": priority,
        "confidence": confidence,
        "lat": lat,
        "lon": lon,
        "bus_id": bus_id,
        "snapshot_url": snapshot_url,
        "extra": extra,
    }

    for attempt in range(retries + 1):
        try:
            response= requests.post(f"{backend_url}/api/events", json=payload, timeout=timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"[event_client] send_event attempt {attempt + 1} failed: {e}")
            time.sleep(1)

    print(f"[event_client] Giving up on event after {retries + 1} attempts")
    return None

def send_telemetry(bus_id: str, recorded_at: str, vehicle_count: int, class_breakdown: dict, lat: float, lon: float, retries: int= 1, timeout: int= 8):
    payload= {
        "bus_id": bus_id,
        "recorded_at": recorded_at,
        "vehicle_count": vehicle_count,
        "class_breakdown": class_breakdown,
        "lat": lat,
        "lon": lon,
    }

    for attempt in range(retries + 1):
        try:
            response= requests.post(f"{backend_url}/api/telemetry", json=payload, timeout=timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"[event_client] send_telemetry attempt {attempt + 1} failed: {e}")
            time.sleep(1)

    print(f"[event_client] Giving up on telemetry after {retries+1} attempts")
    return None

