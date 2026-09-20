from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.simulator_service import simulator

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])


class SimulationConfig(BaseModel):
    enabled: bool
    force_motion: Optional[bool] = None
    seed_history: Optional[bool] = False
    room_id: Optional[str] = "ROOM_01"


@router.get("/status")
def get_simulation_status():
    return {
        "enabled": simulator.is_running,
        "forced_motion": simulator.forced_motion,
        "simulated_room_id": simulator.simulated_room_id,
        "current_temperature": simulator.temperature,
        "current_humidity": simulator.humidity,
        "current_occupancy": simulator.occupancy,
        "current_light_state": simulator.light_state,
        "source": "SIMULATED DATA" if simulator.is_running else "HARDWARE SENSORS",
    }


@router.post("/toggle")
async def toggle_simulation(config: SimulationConfig, db: Session = Depends(get_db)):
    if config.seed_history:
        simulator.seed_initial_history(db, room_id=config.room_id or "ROOM_01")

    if config.force_motion is not None:
        simulator.forced_motion = config.force_motion

    if config.enabled:
        simulator.simulated_room_id = config.room_id or "ROOM_01"
        simulator.start()
    else:
        simulator.stop()

    return {
        "status": "success",
        "enabled": simulator.is_running,
        "forced_motion": simulator.forced_motion,
        "message": "Simulation mode activated." if simulator.is_running else "Simulation stopped.",
    }


@router.post("/trigger-motion")
async def trigger_motion(db: Session = Depends(get_db)):
    """Convenience button in UI to instantly trigger simulated PIR motion."""
    simulator.forced_motion = True
    await simulator.step_simulation(db)
    # Clear force after 1 step so auto-timeout can take over
    simulator.forced_motion = None
    return {"status": "motion_triggered", "occupancy": True, "light_state": True}
