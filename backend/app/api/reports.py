import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.report import Report, ReportType
from app.services.report_service import report_service

router = APIRouter()


class GenerateReportRequest(BaseModel):
    report_type: str = "DAILY"
    hours: int = 24


def _report_to_dict(r: Report) -> dict:
    return {
        "id": r.id,
        "report_type": r.report_type.value,
        "title": r.title,
        "generated_at": r.generated_at.isoformat() if r.generated_at else None,
        "time_range_start": r.time_range_start.isoformat() if r.time_range_start else None,
        "time_range_end": r.time_range_end.isoformat() if r.time_range_end else None,
        "file_path": r.file_path,
        "metadata_json": r.metadata_json,
    }


@router.get("")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(Report.generated_at.desc()).limit(50).all()
    return [_report_to_dict(r) for r in reports]


@router.post("/generate")
def generate_report(body: GenerateReportRequest, db: Session = Depends(get_db)):
    try:
        rtype = ReportType(body.report_type.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid report type: {body.report_type}")

    report = report_service.generate_report(db, rtype, body.hours)
    return _report_to_dict(report)


@router.get("/sensor-health")
def sensor_health(db: Session = Depends(get_db)):
    return report_service.get_sensor_health_summary(db)


@router.get("/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found on disk")
    return FileResponse(
        path=report.file_path,
        media_type="application/json",
        filename=os.path.basename(report.file_path),
    )
