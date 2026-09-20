import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ai_models_endpoint():
    response = client.get("/api/ai/models")
    assert response.status_code == 200
    data = response.json()
    assert data["active_model"] == "moonshotai/kimi-k3"
    assert "Moonshot AI" in data["provider"]
    assert data["multimodal_vision"] is True
    assert data["reasoning_effort"] == "none"
