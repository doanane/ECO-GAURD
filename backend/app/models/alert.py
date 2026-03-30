import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Enum, DateTime, func
from app.core.database import Base


class AlertSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    INFO = "INFO"


class AlertType(str, enum.Enum):
    PRESSURE_DROP = "PRESSURE_DROP"
    PRESSURE_SPIKE = "PRESSURE_SPIKE"
    FLOW_DEVIATION = "FLOW_DEVIATION"
    ACOUSTIC_SPIKE = "ACOUSTIC_SPIKE"
    IR_HOTSPOT = "IR_HOTSPOT"
    SENSOR_OFFLINE = "SENSOR_OFFLINE"
    COMPOSITE_RISK = "COMPOSITE_RISK"


class ActionType(str, enum.Enum):
    ISOLATE_VALVE = "ISOLATE_VALVE"
    DISPATCH_FIELD_TEAM = "DISPATCH_FIELD_TEAM"
    REDUCE_PRESSURE = "REDUCE_PRESSURE"
    NOTIFY_HQ = "NOTIFY_HQ"
    NONE = "NONE"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(String(20), index=True, nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False)
    alert_type = Column(Enum(AlertType), nullable=False)
    message = Column(String(500), nullable=False)
    value_at_trigger = Column(Float, nullable=False)
    threshold_value = Column(Float, nullable=False)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime, nullable=True)
    action_taken = Column(Enum(ActionType), default=ActionType.NONE)
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    location_label = Column(String(100), default="")
