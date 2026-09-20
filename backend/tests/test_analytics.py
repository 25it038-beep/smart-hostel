def test_analytics_metrics(client):
    response = client.get("/api/rooms/ROOM_01/analytics?timeframe=today")
    assert response.status_code == 200
    data = response.json()
    assert "total_light_on_seconds" in data
    assert "total_occupancy_seconds" in data
    assert "automatic_activations_count" in data
    assert "disclaimer" in data
    assert "relay command state" in data["disclaimer"]


def test_ai_insights_endpoint(client):
    response = client.get("/api/rooms/ROOM_01/ai-insights")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] in ["ready", "collecting_data"]
    assert "recommendations" in data
