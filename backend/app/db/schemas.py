from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

#Incoming (from edge-ai models)

class EventCreate(BaseModel):
    event_type: str = Field(..., example=["pothole","waterlogging","pedestrian_alert","incident"])
    priority: str = Field(..., pattern="^(critical|routine)$")
    confidence: float = Field(..., ge=0.0, le=1.0)
    lat: float
    lon: float
    bus_id: str
    snapshot_url: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None


class TelemetryCreate(BaseModel):
    bus_id: str
    recorded_at: datetime
    vehicle_count: int = Field(..., ge=0)
    class_breakdown: Optional[Dict[str, Any]] = None
    lat: float
    lon: float

#outgoing (to frontend)

class EventOut(BaseModel):
    id: int
    event_type: str
    priority: str
    confidence: float
    lat: float
    lon: float
    bus_id: str
    snapshot_url: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes= True

class DefectMasterOut(BaseModel):
    id: str
    defect_type: str
    lat: float
    lon: float
    confidence_score: float
    sighting_count: int
    status: str
    latest_snapshot: Optional[str]= None

    class Config:
        from_attributes= True

class HeatmapPoint(BaseModel):
    lat: float
    lon:float
    weight: float

class RecommendationOut(BaseModel):
    lat: float
    lon: float
    recommendation: str
    reason: Optional[str]= None
    priority: Optional[str]= None

    class Config:
        from_attributes= True

class SummaryStats(BaseModel):
    total_defects: int
    incidents_today: int
    active_buses: int
