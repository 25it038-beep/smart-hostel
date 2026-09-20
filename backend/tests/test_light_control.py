def test_get_light_state(client):
    response = client.get("/api/rooms/ROOM_01/light")
    assert response.status_code == 200
    data = response.json()
    assert "mode" in data
    assert "light_state" in data
    assert "command_status" in data


def test_switch_light_mode_and_state(client):
    # Switch to MANUAL and turn light ON
    payload = {"mode": "MANUAL", "state": True}
    response = client.post("/api/rooms/ROOM_01/light", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "MANUAL"
    assert data["light_state"] is True

    # Check command polling endpoint that ESP32 calls
    poll_resp = client.get("/api/rooms/ROOM_01/command")
    assert poll_resp.status_code == 200
    poll_data = poll_resp.json()
    assert poll_data["mode"] == "MANUAL"
    assert poll_data["target_light_state"] is True


def test_command_when_esp32_offline(client, db_session):
    from app.models import Device
    from datetime import datetime, timezone, timedelta

    # Set device last_seen to 60 seconds ago (so it is OFFLINE)
    dev = db_session.query(Device).filter(Device.room_id == "ROOM_01").first()
    if dev:
        dev.last_seen = datetime.now(timezone.utc) - timedelta(seconds=60)
        db_session.commit()

    payload = {"mode": "MANUAL", "state": False}
    response = client.post("/api/rooms/ROOM_01/light", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["command_status"] == "ESP32_OFFLINE"
    assert "ESP32 OFFLINE" in data["message"]
