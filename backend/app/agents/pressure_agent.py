import random
from collections import deque
from typing import Deque

from app.agents.base_agent import BaseSensorAgent
from app.utils.signal_math import (
    gaussian_noise, sinusoidal_drift, clamp,
    rolling_mean, rolling_std, leak_probability_from_z, z_score
)

NOMINAL_CENTER = 100.0
NOMINAL_NOISE_STD = 0.8
DRIFT_AMPLITUDE = 3.0
DRIFT_PERIOD = 120.0
WARNING_LOW = 75.0
CRITICAL_LOW = 70.0
WARNING_HIGH = 120.0
CRITICAL_HIGH = 130.0

# During a leak: pressure drops significantly
LEAK_DROP_PER_TICK = 2.5
LEAK_DROP_MAX = 28.0
LEAK_RECOVERY_RATE = 0.4


class PressureAgent(BaseSensorAgent):
    def __init__(self, db_session_factory, ws_manager):
        super().__init__(
            sensor_id="PS-001",
            sensor_type="PRESSURE",
            unit="PSI",
            db_session_factory=db_session_factory,
            ws_manager=ws_manager,
        )
        self.warning_threshold = WARNING_LOW
        self.critical_threshold = CRITICAL_LOW
        self._current_pressure = NOMINAL_CENTER
        self._leak_accumulated_drop = 0.0

    def generate_reading(self) -> float:
        drift = sinusoidal_drift(self._sequence, DRIFT_AMPLITUDE, DRIFT_PERIOD)
        target = NOMINAL_CENTER + drift

        if self._simulating_leak:
            drop = min(LEAK_DROP_PER_TICK + random.uniform(0, 1.5), LEAK_DROP_MAX)
            self._leak_accumulated_drop = min(
                self._leak_accumulated_drop + drop,
                LEAK_DROP_MAX,
            )
            target -= self._leak_accumulated_drop
        else:
            # Recovery
            self._leak_accumulated_drop = max(0.0, self._leak_accumulated_drop - LEAK_RECOVERY_RATE)
            target -= self._leak_accumulated_drop

        value = gaussian_noise(target, NOMINAL_NOISE_STD)
        self._current_pressure = clamp(value, 30.0, 160.0)
        return self._current_pressure

    def compute_leak_probability(self, value: float, history: Deque[float]) -> float:
        if len(history) < 5:
            return 0.0
        mean = rolling_mean(history)
        std = rolling_std(history)
        z = z_score(value, mean, std)
        return leak_probability_from_z(z, direction="low")

    def _determine_alert_type(self, value: float):
        from app.models.alert import AlertType
        if value < CRITICAL_LOW:
            return AlertType.PRESSURE_DROP
        if value > CRITICAL_HIGH:
            return AlertType.PRESSURE_SPIKE
        return AlertType.PRESSURE_DROP
