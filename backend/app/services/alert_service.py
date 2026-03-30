import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.alert import Alert, AlertSeverity, AlertType, ActionType

logger = logging.getLogger(__name__)

ALERT_DEBOUNCE_SECONDS = 30


class AlertService:
    async def create_alert(
        self,
        db: Session,
        sensor_id: str,
        alert_type: AlertType,
        severity: AlertSeverity,
        value: float,
        threshold: float,
        message: str,
        location_label: str = "",
    ) -> Optional[Alert]:
        # Debounce: skip if same sensor had same alert type recently
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=ALERT_DEBOUNCE_SECONDS)
        recent = (
            db.query(Alert)
            .filter(
                Alert.sensor_id == sensor_id,
                Alert.alert_type == alert_type,
                Alert.resolved == False,
                Alert.timestamp >= cutoff,
            )
            .first()
        )
        if recent:
            return None

        alert = Alert(
            sensor_id=sensor_id,
            severity=severity,
            alert_type=alert_type,
            message=message,
            value_at_trigger=value,
            threshold_value=threshold,
            location_label=location_label,
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        from app.services.websocket_manager import ws_manager
        await ws_manager.broadcast_alert(self._to_dict(alert))

        logger.warning("Alert created: [%s] %s", severity.value, message)
        return alert

    def acknowledge_alert(self, db: Session, alert_id: int) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.acknowledged = True
        alert.acknowledged_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(alert)
        return alert

    def resolve_alert(self, db: Session, alert_id: int, action_taken: ActionType) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.resolved = True
        alert.resolved_at = datetime.now(timezone.utc)
        alert.action_taken = action_taken
        if not alert.acknowledged:
            alert.acknowledged = True
            alert.acknowledged_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(alert)
        return alert

    def get_active_alerts(self, db: Session) -> List[Alert]:
        return (
            db.query(Alert)
            .filter(Alert.resolved == False)
            .order_by(Alert.severity, Alert.timestamp.desc())
            .all()
        )

    def get_alert_history(self, db: Session, hours: int = 48) -> List[Alert]:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        return (
            db.query(Alert)
            .filter(Alert.timestamp >= cutoff)
            .order_by(Alert.timestamp.desc())
            .limit(200)
            .all()
        )

    def count_by_severity(self, db: Session, hours: int = 24) -> dict:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        alerts = db.query(Alert).filter(Alert.timestamp >= cutoff).all()
        return {
            "critical": sum(1 for a in alerts if a.severity == AlertSeverity.CRITICAL),
            "warning": sum(1 for a in alerts if a.severity == AlertSeverity.WARNING),
            "info": sum(1 for a in alerts if a.severity == AlertSeverity.INFO),
        }

    def _to_dict(self, alert: Alert) -> dict:
        return {
            "id": alert.id,
            "sensor_id": alert.sensor_id,
            "severity": alert.severity.value,
            "alert_type": alert.alert_type.value,
            "message": alert.message,
            "value_at_trigger": alert.value_at_trigger,
            "threshold_value": alert.threshold_value,
            "timestamp": alert.timestamp.isoformat() if alert.timestamp else None,
            "acknowledged": alert.acknowledged,
            "resolved": alert.resolved,
            "location_label": alert.location_label,
        }


alert_service = AlertService()
