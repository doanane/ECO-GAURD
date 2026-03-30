from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.analytics_service import analytics_service

router = APIRouter()


@router.get("/{sensor_id}/trend")
def get_trend(
    sensor_id: str,
    hours: int = Query(default=48, ge=1, le=168),
    db: Session = Depends(get_db),
):
    return analytics_service.get_trend_buckets(db, sensor_id, hours)


@router.get("/{sensor_id}/anomalies")
def get_anomalies(
    sensor_id: str,
    hours: int = Query(default=48, ge=1, le=168),
    db: Session = Depends(get_db),
):
    readings = analytics_service.get_readings_window(db, sensor_id, hours)
    return analytics_service.detect_anomalies(readings)


@router.get("/{sensor_id}/statistics")
def get_statistics(
    sensor_id: str,
    hours: int = Query(default=48, ge=1, le=168),
    db: Session = Depends(get_db),
):
    readings = analytics_service.get_readings_window(db, sensor_id, hours)
    stats = analytics_service.compute_statistics(readings)
    stats["sensor_id"] = sensor_id
    stats["hours"] = hours
    return stats


@router.get("/composite/risk")
def get_composite_risk(
    hours: int = Query(default=24, ge=1, le=168),
    db: Session = Depends(get_db),
):
    return analytics_service.get_kpi_snapshot(db)


@router.get("/all/statistics")
def get_all_statistics(
    hours: int = Query(default=24, ge=1, le=168),
    db: Session = Depends(get_db),
):
    sensor_ids = ["PS-001", "FS-002", "ACS-003", "IR-004"]
    result = {}
    for sid in sensor_ids:
        readings = analytics_service.get_readings_window(db, sid, hours)
        result[sid] = analytics_service.compute_statistics(readings)
    return result
