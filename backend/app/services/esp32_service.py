from datetime import datetime, timezone
from typing import Dict, Optional
from sqlalchemy.orm import Session
from ..models import Device, RoomSetting, LightEvent, utcnow

OFFLINE_THRESHOLD_SECONDS = 20.0


class ESP32Service:
    def __init__(self):
        # In-memory command queue per device/room: {device_id or room_id: {"command": ..., "timestamp": ...}}
        self.pending_commands: Dict[str, dict] = {}

    def get_device_status(self, device: Device) -> str:
        """Determines if device is CONNECTED or OFFLINE based on last_seen timestamp."""
        if not device or not device.last_seen:
            return "OFFLINE"

        now = datetime.now(timezone.utc)
        # ensure device.last_seen has timezone
        last_seen = device.last_seen
        if last_seen.tzinfo is None:
            last_seen = last_seen.replace(tzinfo=timezone.utc)

        diff = (now - last_seen).total_seconds()
        return "CONNECTED" if diff <= OFFLINE_THRESHOLD_SECONDS else "OFFLINE"

    def record_heartbeat(
        self,
        db: Session,
        device_id: str,
        room_id: str,
        ip_address: Optional[str] = None,
        firmware_version: Optional[str] = "v1.0.0",
    ) -> Device:
        """Updates device heartbeat, IP, and status."""
        device = db.query(Device).filter(Device.device_id == device_id).first()
        now = utcnow()

        if not device:
            device = Device(
                device_id=device_id,
                room_id=room_id,
                ip_address=ip_address,
                firmware_version=firmware_version or "v1.0.0",
                last_seen=now,
                status="CONNECTED",
            )
            db.add(device)
        else:
            device.room_id = room_id
            if ip_address:
                device.ip_address = ip_address
            if firmware_version:
                device.firmware_version = firmware_version
            device.last_seen = now
            device.status = "CONNECTED"

        db.commit()
        db.refresh(device)
        return device

    def queue_light_command(self, room_id: str, mode: str, state: Optional[bool]) -> dict:
        """Queues a light command for ESP32 hardware polling."""
        cmd = {
            "mode": mode,
            "state": state,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.pending_commands[room_id] = cmd
        return cmd

    def get_pending_command(self, room_id: str) -> Optional[dict]:
        """Returns and pops any pending command for this room/device."""
        return self.pending_commands.get(room_id)

    def acknowledge_command(self, room_id: str):
        if room_id in self.pending_commands:
            del self.pending_commands[room_id]


esp32_service = ESP32Service()
