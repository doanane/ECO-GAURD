from typing import Dict, Optional


SENSOR_WEIGHTS = {
    "PS-001": 0.35,  # Pressure
    "FS-002": 0.30,  # Flow
    "ACS-003": 0.25,  # Acoustic
    "IR-004": 0.10,  # Infrared
}


class LeakDetectionService:
    def compute_composite_risk(self, sensor_probabilities: Dict[str, float]) -> float:
        """
        Fuse individual sensor leak probabilities into a single composite risk score [0, 100].
        Uses weighted average with bonus multiplier when multiple sensors show anomalies simultaneously.
        """
        if not sensor_probabilities:
            return 0.0

        weighted_sum = 0.0
        weight_used = 0.0
        anomaly_count = 0

        for sensor_id, prob in sensor_probabilities.items():
            weight = SENSOR_WEIGHTS.get(sensor_id, 0.1)
            weighted_sum += prob * weight
            weight_used += weight
            if prob > 0.5:
                anomaly_count += 1

        if weight_used == 0:
            return 0.0

        base_risk = (weighted_sum / weight_used) * 100.0

        # Correlation bonus: multiple sensors triggered simultaneously
        if anomaly_count >= 3:
            base_risk = min(base_risk * 1.45, 100.0)
        elif anomaly_count == 2:
            base_risk = min(base_risk * 1.2, 100.0)

        return round(base_risk, 2)

    def classify_risk_level(self, risk_score: float) -> str:
        if risk_score >= 70.0:
            return "CRITICAL"
        if risk_score >= 40.0:
            return "WARNING"
        return "NOMINAL"

    def classify_leak_severity(self, risk_score: float) -> str:
        return self.classify_risk_level(risk_score)


leak_detection_service = LeakDetectionService()
