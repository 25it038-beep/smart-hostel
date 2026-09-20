import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Union, Any
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Room, SensorReading, RoomSetting
from app.ai.kimi_client import generate_kimi_k3_stream, KIMI_MODEL, KIMI_INVOKE_URL

router = APIRouter(prefix="/api/ai", tags=["AI Copilot"])

class ChatMessage(BaseModel):
    role: str
    content: Union[str, List[Any]]

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    room_id: str = "ROOM_01"
    image_url: Optional[str] = None
    model: Optional[str] = KIMI_MODEL

@router.get("/models")
def get_model_info():
    return {
        "active_model": KIMI_MODEL,
        "default_model": "moonshotai/kimi-k3",
        "provider": "Moonshot AI / NVIDIA Integrate",
        "invoke_url": KIMI_INVOKE_URL,
        "multimodal_vision": True,
        "reasoning_effort": "none",
        "speed_mode": "turbo_instant",
        "temperature": 0.7,
        "max_tokens": 2048,
        "seed": 0,
        "capabilities": [
            "Fast Direct Response (<50ms TTFT)",
            "Zero Reasoning Latency (Thinking Traces Avoided)",
            "Multimodal Vision (Image URL + Local Photo Attachment)",
            "Live Telemetry Diagnostics & Thermal Comfort",
            "Automatic Failsafe & Strict No-LDR Compliance"
        ]
    }

@router.post("/chat/stream")
def chat_stream(req: ChatRequest, db: Session = Depends(get_db)):
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

    def event_generator():
        try:
            for item in generate_kimi_k3_stream(message_dicts, room_context, req.image_url):
                yield f"data: {json.dumps(item)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
