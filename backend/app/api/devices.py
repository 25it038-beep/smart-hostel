import socket
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Device, Room
from ..schemas import DeviceHeartbeatCreate, DeviceResponse
from ..services.esp32_service import esp32_service

router = APIRouter(prefix="/api/devices", tags=["Devices"])


def get_local_ip_addresses() -> List[str]:
    """Auto-detects the host machine's non-loopback local network IP addresses."""
    ips = []
    try:
        # Standard UDP trick to determine outbound network interface IP without sending packets
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0)
        try:
            s.connect(('8.8.8.8', 1))
            primary_ip = s.getsockname()[0]
            if primary_ip and not primary_ip.startswith('127.'):
                ips.append(primary_ip)
        except Exception:
            pass
        finally:
            s.close()

        # Fallback to gethostbyname_ex
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith("127.") and not ip.startswith("169.254.") and ip not in ips:
                ips.append(ip)
    except Exception:
        pass

    if not ips:
        ips.append("192.168.0.102")
    return ips


def enrich_device(device: Device) -> dict:
    status = esp32_service.get_device_status(device)
    now = datetime.now(timezone.utc)
    last_seen = device.last_seen
    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=timezone.utc)
    seconds_since_seen = max(0.0, (now - last_seen).total_seconds())

    return {
        "id": device.id,
        "device_id": device.device_id,
        "room_id": device.room_id,
        "ip_address": device.ip_address,
        "firmware_version": device.firmware_version,
        "last_seen": device.last_seen,
        "status": status,
        "seconds_since_seen": round(seconds_since_seen, 1),
    }


@router.get("/network-info")
def get_network_info():
    """Returns local server network coordinates to configure ESP32 firmware."""
    detected_ips = get_local_ip_addresses()
    primary_ip = detected_ips[0] if detected_ips else "192.168.0.102"

    return {
        "primary_ip": primary_ip,
        "detected_ips": detected_ips,
        "port": 8000,
        "api_base_url": f"http://{primary_ip}:8000",
        "ws_base_url": f"ws://{primary_ip}:8000",
        "endpoints": {
            "sensor_post": f"http://{primary_ip}:8000/api/sensors/data",
            "heartbeat_post": f"http://{primary_ip}:8000/api/devices/heartbeat",
            "command_poll": f"http://{primary_ip}:8000/api/rooms/ROOM_01/command",
        }
    }


@router.post("/heartbeat", response_model=DeviceResponse)
def receive_heartbeat(payload: DeviceHeartbeatCreate, db: Session = Depends(get_db)):
    """Receives periodic heartbeat ping from ESP32."""
    # Ensure room exists
    room = db.query(Room).filter(Room.room_id == payload.room_id).first()
    if not room:
        room = Room(room_id=payload.room_id, name=f"Room {payload.room_id}")
        db.add(room)
        db.commit()

    device = esp32_service.record_heartbeat(
        db=db,
        device_id=payload.device_id,
        room_id=payload.room_id,
        ip_address=payload.ip_address,
        firmware_version=payload.firmware_version,
    )

    return enrich_device(device)


@router.get("", response_model=List[DeviceResponse])
def list_devices(db: Session = Depends(get_db)):
    """List all registered ESP32 devices and their current live connection status."""
    devices = db.query(Device).all()
    if not devices:
        return []
    return [enrich_device(d) for d in devices]


@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(device_id: str, db: Session = Depends(get_db)):
    """Retrieve telemetry and connection status for a specific device."""
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail=f"Device {device_id} not found")
    return enrich_device(device)
