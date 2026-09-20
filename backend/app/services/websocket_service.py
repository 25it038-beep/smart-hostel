import json
import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger("websocket_service")


class WebSocketService:
    def __init__(self):
        # Map room_id -> list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        logger.info(f"Client connected to room {room_id}. Active: {len(self.active_connections[room_id])}")

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        logger.info(f"Client disconnected from room {room_id}")

    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id not in self.active_connections:
            return

        dead_sockets = []
        payload = json.dumps(message, default=str)

        for connection in self.active_connections[room_id]:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Failed to send to a websocket client in room {room_id}: {e}")
                dead_sockets.append(connection)

        for dead in dead_sockets:
            self.disconnect(room_id, dead)


ws_service = WebSocketService()
