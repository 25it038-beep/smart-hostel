import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, get_db
from app.models import Room, RoomSetting, Device, SensorReading, LightEvent


def test_complete_end_to_end_prototype_scenario(client, db_session):
    """
    Executes the exact 15-step end-to-end test scenario specified in Section 34:
    1. ESP32 connects
    2. Dashboard shows CONNECTED
    3. DHT22 sends temperature/humidity
    4. Dashboard updates
    5. Person enters room
    6. PIR detects motion
    7. Relay turns ON
    8. Dashboard shows OCCUPIED + LIGHT ON
    9. Person leaves
    10. Timer starts
    11. Timeout expires
    12. Relay turns OFF
    13. Dashboard shows EMPTY + LIGHT OFF
    14. Sensor history is stored
    15. Analytics updates
    """
    room_id = "ROOM_01"
    device_id = "ESP32_ROOM_01"

    # 1. ESP32 connects: Device heartbeat sent
    heartbeat_payload = {
        "device_id": device_id,
        "room_id": room_id,
        "ip_address": "192.168.1.102",
        "firmware_version": "v1.0.0",
    }
    hb_resp = client.post("/api/devices/heartbeat", json=heartbeat_payload)
    assert hb_resp.status_code == 200

    # 2. Dashboard shows CONNECTED
    dev_resp = client.get(f"/api/devices/{device_id}")
    assert dev_resp.status_code == 200
    assert dev_resp.json()["status"] == "CONNECTED"

    # 3. DHT22 sends temperature/humidity (room initially empty, light OFF)
    t0 = datetime.now(timezone.utc) - timedelta(minutes=10)
    sensor_t0 = {
        "device_id": device_id,
        "room_id": room_id,
        "temperature": 28.2,
        "humidity": 60.5,
        "occupancy": False,
        "light_state": False,
        "timestamp": t0.isoformat(),
    }
    s0_resp = client.post("/api/sensors/data", json=sensor_t0)
    assert s0_resp.status_code == 201

    # 4. Dashboard updates: Check latest sensor state
    latest_resp = client.get(f"/api/rooms/{room_id}/sensors/latest")
    assert latest_resp.status_code == 200
    assert latest_resp.json()["occupancy"] is False
    assert latest_resp.json()["light_state"] is False

    # 5. Person enters room
    # 6. PIR detects motion -> occupancy = True
    # 7. Relay turns ON -> light_state = True
    t1 = t0 + timedelta(seconds=5)
    sensor_t1 = {
        "device_id": device_id,
        "room_id": room_id,
        "temperature": 28.4,
        "humidity": 61.2,
        "occupancy": True,
        "light_state": True,
        "timestamp": t1.isoformat(),
    }
    s1_resp = client.post("/api/sensors/data", json=sensor_t1)
    assert s1_resp.status_code == 201

    # 8. Dashboard shows OCCUPIED + LIGHT ON
    latest_resp1 = client.get(f"/api/rooms/{room_id}/sensors/latest")
    assert latest_resp1.status_code == 200
    d1 = latest_resp1.json()
    assert d1["occupancy"] is True
    assert d1["light_state"] is True

    # 9. Person leaves: PIR output becomes false, timer countdown begins
    # 10. Timer starts: For 60 seconds, light remains ON while waiting for timeout
    t2 = t1 + timedelta(seconds=20)
    sensor_t2 = {
        "device_id": device_id,
        "room_id": room_id,
        "temperature": 28.3,
        "humidity": 61.0,
        "occupancy": False,
        "light_state": True,  # Inactivity timer still counting down, relay stays ON!
        "timestamp": t2.isoformat(),
    }
    s2_resp = client.post("/api/sensors/data", json=sensor_t2)
    assert s2_resp.status_code == 201

    # 11. Timeout expires (e.g. 60s elapsed with no motion)
    # 12. Relay turns OFF
    t3 = t2 + timedelta(seconds=65)
    sensor_t3 = {
        "device_id": device_id,
        "room_id": room_id,
        "temperature": 28.1,
        "humidity": 60.8,
        "occupancy": False,
        "light_state": False,  # Relay turned OFF!
        "timestamp": t3.isoformat(),
    }
    s3_resp = client.post("/api/sensors/data", json=sensor_t3)
    assert s3_resp.status_code == 201

    # 13. Dashboard shows EMPTY + LIGHT OFF
    latest_resp3 = client.get(f"/api/rooms/{room_id}/sensors/latest")
    assert latest_resp3.status_code == 200
    d3 = latest_resp3.json()
    assert d3["occupancy"] is False
    assert d3["light_state"] is False

    # 14. Sensor history is stored
    hist_resp = client.get(f"/api/rooms/{room_id}/sensors/history?limit=10")
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert len(history) >= 4

    # 15. Analytics updates: Verify calculated ON duration and activation events
    analytics_resp = client.get(f"/api/rooms/{room_id}/analytics?timeframe=today")
    assert analytics_resp.status_code == 200
    an_data = analytics_resp.json()
    assert an_data["readings_count"] >= 4
    assert an_data["total_light_on_seconds"] > 0
    assert "relay command state" in an_data["disclaimer"]
