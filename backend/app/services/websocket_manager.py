import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        self._pipeline_connections: Set[WebSocket] = set()
        self._sensor_connections: Dict[str, Set[WebSocket]] = {}

    async def connect_pipeline(self, ws: WebSocket):
        await ws.accept()
        self._pipeline_connections.add(ws)
        logger.info("WS pipeline client connected. Total: %d", len(self._pipeline_connections))

    def disconnect_pipeline(self, ws: WebSocket):
        self._pipeline_connections.discard(ws)
        logger.info("WS pipeline client disconnected. Total: %d", len(self._pipeline_connections))

    async def connect_sensor(self, sensor_id: str, ws: WebSocket):
        await ws.accept()
        self._sensor_connections.setdefault(sensor_id, set()).add(ws)
        logger.info("WS sensor[%s] client connected.", sensor_id)

    def disconnect_sensor(self, sensor_id: str, ws: WebSocket):
        if sensor_id in self._sensor_connections:
            self._sensor_connections[sensor_id].discard(ws)

    def _wrap(self, msg_type: str, payload: dict) -> str:
        return json.dumps({
            "type": msg_type,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    async def _safe_send(self, ws: WebSocket, data: str) -> bool:
        try:
            await ws.send_text(data)
            return True
        except Exception:
            return False

    async def broadcast_reading(self, sensor_id: str, payload: dict):
        data = self._wrap("sensor_reading", payload)
        dead = set()

        for ws in list(self._pipeline_connections):
            if not await self._safe_send(ws, data):
                dead.add(ws)

        for ws in dead:
            self._pipeline_connections.discard(ws)

        if sensor_id in self._sensor_connections:
            sdead = set()
            for ws in list(self._sensor_connections[sensor_id]):
                if not await self._safe_send(ws, data):
                    sdead.add(ws)
            for ws in sdead:
                self._sensor_connections[sensor_id].discard(ws)

    async def broadcast_alert(self, payload: dict):
        data = self._wrap("alert", payload)
        dead = set()
        for ws in list(self._pipeline_connections):
            if not await self._safe_send(ws, data):
                dead.add(ws)
        for ws in dead:
            self._pipeline_connections.discard(ws)

    async def send_heartbeat(self):
        data = self._wrap("heartbeat", {"status": "ok", "connections": len(self._pipeline_connections)})
        dead = set()
        for ws in list(self._pipeline_connections):
            if not await self._safe_send(ws, data):
                dead.add(ws)
        for ws in dead:
            self._pipeline_connections.discard(ws)

    def connection_count(self) -> int:
        return len(self._pipeline_connections)


ws_manager = WebSocketManager()
