import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.websocket_manager import ws_manager
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/pipeline")
async def pipeline_ws(websocket: WebSocket):
    await ws_manager.connect_pipeline(websocket)
    try:
        heartbeat_interval = settings.WEBSOCKET_HEARTBEAT_INTERVAL

        async def send_heartbeats():
            while True:
                await asyncio.sleep(heartbeat_interval)
                await ws_manager.send_heartbeat()

        heartbeat_task = asyncio.create_task(send_heartbeats())
        try:
            while True:
                data = await websocket.receive_text()
                try:
                    msg = json.loads(data)
                    if msg.get("type") == "ping":
                        await websocket.send_text(json.dumps({"type": "pong"}))
                except json.JSONDecodeError:
                    pass
        finally:
            heartbeat_task.cancel()

    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect_pipeline(websocket)


@router.websocket("/ws/sensor/{sensor_id}")
async def sensor_ws(websocket: WebSocket, sensor_id: str):
    await ws_manager.connect_sensor(sensor_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong", "sensor_id": sensor_id}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect_sensor(sensor_id, websocket)
