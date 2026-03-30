import enum
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, JSON, func
from app.core.database import Base


class NodeType(str, enum.Enum):
    JUNCTION = "JUNCTION"
    VALVE = "VALVE"
    PUMP = "PUMP"
    ENDPOINT = "ENDPOINT"
    SENSOR_POINT = "SENSOR_POINT"


class NodeStatus(str, enum.Enum):
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    ISOLATED = "ISOLATED"


class PipelineNode(Base):
    __tablename__ = "pipeline_nodes"

    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String(20), unique=True, index=True, nullable=False)
    label = Column(String(100), nullable=False)
    x_position = Column(Float, default=0.0)
    y_position = Column(Float, default=0.0)
    node_type = Column(Enum(NodeType), default=NodeType.JUNCTION)
    status = Column(Enum(NodeStatus), default=NodeStatus.NORMAL)
    connected_to = Column(JSON, default=list)
    sensor_id = Column(String(20), default="")
    km_marker = Column(Float, default=0.0)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
