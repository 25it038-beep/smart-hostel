import asyncio
import math
import random
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Room, Device, SensorReading, LightEvent, RoomSetting, utcnow
from ..services.esp32_service import esp32_service
from ..services.websocket_service import ws_service


class SimulatorService:
    def __init__(self):
        self.is_running = False
        self.task: Optional[asyncio.Task] = None
        self.simulated_room_id = "ROOM_01"
        self.simulated_device_id = "ESP32_SIMULATOR_01"

        # Simulation state
        self.temperature = 28.4
        self.humidity = 61.2
        self.occupancy = True
        self.light_state = True
        self.last_motion_time = datetime.now(timezone.utc)
        self.forced_motion: Optional[bool] = None  # None = auto random cycle, True/False = manually forced

    def seed_initial_history(self, db: Session, room_id: str, days: int = 3):
        """Generates realistic historical data points for testing analytics and AI insights without waiting."""
        existing_count = db.query(SensorReading).filter(SensorReading.room_id == room_id).count()
        if existing_count >= 30:
            return  # History already exists

        # Seed device
        device = db.query(Device).filter(Device.device_id == self.simulated_device_id).first()
        now = utcnow()
        if not device:
            device = Device(
                device_id=self.simulated_device_id,
                room_id=room_id,
                ip_address="192.168.1.150 (Simulated)",
                firmware_version="v1.0.0-sim",
                last_seen=now,
                status="CONNECTED",
            )
            db.add(device)
            db.commit()

        # Generate timestamps backwards
        records = []
        events = []
        cur_light = False
        start_time = now - timedelta(days=days)
        step = timedelta(minutes=15)
        current = start_time

        while current < now:
            hour = current.hour
            # Higher probability of occupancy between 8 AM and 10 PM
            is_daytime = 8 <= hour <= 22
            prob_occupied = 0.65 if is_daytime else 0.05
            occ = random.random() < prob_occupied

            # Diurnal temperature cycle: peak around 14:00 (2 PM)
            temp_variation = math.sin((hour - 8) * math.pi / 12) * 3.0
            temp = round(26.5 + temp_variation + random.uniform(-0.5, 0.5), 1)
            hum = round(65.0 - (temp_variation * 1.5) + random.uniform(-2, 2), 1)

            # In auto mode, light is ON when occupied
            new_light = occ
            if new_light != cur_light:
                events.append(
                    LightEvent(
                        room_id=room_id,
                        device_id=self.simulated_device_id,
                        state=new_light,
                        mode="AUTO",
                        reason="MOTION_DETECTED" if new_light else "INACTIVITY_TIMEOUT",
                        timestamp=current,
                    )
                )
                cur_light = new_light

            records.append(
                SensorReading(
                    room_id=room_id,
                    device_id=self.simulated_device_id,
                    temperature=temp,
                    humidity=hum,
                    occupancy=occ,
                    light_state=new_light,
                    timestamp=current,
                )
            )
            current += step

        db.add_all(records)
        db.add_all(events)
        db.commit()

    async def step_simulation(self, db: Session):
        """Advances simulation by one cycle (e.g. 5 seconds)."""
        now = datetime.now(timezone.utc)
        setting = db.query(RoomSetting).filter(RoomSetting.room_id == self.simulated_room_id).first()
        mode = setting.light_mode if setting else "AUTO"
        timeout = setting.inactivity_timeout_sec if setting else 60

        # Heartbeat update for simulated device
        esp32_service.record_heartbeat(
            db=db,
            device_id=self.simulated_device_id,
            room_id=self.simulated_room_id,
            ip_address="192.168.1.150 (Simulated)",
            firmware_version="v1.0.0-sim",
        )

        # Handle occupancy logic
        if self.forced_motion is not None:
            self.occupancy = self.forced_motion
            if self.occupancy:
                self.last_motion_time = now
        else:
            # Auto cycle: random motion bursts
            if random.random() < 0.25:
                self.occupancy = True
                self.last_motion_time = now

        # Timeout evaluation
        seconds_since_motion = (now - self.last_motion_time).total_seconds()
        if seconds_since_motion >= timeout:
            self.occupancy = False

        # Light control evaluation
        if mode == "AUTO":
            self.light_state = self.occupancy
        else:
            self.light_state = setting.target_light_state if setting else False

        # Natural physical temperature / humidity subtle drift
        self.temperature = round(
            max(20.0, min(36.0, self.temperature + random.uniform(-0.15, 0.15) + (0.05 if self.light_state else -0.02))),
            2,
        )
        self.humidity = round(
            max(40.0, min(85.0, self.humidity + random.uniform(-0.25, 0.25))),
            1,
        )

        # Persist reading
        reading = SensorReading(
            room_id=self.simulated_room_id,
            device_id=self.simulated_device_id,
            temperature=self.temperature,
            humidity=self.humidity,
            occupancy=self.occupancy,
            light_state=self.light_state,
            timestamp=now,
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)

        # Broadcast update with explicit simulated source tag
        ws_payload = {
            "event": "sensor_update",
            "room_id": self.simulated_room_id,
            "device_id": self.simulated_device_id,
            "temperature": reading.temperature,
            "humidity": reading.humidity,
            "occupancy": reading.occupancy,
            "light_state": reading.light_state,
            "timestamp": reading.timestamp.isoformat(),
            "device_status": "CONNECTED",
            "is_simulated": True,
        }
        await ws_service.broadcast_to_room(self.simulated_room_id, ws_payload)

    async def _run_loop(self):
        while self.is_running:
            try:
                db = SessionLocal()
                try:
                    await self.step_simulation(db)
                finally:
                    db.close()
            except Exception as e:
                print(f"Simulator error: {e}")
            await asyncio.sleep(4)

    def start(self):
        if not self.is_running:
            self.is_running = True
            self.task = asyncio.create_task(self._run_loop())

    def stop(self):
        self.is_running = False
        if self.task:
            self.task.cancel()
            self.task = None


simulator = SimulatorService()
