import asyncio
import logging
from typing import Dict, Optional

from app.agents.base_agent import BaseSensorAgent
from app.agents.pressure_agent import PressureAgent
from app.agents.flow_agent import FlowAgent
from app.agents.acoustic_agent import AcousticAgent
from app.agents.infrared_agent import InfraredAgent

logger = logging.getLogger(__name__)

AGENT_CLASSES = {
    "PRESSURE": PressureAgent,
    "FLOW": FlowAgent,
    "ACOUSTIC": AcousticAgent,
    "INFRARED": InfraredAgent,
}


class AgentManager:
    def __init__(self):
        self._agents: Dict[str, BaseSensorAgent] = {}
        self._tasks: Dict[str, asyncio.Task] = {}

    def initialize_agents(self, db_session_factory, ws_manager):
        from app.models.sensor import SensorStatus

        db = db_session_factory()
        try:
            from app.models.sensor import Sensor
            sensors = db.query(Sensor).filter(Sensor.status == SensorStatus.ONLINE).all()
            for sensor in sensors:
                cls = AGENT_CLASSES.get(sensor.sensor_type.value)
                if cls:
                    agent = cls(db_session_factory=db_session_factory, ws_manager=ws_manager)
                    self._agents[sensor.sensor_id] = agent
                    logger.info("Agent initialized: %s (%s)", sensor.sensor_id, sensor.sensor_type.value)
        finally:
            db.close()

    def start_all(self):
        for sensor_id, agent in self._agents.items():
            task = asyncio.create_task(agent.run(), name=f"agent-{sensor_id}")
            self._tasks[sensor_id] = task
            logger.info("Agent task started: %s", sensor_id)

    def stop_all(self):
        for sensor_id, task in self._tasks.items():
            task.cancel()
            logger.info("Agent task cancelled: %s", sensor_id)
        self._tasks.clear()
        for agent in self._agents.values():
            agent._running = False

    def inject_leak(self, sensor_id: str, duration_ticks: int = 15) -> bool:
        agent = self._agents.get(sensor_id)
        if not agent:
            return False
        agent.inject_leak_event(duration_ticks)
        return True

    def inject_all_leaks(self, duration_ticks: int = 15):
        for agent in self._agents.values():
            agent.inject_leak_event(duration_ticks)

    def reset_all(self):
        for agent in self._agents.values():
            agent.reset()

    def get_agent_status(self) -> Dict:
        return {sid: agent.get_status() for sid, agent in self._agents.items()}

    def get_agent(self, sensor_id: str) -> Optional[BaseSensorAgent]:
        return self._agents.get(sensor_id)

    @property
    def agent_count(self) -> int:
        return len(self._agents)


agent_manager = AgentManager()
