import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime, JSON, func
from app.core.database import Base


class ReportType(str, enum.Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    INCIDENT = "INCIDENT"
    COMPLIANCE = "COMPLIANCE"
    SENSOR_HEALTH = "SENSOR_HEALTH"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(Enum(ReportType), nullable=False)
    title = Column(String(200), nullable=False)
    generated_at = Column(DateTime, server_default=func.now())
    time_range_start = Column(DateTime, nullable=True)
    time_range_end = Column(DateTime, nullable=True)
    file_path = Column(String(500), default="")
    metadata_json = Column(JSON, default=dict)
