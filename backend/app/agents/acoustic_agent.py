import random
from collections import deque
from typing import Deque

from app.agents.base_agent import BaseSensorAgent
from app.utils.signal_math import (
    gaussian_noise, sinusoidal_drift, clamp,
    rolling_mean, rolling_std, leak_probability_from_z, z_score
)

NOMINAL_CENTER = 40.0
NOMINAL_NOISE_STD = 2.0
DRIFT_AMPLITUDE = 2.0
DRIFT_PERIOD = 60.0
WARNING_HIGH = 70.0
CRITICAL_HIGH = 85.0

LEAK_SPIKE_DB = 35.0
LEAK_SUSTAINED_ELEVATION = 18.0
LEAK_RAMP = 3.5
LEAK_RECOVERY = 1.2


class AcousticAgent(BaseSensorAgent):
    def __init__(self, db_session_factory, ws_manager):
        super().__init__(
            sensor_id="ACS-003",
            sensor_type="ACOUSTIC",
            unit="dB",
            db_session_factory=db_session_factory,
            ws_manager=ws_manager,
        )
        self.warning_threshold = WARNING_HIGH
        self.critical_threshold = CRITICAL_HIGH
        self._elevation = 0.0
        self._spike_fired = False

    def generate_reading(self) -> float:
        drift = sinusoidal_drift(self._sequence, DRIFT_AMPLITUDE, DRIFT_PERIOD)
        target = NOMINAL_CENTER + drift

        if self._simulating_leak:
            if not self._spike_fired:
                # First tick of leak: big spike
                self._elevation = LEAK_SPIKE_DB
                self._spike_fired = True
            else:
                # Settle to sustained elevation
                self._elevation = max(LEAK_SUSTAINED_ELEVATION, self._elevation - LEAK_RAMP)
        else:
            self._elevation = max(0.0, self._elevation - LEAK_RECOVERY)
            self._spike_fired = False

        target += self._elevation
        value = gaussian_noise(target, NOMINAL_NOISE_STD)
        return clamp(value, 20.0, 130.0)

    def compute_leak_probability(self, value: float, history: Deque[float]) -> float:
        if len(history) < 5:
            return 0.0
        mean = rolling_mean(history)
        std = rolling_std(history)
        z = z_score(value, mean, std)
        return leak_probability_from_z(z, direction="high")

    def _determine_alert_type(self, value: float):
        from app.models.alert import AlertType
        return AlertType.ACOUSTIC_SPIKE
