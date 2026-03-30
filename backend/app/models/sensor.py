import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, func
from app.core.database import Base


class SensorType(str, enum.Enum):
    PRESSURE = "PRESSURE"
    FLOW = "FLOW"
    ACOUSTIC = "ACOUSTIC"
    INFRARED = "INFRARED"


class SensorStatus(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    FAULT = "FAULT"


class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(String(20), unique=True, index=True, nullable=False)
    sensor_type = Column(Enum(SensorType), nullable=False)
    name = Column(String(100), nullable=False)
    location_label = Column(String(100), default="")
    location_km = Column(Float, default=0.0)
    pipeline_node_id = Column(String(20), default="")
    status = Column(Enum(SensorStatus), default=SensorStatus.ONLINE)
    nominal_min = Column(Float, nullable=False)
    nominal_max = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    description = Column(String(255), default="")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
