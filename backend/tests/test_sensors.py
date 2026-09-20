def test_ingest_sensor_data_valid(client):
    payload = {
        "device_id": "ESP32_ROOM_01",
        "room_id": "ROOM_01",
        "temperature": 28.4,
        "humidity": 61.2,
        "occupancy": True,
        "light_state": True,
    }
    response = client.post("/api/sensors/data", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["temperature"] == 28.4
    assert data["humidity"] == 61.2
    assert data["occupancy"] is True
    assert data["light_state"] is True


def test_ingest_sensor_data_invalid_temperature(client):
    # Temperature out of bounds (> 80°C)
    payload = {
        "device_id": "ESP32_ROOM_01",
        "room_id": "ROOM_01",
        "temperature": 150.0,
        "humidity": 50.0,
        "occupancy": False,
        "light_state": False,
    }
    response = client.post("/api/sensors/data", json=payload)
    assert response.status_code == 422


def test_get_latest_sensors(client):
    response = client.get("/api/rooms/ROOM_01/sensors/latest")
    assert response.status_code == 200
    data = response.json()
    assert data is not None
    assert data["room_id"] == "ROOM_01"


def test_get_sensors_history(client):
    response = client.get("/api/rooms/ROOM_01/sensors/history?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
