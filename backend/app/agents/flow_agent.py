import random
from collections import deque
from typing import Deque

from app.agents.base_agent import BaseSensorAgent
from app.utils.signal_math import (
    gaussian_noise, sinusoidal_drift, clamp,
    rolling_mean, rolling_std, leak_probability_from_z, z_score
)

NOMINAL_CENTER = 200.0
NOMINAL_NOISE_STD = 1.5
DRIFT_AMPLITUDE = 5.0
DRIFT_PERIOD = 90.0
WARNING_LOW = 150.0
CRITICAL_LOW = 140.0
WARNING_HIGH = 250.0
CRITICAL_HIGH = 260.0

LEAK_FLOW_DROP_FACTOR = 0.30  # up to 30% reduction
LEAK_DROP_RAMP = 0.04         # ramp up per tick
LEAK_RECOVERY_RAMP = 0.015


class FlowAgent(BaseSensorAgent):
    def __init__(self, db_session_factory, ws_manager):
        super().__init__(
            sensor_id="FS-002",
            sensor_type="FLOW",
            unit="L/min",
            db_session_factory=db_session_factory,
            ws_manager=ws_manager,
        )
        self.warning_threshold = WARNING_LOW
        self.critical_threshold = CRITICAL_LOW
        self._drop_factor = 0.0  # current active drop ratio

    def generate_reading(self) -> float:
        drift = sinusoidal_drift(self._sequence, DRIFT_AMPLITUDE, DRIFT_PERIOD)
        target = NOMINAL_CENTER + drift

        if self._simulating_leak:
            self._drop_factor = min(self._drop_factor + LEAK_DROP_RAMP, LEAK_FLOW_DROP_FACTOR)
        else:
            self._drop_factor = max(0.0, self._drop_factor - LEAK_RECOVERY_RAMP)

        target *= (1.0 - self._drop_factor)
        value = gaussian_noise(target, NOMINAL_NOISE_STD)
        return clamp(value, 60.0, 320.0)

    def compute_leak_probability(self, value: float, history: Deque[float]) -> float:
        if len(history) < 5:
            return 0.0
        mean = rolling_mean(history)
        std = rolling_std(history)
        z = z_score(value, mean, std)
        return leak_probability_from_z(z, direction="low")

    def _determine_alert_type(self, value: float):
        from app.models.alert import AlertType
        return AlertType.FLOW_DEVIATION
