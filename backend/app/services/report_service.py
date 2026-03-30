import json
import logging
import os
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.report import Report, ReportType
from app.services.analytics_service import analytics_service

logger = logging.getLogger(__name__)


class ReportService:
    def _reports_dir(self) -> str:
        os.makedirs(settings.REPORTS_DIR, exist_ok=True)
        return settings.REPORTS_DIR

    def generate_report(
        self,
        db: Session,
        report_type: ReportType,
        hours: int = 24,
    ) -> Report:
        end_dt = datetime.now(timezone.utc)
        start_dt = end_dt - timedelta(hours=hours)

        sensor_ids = ["PS-001", "FS-002", "ACS-003", "IR-004"]
        meta = {"sensors": {}}

        for sid in sensor_ids:
            readings = analytics_service.get_readings_window(db, sid, hours)
            stats = analytics_service.compute_statistics(readings)
            meta["sensors"][sid] = stats

        kpi = analytics_service.get_kpi_snapshot(db)
        meta["kpi_snapshot"] = kpi

        timestamp_str = end_dt.strftime("%Y%m%d_%H%M%S")
        filename = f"{report_type.value.lower()}_{timestamp_str}.json"
        filepath = os.path.join(self._reports_dir(), filename)

        with open(filepath, "w") as f:
            json.dump({
                "report_type": report_type.value,
                "generated_at": end_dt.isoformat(),
                "time_range_start": start_dt.isoformat(),
                "time_range_end": end_dt.isoformat(),
                "data": meta,
            }, f, indent=2)

        report = Report(
            report_type=report_type,
            title=f"{report_type.value} Report — {end_dt.strftime('%Y-%m-%d %H:%M UTC')}",
            time_range_start=start_dt,
            time_range_end=end_dt,
            file_path=filepath,
            metadata_json=meta,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        logger.info("Report generated: %s", filepath)
        return report

    def get_sensor_health_summary(self, db: Session) -> list:
        sensor_ids = ["PS-001", "FS-002", "ACS-003", "IR-004"]
        result = []
        for sid in sensor_ids:
            readings = analytics_service.get_readings_window(db, sid, hours=24)
            stats = analytics_service.compute_statistics(readings)
            result.append({
                "sensor_id": sid,
                "reading_count": stats["count"],
                "anomaly_count": stats["anomaly_count"],
                "anomaly_rate": stats.get("anomaly_rate", 0),
                "mean_value": stats["mean"],
                "uptime_percent": stats["uptime_percent"],
            })
        return result


report_service = ReportService()
