from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.alert import Alert, ActionType
from app.services.alert_service import alert_service

router = APIRouter()


class ResolveRequest(BaseModel):
    action_taken: str = "NONE"


def _alert_to_dict(a: Alert) -> dict:
    return {
        "id": a.id,
        "sensor_id": a.sensor_id,
        "severity": a.severity.value,
        "alert_type": a.alert_type.value,
        "message": a.message,
        "value_at_trigger": a.value_at_trigger,
        "threshold_value": a.threshold_value,
        "timestamp": a.timestamp.isoformat() if a.timestamp else None,
        "acknowledged": a.acknowledged,
        "acknowledged_at": a.acknowledged_at.isoformat() if a.acknowledged_at else None,
        "action_taken": a.action_taken.value if a.action_taken else "NONE",
        "resolved": a.resolved,
        "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
        "location_label": a.location_label,
    }


@router.get("")
def list_alerts(
    active: bool = Query(default=False),
    hours: int = Query(default=48, ge=1, le=720),
    db: Session = Depends(get_db),
):
    if active:
        alerts = alert_service.get_active_alerts(db)
    else:
        alerts = alert_service.get_alert_history(db, hours=hours)
    return [_alert_to_dict(a) for a in alerts]


@router.get("/counts")
def alert_counts(hours: int = Query(default=24), db: Session = Depends(get_db)):
    return alert_service.count_by_severity(db, hours=hours)


@router.get("/{alert_id}")
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _alert_to_dict(alert)


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = alert_service.acknowledge_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _alert_to_dict(alert)


@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: int, body: ResolveRequest, db: Session = Depends(get_db)):
    try:
        action = ActionType(body.action_taken)
    except ValueError:
        action = ActionType.NONE

    alert = alert_service.resolve_alert(db, alert_id, action)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _alert_to_dict(alert)
