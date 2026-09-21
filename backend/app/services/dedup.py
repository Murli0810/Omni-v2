from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.db.models import DefectMaster
from geoalchemy2.shape import to_shape
from geoalchemy2 import Geography

DEDUP_RADIUS_METERS= 20

def dedup_event(db: Session, defect_type: str, geom, snapshot_url: str | None):
    existing= (
        db.query(DefectMaster)
        .filter(DefectMaster.defect_type == defect_type)
        .filter(
            func.ST_DWithin(
                func.cast(DefectMaster.geom, Geography),
                func.cast(geom, Geography),
                DEDUP_RADIUS_METERS,
            )
        )
        .first()
    )

    if existing:
        existing.sighting_count += 1
        existing.confidence_score = min(0.99, existing.confidence_score + 0.05 * existing.sighting_count)
        existing.last_seen_at = func.now()
        if snapshot_url:
            existing.latest_snapshot = snapshot_url

        db.commit()
        db.refresh(existing)
        return existing

    else:
        new_defect= DefectMaster(
            defect_type= defect_type,
            geom= geom,
            confidence_score= 0.7,
            sighting_count= 1,
            latest_snapshot= snapshot_url,
        )
        db.add(new_defect)
        db.commit()
        db.refresh(new_defect)
        return new_defect
