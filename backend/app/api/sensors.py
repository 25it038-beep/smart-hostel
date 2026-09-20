from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import SensorReading, Room, Device, LightEvent, RoomSetting, utcnow
from ..schemas import SensorDataCreate, SensorReadingResponse
from ..services.websocket_service import ws_service
from ..services.esp32_service import esp32_service

router = APIRouter(tags=["Sensors"])


@router.post("/api/sensors/data", response_model=SensorReadingResponse, status_code=201)
async def ingest_sensor_data(payload: SensorDataCreate, db: Session = Depends(get_db)):
    """
    Ingest live sensor telemetry from ESP32 or simulation engine.
    Stores reading, logs light events on state transition, and broadcasts to WebSocket clients.
    """
    # Ensure room exists
    room = db.query(Room).filter(Room.room_id == payload.room_id).first()
    if not room:
        room = Room(room_id=payload.room_id, name=f"Room {payload.room_id}")
        db.add(room)
        db.commit()

    # Ensure device exists and update its status
    device = db.query(Device).filter(Device.device_id == payload.device_id).first()
    now = utcnow()
    if not device:
        device = Device(
            device_id=payload.device_id,
            room_id=payload.room_id,
            last_seen=now,
            status="CONNECTED",
        )
        db.add(device)
    else:
        device.last_seen = now
        device.status = "CONNECTED"

    # Get previous reading to detect light state transitions
    prev_reading = (
        db.query(SensorReading)
        .filter(SensorReading.room_id == payload.room_id)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )

    reading_ts = payload.timestamp or now
    if reading_ts.tzinfo is None:
        reading_ts = reading_ts.replace(tzinfo=timezone.utc)

    new_reading = SensorReading(
        room_id=payload.room_id,
        device_id=payload.device_id,
        temperature=payload.temperature,
        humidity=payload.humidity,
        occupancy=payload.occupancy,
        light_state=payload.light_state,
        timestamp=reading_ts,
    )
    db.add(new_reading)

    # If light state changed, log LightEvent
    if prev_reading is None or prev_reading.light_state != payload.light_state:
        setting = db.query(RoomSetting).filter(RoomSetting.room_id == payload.room_id).first()
        mode = setting.light_mode if setting else "AUTO"
        reason = "MOTION_DETECTED" if payload.occupancy and payload.light_state else "INACTIVITY_TIMEOUT"
        if not payload.occupancy and not payload.light_state:
            reason = "INACTIVITY_TIMEOUT"
        elif mode == "MANUAL":
            reason = "MANUAL_COMMAND"

        event = LightEvent(
            room_id=payload.room_id,
            device_id=payload.device_id,
            state=payload.light_state,
            mode=mode,
            reason=reason,
            timestamp=reading_ts,
        )
        db.add(event)

    db.commit()
    db.refresh(new_reading)

    # Broadcast via WebSocket
    ws_payload = {
        "event": "sensor_update",
        "room_id": payload.room_id,
        "device_id": payload.device_id,
        "temperature": new_reading.temperature,
        "humidity": new_reading.humidity,
        "occupancy": new_reading.occupancy,
        "light_state": new_reading.light_state,
        "timestamp": new_reading.timestamp.isoformat(),
        "device_status": "CONNECTED",
    }
    await ws_service.broadcast_to_room(payload.room_id, ws_payload)

    return new_reading


@router.get("/api/rooms/{room_id}/sensors/latest", response_model=Optional[SensorReadingResponse])
def get_latest_sensor_data(room_id: str, db: Session = Depends(get_db)):
    """Fetch the most recent sensor reading for a given room."""
    reading = (
        db.query(SensorReading)
        .filter(SensorReading.room_id == room_id)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )
    if not reading:
        return None
    return reading


@router.get("/api/rooms/{room_id}/sensors/history", response_model=List[SensorReadingResponse])
def get_sensor_history(
    room_id: str,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Fetch recent sensor history for charts and timelines."""
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.room_id == room_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(limit)
        .all()
    )
    # Return in chronological order for charting
    return list(reversed(readings))
