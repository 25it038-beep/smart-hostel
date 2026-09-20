import time


def test_device_heartbeat_and_status(client):
    payload = {
        "device_id": "ESP32_ROOM_01",
        "room_id": "ROOM_01",
        "ip_address": "192.168.1.105",
        "firmware_version": "v1.0.0",
    }
    response = client.post("/api/devices/heartbeat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["device_id"] == "ESP32_ROOM_01"
    assert data["status"] == "CONNECTED"
    assert data["seconds_since_seen"] < 2.0


def test_list_devices(client):
    response = client.get("/api/devices")
    assert response.status_code == 200
    devices = response.json()
    assert len(devices) >= 1
    dev = next(d for d in devices if d["device_id"] == "ESP32_ROOM_01")
    assert dev["ip_address"] == "192.168.1.105"


def test_get_single_device(client):
    response = client.get("/api/devices/ESP32_ROOM_01")
    assert response.status_code == 200
    data = response.json()
    assert data["device_id"] == "ESP32_ROOM_01"
