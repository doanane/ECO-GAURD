from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.sensor import Sensor, SensorStatus
from app.agents.agent_manager import agent_manager

router = APIRouter()


def _sensor_to_dict(s: Sensor, agent_status: dict = None) -> dict:
    return {
        "id": s.id,
        "sensor_id": s.sensor_id,
        "sensor_type": s.sensor_type.value,
        "name": s.name,
        "location_label": s.location_label,
        "location_km": s.location_km,
        "status": s.status.value,
        "nominal_min": s.nominal_min,
        "nominal_max": s.nominal_max,
        "unit": s.unit,
        "description": s.description,
        "pipeline_node_id": s.pipeline_node_id,
        "agent": agent_status or {},
    }


@router.get("")
def list_sensors(db: Session = Depends(get_db)):
    sensors = db.query(Sensor).all()
    agent_statuses = agent_manager.get_agent_status()
    return [_sensor_to_dict(s, agent_statuses.get(s.sensor_id)) for s in sensors]


@router.get("/status/summary")
def agent_status_summary():
    return agent_manager.get_agent_status()


@router.get("/{sensor_id}")
def get_sensor(sensor_id: str, db: Session = Depends(get_db)):
    sensor = db.query(Sensor).filter(Sensor.sensor_id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
    agent_statuses = agent_manager.get_agent_status()
    return _sensor_to_dict(sensor, agent_statuses.get(sensor_id))


@router.post("/{sensor_id}/inject-leak")
def inject_leak(sensor_id: str, duration_ticks: int = 15):
    ok = agent_manager.inject_leak(sensor_id, duration_ticks)
    if not ok:
        raise HTTPException(status_code=404, detail="Sensor agent not found")
    return {"message": f"Leak event injected on {sensor_id} for {duration_ticks} ticks"}


@router.post("/inject-all-leaks")
def inject_all_leaks(duration_ticks: int = 15):
    agent_manager.inject_all_leaks(duration_ticks)
    return {"message": f"Leak events injected on all sensors for {duration_ticks} ticks"}


@router.post("/reset-all")
def reset_all_sensors():
    agent_manager.reset_all()
    return {"message": "All sensor agents reset"}


@router.put("/{sensor_id}/status")
def update_sensor_status(sensor_id: str, status: str, db: Session = Depends(get_db)):
    sensor = db.query(Sensor).filter(Sensor.sensor_id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
    try:
        sensor.status = SensorStatus(status.upper())
        db.commit()
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    return {"message": f"Sensor {sensor_id} status updated to {status}"}
