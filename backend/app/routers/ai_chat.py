import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Room, SensorReading, RoomSetting
from app.ai.nemotron_client import generate_nemotron_stream, NEMOTRON_MODEL, NVIDIA_BASE_URL

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    room_id: str = "ROOM_01"

@router.get("/models")
def get_model_info():
    return {
        "active_model": NEMOTRON_MODEL,
        "provider": "NVIDIA NIM",
        "base_url": NVIDIA_BASE_URL,
        "parameters": "30B",
        "thinking_enabled": True,
        "reasoning_budget": 2048,
        "capabilities": [
            "Hardware Telemetry Diagnostics",
            "Physical Thermodynamic Dew Point Analysis",
            "Autonomous Failsafe Validation",
            "Real-Time Deep Reasoning & Chain of Thought",
            "C++ Firmware Optimization"
        ]
    }

@router.post("/chat/stream")
async def chat_stream(req: ChatRequest, db: Session = Depends(get_db)):
    # 1. Fetch live room telemetry and settings
    room = db.query(Room).filter(Room.room_id == req.room_id).first()
    latest_sensor = (
        db.query(SensorReading)
        .filter(SensorReading.room_id == req.room_id)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )
    setting = db.query(RoomSetting).filter(RoomSetting.room_id == req.room_id).first()

    room_context = {
        "room_id": req.room_id,
        "temperature": latest_sensor.temperature if latest_sensor else 25.0,
        "humidity": latest_sensor.humidity if latest_sensor else 55.0,
        "occupancy": latest_sensor.occupancy if latest_sensor else False,
        "light_state": latest_sensor.light_state if latest_sensor else False,
        "timeout_seconds": setting.inactivity_timeout_sec if setting else 60,
        "light_mode": setting.light_mode if setting else "AUTO",
    }

    message_dicts = [{"role": m.role, "content": m.content} for m in req.messages]

    async def event_generator():
        # Run generator in threadpool since OpenAI client stream can be blocking
        queue = asyncio.Queue()
        loop = asyncio.get_running_loop()

        def producer():
            try:
                for item in generate_nemotron_stream(message_dicts, room_context):
                    loop.call_soon_threadsafe(queue.put_nowait, item)
            except Exception as e:
                loop.call_soon_threadsafe(queue.put_nowait, {"type": "error", "error": str(e)})
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, None)

        thread_task = loop.run_in_executor(None, producer)

        while True:
            item = await queue.get()
            if item is None:
                break
            yield f"data: {json.dumps(item)}\n\n"

        await thread_task

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
