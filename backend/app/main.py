import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models import Room, RoomSetting
from .api import rooms, sensors, devices, light, analytics, simulation, ai_chat
from .services.websocket_service import ws_service
from .services.simulator_service import simulator

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("smart_hostel")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if not exist
    Base.metadata.create_all(bind=engine)

    # Ensure default ROOM_01 exists
    db = SessionLocal()
    try:
        room = db.query(Room).filter(Room.room_id == "ROOM_01").first()
        if not room:
            room = Room(room_id="ROOM_01", name="Room 101 (Prototype)")
            db.add(room)
            db.commit()
            db.refresh(room)

        setting = db.query(RoomSetting).filter(RoomSetting.room_id == "ROOM_01").first()
        if not setting:
            setting = RoomSetting(
                room_id="ROOM_01",
                light_mode="AUTO",
                inactivity_timeout_sec=60,
                target_light_state=False,
            )
            db.add(setting)
            db.commit()

        # Seed initial history so dashboard and AI insights have realistic baseline out-of-the-box
        simulator.seed_initial_history(db, room_id="ROOM_01", days=3)
    finally:
        db.close()

    logger.info("Smart Hostel Backend initialized successfully.")
    yield

    # Shutdown
    simulator.stop()
    logger.info("Smart Hostel Backend shutdown.")


app = FastAPI(
    title="Smart Hostel IoT API",
    description="Backend API and WebSocket service for ESP32 Room Monitoring & Automatic Light Control",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(rooms.router)
app.include_router(sensors.router)
app.include_router(devices.router)
app.include_router(light.router)
app.include_router(analytics.router)
app.include_router(simulation.router)
app.include_router(ai_chat.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Smart Hostel IoT Backend",
        "simulation_active": simulator.is_running,
    }


@app.websocket("/ws/rooms/{room_id}")
async def room_websocket_endpoint(websocket: WebSocket, room_id: str):
    await ws_service.connect(room_id, websocket)
    try:
        while True:
            # Keep socket alive and receive any client ping
            data = await websocket.receive_text()
            # Send back acknowledge heartbeat
            await websocket.send_text(f'{{"event":"pong","client_message":{data!r}}}')
    except WebSocketDisconnect:
        ws_service.disconnect(room_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error in room {room_id}: {e}")
        ws_service.disconnect(room_id, websocket)
