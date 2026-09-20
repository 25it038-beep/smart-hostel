from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import RoomSetting, Device, SensorReading, LightEvent, utcnow
from ..schemas import LightCommandRequest, LightStateResponse
from ..services.esp32_service import esp32_service
from ..services.websocket_service import ws_service

router = APIRouter(tags=["Light Control"])


@router.get("/api/rooms/{room_id}/light", response_model=LightStateResponse)
def get_room_light_state(room_id: str, db: Session = Depends(get_db)):
    """Fetch current light mode, relay command state, and command acknowledgment status."""
    setting = db.query(RoomSetting).filter(RoomSetting.room_id == room_id).first()
    if not setting:
        setting = RoomSetting(room_id=room_id)
        db.add(setting)
        db.commit()
        db.refresh(setting)

    latest_reading = (
        db.query(SensorReading)
        .filter(SensorReading.room_id == room_id)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )

    current_state = latest_reading.light_state if latest_reading else False

    # Check if there is an unacknowledged command in flight
    pending = esp32_service.get_pending_command(room_id)
    cmd_status = "PENDING_HARDWARE" if pending else "ACKNOWLEDGED"

    return {
        "room_id": room_id,
        "mode": setting.light_mode,
        "light_state": current_state,
        "inactivity_timeout_sec": setting.inactivity_timeout_sec,
        "command_status": cmd_status,
        "message": "Current hardware relay status loaded.",
        "last_updated": latest_reading.timestamp if latest_reading else datetime.now(timezone.utc),
    }


@router.post("/api/rooms/{room_id}/light", response_model=LightStateResponse)
async def control_room_light(room_id: str, payload: LightCommandRequest, db: Session = Depends(get_db)):
    """
    Send control command to change operating mode (AUTO / MANUAL) or switch light state ON/OFF.
    Checks ESP32 online connectivity before dispatching.
    """
    setting = db.query(RoomSetting).filter(RoomSetting.room_id == room_id).first()
    if not setting:
        setting = RoomSetting(room_id=room_id)
        db.add(setting)

    # Check device connectivity
    device = db.query(Device).filter(Device.room_id == room_id).first()
    device_status = esp32_service.get_device_status(device) if device else "OFFLINE"

    if payload.mode:
        setting.light_mode = payload.mode

    if payload.state is not None:
        setting.target_light_state = payload.state

    db.commit()
    db.refresh(setting)

    # If ESP32 is offline, reject command with explicit notice per requirements
    if device_status == "OFFLINE":
        # Log event attempt
        return {
            "room_id": room_id,
            "mode": setting.light_mode,
            "light_state": setting.target_light_state,
            "inactivity_timeout_sec": setting.inactivity_timeout_sec,
            "command_status": "ESP32_OFFLINE",
            "message": "ESP32 OFFLINE: Unable to send command to physical hardware.",
            "last_updated": datetime.now(timezone.utc),
        }

    # Queue command for ESP32 polling / dispatch
    esp32_service.queue_light_command(
        room_id=room_id,
        mode=setting.light_mode,
        state=setting.target_light_state,
    )

    # Log light event
    if payload.state is not None:
        event = LightEvent(
            room_id=room_id,
            device_id=device.device_id if device else None,
            state=payload.state,
            mode=setting.light_mode,
            reason="MANUAL_COMMAND" if setting.light_mode == "MANUAL" else "MODE_SWITCH",
            timestamp=utcnow(),
        )
        db.add(event)
        db.commit()

    # Broadcast update to connected frontend dashboards
    await ws_service.broadcast_to_room(
        room_id,
        {
            "event": "light_command_dispatched",
            "room_id": room_id,
            "mode": setting.light_mode,
            "light_state": setting.target_light_state,
            "command_status": "WAITING_FOR_ESP32",
        },
    )

    return {
        "room_id": room_id,
        "mode": setting.light_mode,
        "light_state": setting.target_light_state,
        "inactivity_timeout_sec": setting.inactivity_timeout_sec,
        "command_status": "WAITING_FOR_ESP32",
        "message": "Command sent. Waiting for ESP32...",
        "last_updated": datetime.now(timezone.utc),
    }


@router.get("/api/rooms/{room_id}/command")
def poll_device_command(room_id: str, db: Session = Depends(get_db)):
    """
    Endpoint polled by ESP32 to retrieve pending commands or config updates.
    Returns mode, target light state, timeout, and clears pending command queue.
    """
    setting = db.query(RoomSetting).filter(RoomSetting.room_id == room_id).first()
    mode = setting.light_mode if setting else "AUTO"
    timeout = setting.inactivity_timeout_sec if setting else 60

    pending = esp32_service.get_pending_command(room_id)
    esp32_service.acknowledge_command(room_id)

    return {
        "room_id": room_id,
        "mode": mode,
        "inactivity_timeout_sec": timeout,
        "has_command": pending is not None,
        "target_light_state": setting.target_light_state if setting else False,
        "command": pending,
    }
