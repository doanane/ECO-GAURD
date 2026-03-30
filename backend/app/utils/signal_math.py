import math
import random
from collections import deque
from typing import Deque


def gaussian_noise(value: float, std: float) -> float:
    return value + random.gauss(0, std)


def rolling_mean(history: Deque[float]) -> float:
    if not history:
        return 0.0
    return sum(history) / len(history)


def rolling_std(history: Deque[float]) -> float:
    if len(history) < 2:
        return 1.0
    mean = rolling_mean(history)
    variance = sum((x - mean) ** 2 for x in history) / (len(history) - 1)
    return math.sqrt(variance) if variance > 0 else 0.001


def z_score(value: float, mean: float, std: float) -> float:
    if std == 0:
        return 0.0
    return (value - mean) / std


def rate_of_change(history: Deque[float], n: int = 3) -> float:
    if len(history) < n + 1:
        return 0.0
    values = list(history)
    recent = values[-n:]
    older = values[-(n + 1)]
    return (recent[-1] - older) / n


def clamp(value: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, value))


def sinusoidal_drift(tick: int, amplitude: float, period: float) -> float:
    return amplitude * math.sin(2 * math.pi * tick / period)


def confidence_from_z(z: float) -> float:
    """Higher z-score (anomaly) → lower confidence."""
    return clamp(1.0 - (abs(z) / 4.0), 0.0, 1.0)


def leak_probability_from_z(z: float, direction: str = "low") -> float:
    """
    direction: 'low' for sensors where leak causes drop (pressure/flow),
               'high' for sensors where leak causes spike (acoustic/IR).
    """
    if direction == "low":
        signed_z = -z  # negative z means below mean → likely leak
    else:
        signed_z = z

    if signed_z <= 1.0:
        return 0.0
    if signed_z >= 3.5:
        return 1.0
    return clamp((signed_z - 1.0) / 2.5, 0.0, 1.0)
