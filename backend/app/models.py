from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    devices = relationship("Device", back_populates="room", cascade="all, delete-orphan")
    sensor_readings = relationship("SensorReading", back_populates="room", cascade="all, delete-orphan")
    light_events = relationship("LightEvent", back_populates="room", cascade="all, delete-orphan")
    ai_insights = relationship("AIInsight", back_populates="room", cascade="all, delete-orphan")
    setting = relationship("RoomSetting", uselist=False, back_populates="room", cascade="all, delete-orphan")


class RoomSetting(Base):
    __tablename__ = "room_settings"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String(50), ForeignKey("rooms.room_id"), unique=True, nullable=False)
    light_mode = Column(String(20), default="AUTO", nullable=False)  # "AUTO" or "MANUAL"
    inactivity_timeout_sec = Column(Integer, default=60, nullable=False)  # 30, 60, 90, 120
    target_light_state = Column(Boolean, default=False, nullable=False)  # Current desired state in manual mode
    temperature_interval_sec = Column(Integer, default=5, nullable=False)
    humidity_interval_sec = Column(Integer, default=5, nullable=False)
    heartbeat_interval_sec = Column(Integer, default=10, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    room = relationship("Room", back_populates="setting")


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), unique=True, index=True, nullable=False)
    room_id = Column(String(50), ForeignKey("rooms.room_id"), nullable=False)
    ip_address = Column(String(45), nullable=True, default="192.168.1.100")
    firmware_version = Column(String(20), default="v1.0.0", nullable=False)
    last_seen = Column(DateTime, default=utcnow, nullable=False)
    status = Column(String(20), default="OFFLINE", nullable=False)  # "CONNECTED" or "OFFLINE"
    created_at = Column(DateTime, default=utcnow, nullable=False)

    room = relationship("Room", back_populates="devices")
    readings = relationship("SensorReading", back_populates="device", cascade="all, delete-orphan")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String(50), ForeignKey("rooms.room_id"), index=True, nullable=False)
    device_id = Column(String(50), ForeignKey("devices.device_id"), index=True, nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    occupancy = Column(Boolean, nullable=False)
    light_state = Column(Boolean, nullable=False)  # Relay command state
    timestamp = Column(DateTime, default=utcnow, index=True, nullable=False)

    room = relationship("Room", back_populates="sensor_readings")
    device = relationship("Device", back_populates="readings")


class LightEvent(Base):
    __tablename__ = "light_events"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String(50), ForeignKey("rooms.room_id"), index=True, nullable=False)
    device_id = Column(String(50), nullable=True)
    state = Column(Boolean, nullable=False)  # True = ON, False = OFF
    mode = Column(String(20), nullable=False)  # "AUTO" or "MANUAL"
    reason = Column(String(255), nullable=False)  # "MOTION_DETECTED", "INACTIVITY_TIMEOUT", "MANUAL_COMMAND"
    timestamp = Column(DateTime, default=utcnow, index=True, nullable=False)

    room = relationship("Room", back_populates="light_events")


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String(50), ForeignKey("rooms.room_id"), index=True, nullable=False)
    type = Column(String(50), nullable=False)  # "TEMPERATURE_ANOMALY", "USAGE_PATTERN", "LIGHT_ANOMALY"
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="INFO", nullable=False)  # "INFO", "WARNING", "CRITICAL"
    created_at = Column(DateTime, default=utcnow, index=True, nullable=False)

    room = relationship("Room", back_populates="ai_insights")
