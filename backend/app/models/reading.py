from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, func
from app.core.database import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(String(20), index=True, nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    is_anomaly = Column(Boolean, default=False)
    confidence_score = Column(Float, default=1.0)
    leak_probability = Column(Float, default=0.0)
    raw_noise_value = Column(Float, default=0.0)
    sequence_number = Column(Integer, default=0)
    agent_state = Column(String(20), default="NORMAL")
