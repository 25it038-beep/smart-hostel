from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, ConfigDict


# --- Sensor Schemas ---
class SensorDataCreate(BaseModel):
    device_id: str = Field(..., description="Unique ESP32 device identifier, e.g. ESP32_ROOM_01")
    room_id: str = Field(..., description="Room identifier, e.g. ROOM_01")
    temperature: float = Field(..., ge=-20.0, le=80.0, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0.0, le=100.0, description="Relative humidity in percentage")
    occupancy: bool = Field(..., description="PIR motion status: true = motion detected")
    light_state: bool = Field(..., description="Relay command state: true = ON, false = OFF")
    timestamp: Optional[datetime] = None

    @field_validator("temperature")
    def check_valid_temp(cls, v):
        if v is None or v < -20 or v > 80:
            raise ValueError("Temperature reading out of reasonable range (-20C to 80C)")
        return round(v, 2)

    @field_validator("humidity")
    def check_valid_humidity(cls, v):
        if v is None or v < 0 or v > 100:
            raise ValueError("Humidity reading out of reasonable range (0% to 100%)")
        return round(v, 2)


class SensorReadingResponse(BaseModel):
    id: int
    room_id: str
    device_id: str
    temperature: float
    humidity: float
    occupancy: bool
    light_state: bool
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Device Heartbeat Schemas ---
class DeviceHeartbeatCreate(BaseModel):
    device_id: str
    room_id: str
    ip_address: Optional[str] = "192.168.1.100"
    firmware_version: Optional[str] = "v1.0.0"
    rssi: Optional[int] = None
    free_heap: Optional[int] = None


class DeviceResponse(BaseModel):
    id: int
    device_id: str
    room_id: str
    ip_address: Optional[str]
    firmware_version: str
    last_seen: datetime
    status: str
    seconds_since_seen: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# --- Room Schemas ---
class RoomCreate(BaseModel):
    room_id: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=100)


class RoomSettingsUpdate(BaseModel):
    light_mode: Optional[str] = Field(None, pattern="^(AUTO|MANUAL)$")
    inactivity_timeout_sec: Optional[int] = Field(None, ge=10, le=600)
    temperature_interval_sec: Optional[int] = Field(None, ge=1, le=120)
    humidity_interval_sec: Optional[int] = Field(None, ge=1, le=120)
    heartbeat_interval_sec: Optional[int] = Field(None, ge=5, le=300)


class RoomSettingsResponse(BaseModel):
    room_id: str
    light_mode: str
    inactivity_timeout_sec: int
    target_light_state: bool
    temperature_interval_sec: int
    humidity_interval_sec: int
    heartbeat_interval_sec: int
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class RoomResponse(BaseModel):
    id: int
    room_id: str
    name: str
    created_at: datetime
    device_status: Optional[str] = "OFFLINE"
    latest_reading: Optional[SensorReadingResponse] = None
    settings: Optional[RoomSettingsResponse] = None

    model_config = ConfigDict(from_attributes=True)


# --- Light Command Schemas ---
class LightCommandRequest(BaseModel):
    mode: Optional[str] = Field(None, pattern="^(AUTO|MANUAL)$")
    state: Optional[bool] = None  # Desired state in manual mode: True=ON, False=OFF


class LightStateResponse(BaseModel):
    room_id: str
    mode: str
    light_state: bool
    inactivity_timeout_sec: int
    command_status: str  # "ACKNOWLEDGED", "PENDING_HARDWARE", "ESP32_OFFLINE"
    message: str
    last_updated: datetime


# --- Analytics & AI Schemas ---
class AnalyticsSummary(BaseModel):
    room_id: str
    timeframe: str
    total_light_on_seconds: float
    total_light_on_formatted: str
    total_occupancy_seconds: float
    total_occupancy_formatted: str
    automatic_activations_count: int
    manual_activations_count: int
    avg_session_duration_seconds: float
    avg_session_duration_formatted: str
    readings_count: int
    disclaimer: str = (
        "Note: Light metrics are calculated strictly from relay command states and occupancy events, "
        "not physical optical photodetectors."
    )


class AIInsightResponse(BaseModel):
    id: int
    room_id: str
    type: str
    title: str
    description: str
    severity: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HourlyProbability(BaseModel):
    hour: int
    label: str
    probability: float  # 0.0 to 1.0


class ModelMetadata(BaseModel):
    engine: str
    sample_count: int
    confidence_pct: float
    last_calibrated: datetime


class AIInsightsReport(BaseModel):
    room_id: str
    status: str  # "ready" or "collecting_data"
    message: str
    typical_occupancy_window: Optional[str] = None
    energy_efficiency_score: int = 85
    energy_rating_grade: str = "A"
    estimated_energy_saved_pct: float = 38.0
    thermal_comfort_status: str = "Comfortable"
    thermal_comfort_index: float = 75.0
    dew_point_c: float = 18.0
    recommended_timeout_sec: int = 60
    recommended_timeout_reason: str = "Optimal balance between relay cycling wear and power conservation"
    hourly_occupancy_probabilities: List[HourlyProbability] = []
    model_metadata: Optional[ModelMetadata] = None
    insights: List[AIInsightResponse] = []
    recommendations: List[str] = []

