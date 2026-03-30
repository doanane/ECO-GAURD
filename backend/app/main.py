import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import create_tables, SessionLocal
from app.api import api_router
from app.api.websocket import router as ws_router
from app.agents.agent_manager import agent_manager
from app.services.websocket_manager import ws_manager

logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL, logging.INFO))
logger = logging.getLogger(__name__)


def _seed_database():
    from app.models.sensor import Sensor, SensorType, SensorStatus
    from app.models.pipeline_node import PipelineNode, NodeType, NodeStatus

    db = SessionLocal()
    try:
        if db.query(Sensor).count() > 0:
            return

        sensors = [
            Sensor(
                sensor_id="PS-001",
                sensor_type=SensorType.PRESSURE,
                name="Pressure Transducer Alpha",
                location_label="Sector 7 — Km 12.4",
                location_km=12.4,
                pipeline_node_id="NODE-04",
                status=SensorStatus.ONLINE,
                nominal_min=85.0,
                nominal_max=115.0,
                unit="PSI",
                description=(
                    "High-accuracy piezoelectric pressure transducer mounted inline at "
                    "Km 12.4. Detects pressure drops indicative of pipe breaches or valve failures."
                ),
            ),
            Sensor(
                sensor_id="FS-002",
                sensor_type=SensorType.FLOW,
                name="Turbine Flow Meter Beta",
                location_label="Sector 7 — Km 22.1",
                location_km=22.1,
                pipeline_node_id="NODE-05",
                status=SensorStatus.ONLINE,
                nominal_min=180.0,
                nominal_max=220.0,
                unit="L/min",
                description=(
                    "Industrial-grade turbine flow meter monitoring volumetric flow rate. "
                    "Sustained deviations below 15% of nominal indicate material loss events."
                ),
            ),
            Sensor(
                sensor_id="ACS-003",
                sensor_type=SensorType.ACOUSTIC,
                name="Acoustic Emission Sensor Gamma",
                location_label="Sector 7 — Km 35.7",
                location_km=35.7,
                pipeline_node_id="NODE-06",
                status=SensorStatus.ONLINE,
                nominal_min=28.0,
                nominal_max=55.0,
                unit="dB",
                description=(
                    "Wide-band piezoelectric acoustic emission sensor. Detects high-frequency "
                    "stress waves and turbulent flow noise signatures caused by micro-fractures and leaks."
                ),
            ),
            Sensor(
                sensor_id="IR-004",
                sensor_type=SensorType.INFRARED,
                name="Infrared Thermographic Array Delta",
                location_label="Sector 7 — Km 44.2",
                location_km=44.2,
                pipeline_node_id="NODE-07",
                status=SensorStatus.ONLINE,
                nominal_min=15.0,
                nominal_max=28.0,
                unit="C",
                description=(
                    "Long-wave infrared thermographic sensor array detecting surface and subsurface "
                    "thermal anomalies. Leak events cause characteristic heat zones as pressurized "
                    "fluid contacts surrounding soil."
                ),
            ),
        ]
        db.add_all(sensors)

        nodes = [
            PipelineNode(node_id="NODE-01", label="SOURCE — Pumping Station", x_position=0.05, y_position=0.5, node_type=NodeType.PUMP, status=NodeStatus.NORMAL, connected_to=["NODE-02"], km_marker=0.0),
            PipelineNode(node_id="NODE-02", label="JUNCTION A", x_position=0.18, y_position=0.35, node_type=NodeType.JUNCTION, status=NodeStatus.NORMAL, connected_to=["NODE-03"], km_marker=6.0),
            PipelineNode(node_id="NODE-03", label="VALVE 1 — Isolation", x_position=0.30, y_position=0.28, node_type=NodeType.VALVE, status=NodeStatus.NORMAL, connected_to=["NODE-04"], km_marker=10.0),
            PipelineNode(node_id="NODE-04", label="SENSOR PS-001", x_position=0.40, y_position=0.35, node_type=NodeType.SENSOR_POINT, status=NodeStatus.NORMAL, connected_to=["NODE-05"], sensor_id="PS-001", km_marker=12.4),
            PipelineNode(node_id="NODE-05", label="SENSOR FS-002", x_position=0.52, y_position=0.5, node_type=NodeType.SENSOR_POINT, status=NodeStatus.NORMAL, connected_to=["NODE-06"], sensor_id="FS-002", km_marker=22.1),
            PipelineNode(node_id="NODE-06", label="SENSOR ACS-003", x_position=0.65, y_position=0.62, node_type=NodeType.SENSOR_POINT, status=NodeStatus.NORMAL, connected_to=["NODE-07"], sensor_id="ACS-003", km_marker=35.7),
            PipelineNode(node_id="NODE-07", label="SENSOR IR-004", x_position=0.77, y_position=0.55, node_type=NodeType.SENSOR_POINT, status=NodeStatus.NORMAL, connected_to=["NODE-08"], sensor_id="IR-004", km_marker=44.2),
            PipelineNode(node_id="NODE-08", label="VALVE 2 — Control", x_position=0.87, y_position=0.42, node_type=NodeType.VALVE, status=NodeStatus.NORMAL, connected_to=["NODE-09"], km_marker=46.0),
            PipelineNode(node_id="NODE-09", label="ENDPOINT — Receiving Terminal", x_position=0.96, y_position=0.5, node_type=NodeType.ENDPOINT, status=NodeStatus.NORMAL, connected_to=[], km_marker=48.0),
        ]
        db.add_all(nodes)
        db.commit()
        logger.info("Database seeded: %d sensors, %d pipeline nodes.", len(sensors), len(nodes))

    except Exception as exc:
        db.rollback()
        logger.error("Seeding error: %s", exc)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    _seed_database()
    agent_manager.initialize_agents(SessionLocal, ws_manager)
    agent_manager.start_all()
    logger.info(
        "%s v%s started — %d sensor agents active.",
        settings.APP_NAME,
        settings.APP_VERSION,
        agent_manager.agent_count,
    )
    yield
    agent_manager.stop_all()
    logger.info("All sensor agents stopped.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins() + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.include_router(ws_router)

os.makedirs(settings.REPORTS_DIR, exist_ok=True)
app.mount("/reports", StaticFiles(directory=settings.REPORTS_DIR), name="reports")


@app.get("/health")
def health_check():
    return {
        "status": "operational",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "active_agents": agent_manager.agent_count,
        "ws_connections": ws_manager.connection_count(),
    }
