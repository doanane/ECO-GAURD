import asyncio
import logging
import random
from abc import ABC, abstractmethod
from collections import deque
from datetime import datetime, timezone
from typing import Deque, Callable

from app.core.config import settings
from app.utils.signal_math import rolling_mean, rolling_std, z_score, confidence_from_z

logger = logging.getLogger(__name__)

HISTORY_SIZE = 60


class BaseSensorAgent(ABC):
    def __init__(
        self,
        sensor_id: str,
        sensor_type: str,
        unit: str,
        db_session_factory: Callable,
        ws_manager,
    ):
        self.sensor_id = sensor_id
        self.sensor_type = sensor_type
        self.unit = unit
        self._db_session_factory = db_session_factory
        self._ws_manager = ws_manager

        self._history: Deque[float] = deque(maxlen=HISTORY_SIZE)
        self._simulating_leak: bool = False
        self._leak_tick_count: int = 0
        self._leak_duration: int = 0
        self._sequence: int = 0
        self._running: bool = False
        self._last_value: float = 0.0

        self.warning_threshold: float = 0.0
        self.critical_threshold: float = 0.0

    @abstractmethod
    def generate_reading(self) -> float:
        """Produce the next sensor value given the current agent state."""
        pass

    @abstractmethod
    def compute_leak_probability(self, value: float, history: Deque[float]) -> float:
        """Return a probability [0, 1] that a leak is occurring."""
        pass

    def inject_leak_event(self, duration_ticks: int = 15):
        self._simulating_leak = True
        self._leak_tick_count = 0
        self._leak_duration = duration_ticks
        logger.warning("[%s] Leak event injected for %d ticks.", self.sensor_id, duration_ticks)

    def reset(self):
        self._simulating_leak = False
        self._leak_tick_count = 0
        self._history.clear()
        self._sequence = 0
        logger.info("[%s] Agent reset.", self.sensor_id)

    def get_status(self) -> dict:
        return {
            "sensor_id": self.sensor_id,
            "running": self._running,
            "sequence": self._sequence,
            "last_value": self._last_value,
            "simulating_leak": self._simulating_leak,
        }

    async def run(self):
        self._running = True
        interval_s = settings.SENSOR_TICK_INTERVAL_MS / 1000.0
        logger.info("[%s] Agent started.", self.sensor_id)

        while self._running:
            await asyncio.sleep(interval_s)
            try:
                await self._tick()
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("[%s] Tick error: %s", self.sensor_id, exc)

        self._running = False
        logger.info("[%s] Agent stopped.", self.sensor_id)

    async def _tick(self):
        # Random chance of a leak event
        if not self._simulating_leak and random.random() < settings.LEAK_EVENT_PROBABILITY:
            self.inject_leak_event()

        if self._simulating_leak:
            self._leak_tick_count += 1
            if self._leak_tick_count >= self._leak_duration:
                self._simulating_leak = False
                logger.info("[%s] Leak simulation ended.", self.sensor_id)

        value = self.generate_reading()
        self._last_value = value
        self._history.append(value)
        self._sequence += 1

        mean = rolling_mean(self._history)
        std = rolling_std(self._history)
        z = z_score(value, mean, std)
        leak_prob = self.compute_leak_probability(value, self._history)
        confidence = confidence_from_z(z)
        is_anomaly = abs(z) > 2.8 or leak_prob > 0.6

        payload = {
            "sensor_id": self.sensor_id,
            "sensor_type": self.sensor_type,
            "value": round(value, 3),
            "unit": self.unit,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "is_anomaly": is_anomaly,
            "confidence_score": round(confidence, 3),
            "leak_probability": round(leak_prob, 3),
            "z_score": round(z, 3),
            "sequence": self._sequence,
            "agent_state": "LEAK" if self._simulating_leak else "NORMAL",
            "rolling_mean": round(mean, 3),
            "rolling_std": round(std, 3),
        }

        # Persist to DB
        await self._persist(payload)

        # Broadcast via WebSocket
        await self._ws_manager.broadcast_reading(self.sensor_id, payload)

        # Check thresholds and raise alerts
        if is_anomaly or leak_prob > 0.5:
            await self._check_and_alert(value, leak_prob, payload)

    async def _persist(self, payload: dict):
        from app.models.reading import SensorReading
        db = self._db_session_factory()
        try:
            reading = SensorReading(
                sensor_id=payload["sensor_id"],
                value=payload["value"],
                unit=payload["unit"],
                is_anomaly=payload["is_anomaly"],
                confidence_score=payload["confidence_score"],
                leak_probability=payload["leak_probability"],
                raw_noise_value=payload["value"],
                sequence_number=payload["sequence"],
                agent_state=payload["agent_state"],
            )
            db.add(reading)
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.error("[%s] Persist error: %s", self.sensor_id, exc)
        finally:
            db.close()

    async def _check_and_alert(self, value: float, leak_prob: float, payload: dict):
        from app.services.alert_service import alert_service
        from app.models.alert import AlertSeverity, AlertType

        db = self._db_session_factory()
        try:
            severity = AlertSeverity.CRITICAL if leak_prob > 0.75 else AlertSeverity.WARNING
            alert_type = self._determine_alert_type(value)
            message = (
                f"{self.sensor_id} detected anomaly: value={value:.2f} {self.unit}, "
                f"leak probability={leak_prob:.1%}, z-score={payload['z_score']:.2f}"
            )
            await alert_service.create_alert(
                db=db,
                sensor_id=self.sensor_id,
                alert_type=alert_type,
                severity=severity,
                value=value,
                threshold=self.warning_threshold,
                message=message,
            )
        except Exception as exc:
            logger.error("[%s] Alert creation error: %s", self.sensor_id, exc)
        finally:
            db.close()

    def _determine_alert_type(self, value: float):
        from app.models.alert import AlertType
        return AlertType.COMPOSITE_RISK
