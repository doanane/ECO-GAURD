from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.reading import SensorReading
from app.utils.signal_math import rolling_mean, rolling_std, z_score
from app.utils.time_series import bucket_readings
from collections import deque


class AnalyticsService:
    def get_readings_window(
        self, db: Session, sensor_id: str, hours: int = 48
    ) -> List[SensorReading]:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        return (
            db.query(SensorReading)
            .filter(
                SensorReading.sensor_id == sensor_id,
                SensorReading.timestamp >= cutoff,
            )
            .order_by(SensorReading.timestamp.asc())
            .all()
        )

    def get_all_latest(self, db: Session) -> Dict[str, SensorReading]:
        sensor_ids = ["PS-001", "FS-002", "ACS-003", "IR-004"]
        result = {}
        for sid in sensor_ids:
            reading = (
                db.query(SensorReading)
                .filter(SensorReading.sensor_id == sid)
                .order_by(SensorReading.timestamp.desc())
                .first()
            )
            if reading:
                result[sid] = reading
        return result

    def compute_statistics(self, readings: List[SensorReading]) -> Dict:
        if not readings:
            return {
                "count": 0, "mean": 0, "std": 0, "min": 0,
                "max": 0, "anomaly_count": 0, "uptime_percent": 0,
            }
        values = [r.value for r in readings]
        hist = deque(values)
        mean = rolling_mean(hist)
        std = rolling_std(hist)
        anomaly_count = sum(1 for r in readings if r.is_anomaly)
        return {
            "count": len(readings),
            "mean": round(mean, 3),
            "std": round(std, 3),
            "min": round(min(values), 3),
            "max": round(max(values), 3),
            "anomaly_count": anomaly_count,
            "anomaly_rate": round(anomaly_count / len(readings) * 100, 2),
            "uptime_percent": 100.0,
        }

    def detect_anomalies(self, readings: List[SensorReading], window: int = 20) -> List[Dict]:
        result = []
        for i, r in enumerate(readings):
            if not r.is_anomaly:
                continue
            window_vals = [readings[j].value for j in range(max(0, i - window), i)]
            if len(window_vals) < 3:
                continue
            hist = deque(window_vals)
            mean = rolling_mean(hist)
            std = rolling_std(hist)
            z = z_score(r.value, mean, std)
            result.append({
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                "value": r.value,
                "z_score": round(z, 3),
                "leak_probability": r.leak_probability,
                "sensor_id": r.sensor_id,
            })
        return result

    def get_trend_buckets(self, db: Session, sensor_id: str, hours: int = 48) -> List[Dict]:
        readings = self.get_readings_window(db, sensor_id, hours)
        return bucket_readings(readings, bucket_minutes=5)

    def get_kpi_snapshot(self, db: Session) -> Dict:
        from app.services.leak_detection_service import leak_detection_service

        latest = self.get_all_latest(db)
        probs = {sid: r.leak_probability for sid, r in latest.items()}
        composite_risk = leak_detection_service.compute_composite_risk(probs)
        risk_level = leak_detection_service.classify_risk_level(composite_risk)

        return {
            "pressure": {
                "value": round(latest["PS-001"].value, 2) if "PS-001" in latest else None,
                "unit": "PSI",
                "is_anomaly": latest["PS-001"].is_anomaly if "PS-001" in latest else False,
                "leak_probability": latest["PS-001"].leak_probability if "PS-001" in latest else 0.0,
            },
            "flow": {
                "value": round(latest["FS-002"].value, 2) if "FS-002" in latest else None,
                "unit": "L/min",
                "is_anomaly": latest["FS-002"].is_anomaly if "FS-002" in latest else False,
                "leak_probability": latest["FS-002"].leak_probability if "FS-002" in latest else 0.0,
            },
            "acoustic": {
                "value": round(latest["ACS-003"].value, 2) if "ACS-003" in latest else None,
                "unit": "dB",
                "is_anomaly": latest["ACS-003"].is_anomaly if "ACS-003" in latest else False,
                "leak_probability": latest["ACS-003"].leak_probability if "ACS-003" in latest else 0.0,
            },
            "infrared": {
                "value": round(latest["IR-004"].value, 2) if "IR-004" in latest else None,
                "unit": "C",
                "is_anomaly": latest["IR-004"].is_anomaly if "IR-004" in latest else False,
                "leak_probability": latest["IR-004"].leak_probability if "IR-004" in latest else 0.0,
            },
            "composite_risk": composite_risk,
            "risk_level": risk_level,
        }


analytics_service = AnalyticsService()
