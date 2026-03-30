from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.models.reading import SensorReading
from app.services.analytics_service import analytics_service

router = APIRouter()


def _reading_to_dict(r: SensorReading) -> dict:
    return {
        "id": r.id,
        "sensor_id": r.sensor_id,
        "value": r.value,
        "unit": r.unit,
        "timestamp": r.timestamp.isoformat() if r.timestamp else None,
        "is_anomaly": r.is_anomaly,
        "confidence_score": r.confidence_score,
        "leak_probability": r.leak_probability,
        "sequence_number": r.sequence_number,
        "agent_state": r.agent_state,
    }


@router.get("/latest")
def get_latest_readings(db: Session = Depends(get_db)):
    latest = analytics_service.get_all_latest(db)
    return {sid: _reading_to_dict(r) for sid, r in latest.items()}


@router.get("/kpi")
def get_kpi_snapshot(db: Session = Depends(get_db)):
    return analytics_service.get_kpi_snapshot(db)


@router.get("/{sensor_id}")
def get_sensor_readings(
    sensor_id: str,
    hours: int = Query(default=1, ge=1, le=168),
    limit: int = Query(default=500, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    readings = (
        db.query(SensorReading)
        .filter(
            SensorReading.sensor_id == sensor_id,
            SensorReading.timestamp >= cutoff,
        )
        .order_by(SensorReading.timestamp.desc())
        .limit(limit)
        .all()
    )
    readings.reverse()
    return [_reading_to_dict(r) for r in readings]
