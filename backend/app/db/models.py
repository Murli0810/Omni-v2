import uuid
from sqlalchemy import Column, String, Float, Integer, BigInteger, TIMESTAMP, JSON, func
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
from backend.app.core.database import Base

class Device(Base):
    __tablename__= "devices"

    device_id= Column(String(64), primary_key=True)
    bus_id= Column(String(32), nullable=False)
    status= Column(String(16), default="ACTIVE")
    last_seen_at= Column(TIMESTAMP(timezone=True))

class Event(Base):
    __tablename__= "events"

    id= Column(BigInteger, primary_key=True, autoincrement=True)
    event_type= Column(String(32), nullable=False)
    priority= Column(String(16), nullable=False)
    confidence= Column(Float, nullable=False)
    geom= Column(Geometry(geometry_type="Point", srid=4326), nullable=False)
    bus_id= Column(String(32), nullable=False)
    snapshot_url= Column(String)
    extra= Column(JSON)
    created_at= Column(TIMESTAMP(timezone=True), server_default=func.now())

class DefectMaster(Base):
    __tablename__= "defects_master"

    id= Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    defect_type= Column(String(32), nullable=False)
    geom= Column(Geometry(geometry_type="Point", srid=4326), nullable=False)
    confidence_score= Column(Float, nullable=False)
    sighting_count= Column(Integer, default=1)
    status= Column(String(16), default="UNVERIFIED")
    first_seen_at= Column(TIMESTAMP(timezone=True), server_default=func.now())
    last_seen_at= Column(TIMESTAMP(timezone=True), server_default=func.now())
    latest_snapshot= Column(String)

class Telemetry(Base):
    __tablename__= "telemetry"

    id= Column(BigInteger, primary_key=True, autoincrement=True)
    bus_id= Column(String(32), nullable=False)
    recorded_at= Column(TIMESTAMP(timezone=True), nullable=False)
    vehicle_count= Column(Integer, nullable=False)
    class_breakdown= Column(JSON)
    geom= Column(Geometry(geometry_type="Point", srid=4326), nullable=False)

class Recommendation(Base):
    __tablename__= "recommendations"

    id= Column(Integer, primary_key=True, autoincrement=True)
    geom= Column(Geometry(geometry_type="Point", srid=4326), nullable=False)
    recommendation= Column(String, nullable=False)
    reason= Column(String)
    priority= Column(String(16))
    created_at= Column(TIMESTAMP(timezone=True), server_default=func.now())
    




