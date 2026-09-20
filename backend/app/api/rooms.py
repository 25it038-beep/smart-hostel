from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Room, RoomSetting, Device, SensorReading
from ..schemas import RoomCreate, RoomResponse, RoomSettingsUpdate, RoomSettingsResponse
from ..services.esp32_service import esp32_service

router = APIRouter(prefix="/api/rooms", tags=["Rooms"])


def build_room_response(room: Room, db: Session) -> dict:
    device = db.query(Device).filter(Device.room_id == room.room_id).first()
    device_status = esp32_service.get_device_status(device) if device else "OFFLINE"

    latest_reading = (
        db.query(SensorReading)
        .filter(SensorReading.room_id == room.room_id)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )

    setting = db.query(RoomSetting).filter(RoomSetting.room_id == room.room_id).first()
    if not setting:
        setting = RoomSetting(room_id=room.room_id)
        db.add(setting)
        db.commit()
        db.refresh(setting)

    return {
        "id": room.id,
        "room_id": room.room_id,
        "name": room.name,
        "created_at": room.created_at,
        "device_status": device_status,
        "latest_reading": latest_reading,
        "settings": setting,
    }


@router.get("", response_model=List[RoomResponse])
def get_rooms(db: Session = Depends(get_db)):
    """List all configured hostel rooms."""
    rooms = db.query(Room).all()
    # If no rooms exist yet, seed default ROOM_01
    if not rooms:
        default_room = Room(room_id="ROOM_01", name="Room 101 (Prototype)")
        db.add(default_room)
        db.commit()
        db.refresh(default_room)
        setting = RoomSetting(room_id="ROOM_01", light_mode="AUTO", inactivity_timeout_sec=60)
        db.add(setting)
        db.commit()
        rooms = [default_room]

    return [build_room_response(r, db) for r in rooms]


@router.get("/{room_id}", response_model=RoomResponse)
def get_room(room_id: str, db: Session = Depends(get_db)):
    """Fetch details and status of a single room."""
    room = db.query(Room).filter(Room.room_id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail=f"Room {room_id} not found")
    return build_room_response(room, db)


@router.post("", response_model=RoomResponse, status_code=201)
def create_room(payload: RoomCreate, db: Session = Depends(get_db)):
    """Register a new room for expansion (e.g. ROOM_02, ROOM_03)."""
    existing = db.query(Room).filter(Room.room_id == payload.room_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Room {payload.room_id} already exists")

    room = Room(room_id=payload.room_id, name=payload.name)
    db.add(room)
    db.commit()
    db.refresh(room)

    setting = RoomSetting(room_id=payload.room_id, light_mode="AUTO", inactivity_timeout_sec=60)
    db.add(setting)
    db.commit()

    return build_room_response(room, db)


@router.put("/{room_id}/settings", response_model=RoomSettingsResponse)
def update_room_settings(room_id: str, payload: RoomSettingsUpdate, db: Session = Depends(get_db)):
    """Update settings (timeout, mode, intervals) for a specific room."""
    setting = db.query(RoomSetting).filter(RoomSetting.room_id == room_id).first()
    if not setting:
        room = db.query(Room).filter(Room.room_id == room_id).first()
        if not room:
            raise HTTPException(status_code=404, detail=f"Room {room_id} not found")
        setting = RoomSetting(room_id=room_id)
        db.add(setting)

    if payload.light_mode is not None:
        setting.light_mode = payload.light_mode
    if payload.inactivity_timeout_sec is not None:
        setting.inactivity_timeout_sec = payload.inactivity_timeout_sec
    if payload.temperature_interval_sec is not None:
        setting.temperature_interval_sec = payload.temperature_interval_sec
    if payload.humidity_interval_sec is not None:
        setting.humidity_interval_sec = payload.humidity_interval_sec
    if payload.heartbeat_interval_sec is not None:
        setting.heartbeat_interval_sec = payload.heartbeat_interval_sec

    db.commit()
    db.refresh(setting)
    return setting
