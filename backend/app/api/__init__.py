from fastapi import APIRouter
from app.api import sensors, readings, alerts, analytics, pipeline, reports

api_router = APIRouter()

api_router.include_router(sensors.router, prefix="/sensors", tags=["Sensors"])
api_router.include_router(readings.router, prefix="/readings", tags=["Readings"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(pipeline.router, prefix="/pipeline", tags=["Pipeline"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
