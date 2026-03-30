import random
from collections import deque
from typing import Deque

from app.agents.base_agent import BaseSensorAgent
from app.utils.signal_math import (
    gaussian_noise, sinusoidal_drift, clamp,
    rolling_mean, rolling_std, leak_probability_from_z, z_score, rate_of_change
)

NOMINAL_CENTER = 22.0
NOMINAL_NOISE_STD = 0.3
DRIFT_AMPLITUDE = 1.5
DRIFT_PERIOD = 180.0
WARNING_HIGH = 35.0
CRITICAL_HIGH = 45.0

LEAK_RAMP_PER_TICK = 0.6
LEAK_MAX_ELEVATION = 18.0
LEAK_RECOVERY_RATE = 0.1


class InfraredAgent(BaseSensorAgent):
    def __init__(self, db_session_factory, ws_manager):
        super().__init__(
            sensor_id="IR-004",
            sensor_type="INFRARED",
            unit="C",
            db_session_factory=db_session_factory,
            ws_manager=ws_manager,
        )
        self.warning_threshold = WARNING_HIGH
        self.critical_threshold = CRITICAL_HIGH
        self._heat_elevation = 0.0

    def generate_reading(self) -> float:
        drift = sinusoidal_drift(self._sequence, DRIFT_AMPLITUDE, DRIFT_PERIOD)
        target = NOMINAL_CENTER + drift

        if self._simulating_leak:
            self._heat_elevation = min(
                self._heat_elevation + LEAK_RAMP_PER_TICK + random.uniform(0, 0.3),
                LEAK_MAX_ELEVATION,
            )
        else:
            self._heat_elevation = max(0.0, self._heat_elevation - LEAK_RECOVERY_RATE)

        target += self._heat_elevation
        value = gaussian_noise(target, NOMINAL_NOISE_STD)
        return clamp(value, -5.0, 90.0)

    def compute_leak_probability(self, value: float, history: Deque[float]) -> float:
        if len(history) < 5:
            return 0.0
        mean = rolling_mean(history)
        std = rolling_std(history)
        z = z_score(value, mean, std)
        prob_z = leak_probability_from_z(z, direction="high")

        roc = rate_of_change(history, n=3)
        prob_roc = clamp(roc / 2.0, 0.0, 1.0) if roc > 0.3 else 0.0

        return max(prob_z, prob_roc)

    def _determine_alert_type(self, value: float):
        from app.models.alert import AlertType
        return AlertType.IR_HOTSPOT
