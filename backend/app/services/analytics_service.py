from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..models import SensorReading, LightEvent


def format_duration(seconds: float) -> str:
    """Formats seconds into 'Xh Ym' or 'Ym Zs'."""
    sec = int(round(seconds))
    if sec < 60:
        return f"{sec}s"
    minutes = sec // 60
    rem_sec = sec % 60
    if minutes < 60:
        return f"{minutes}m" if rem_sec == 0 else f"{minutes}m {rem_sec}s"
    hours = minutes // 60
    rem_min = minutes % 60
    return f"{hours}h {rem_min}m"


def calculate_room_analytics(
    db: Session,
    room_id: str,
    timeframe: str = "today",
    start_date: datetime = None,
    end_date: datetime = None,
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    # Add a generous tolerance window to end_time to prevent dropping readings with slight device clock skew
    end_time_skew_tolerance = now + timedelta(minutes=10)

    if timeframe == "today":
        start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_time = end_time_skew_tolerance
    elif timeframe == "7d":
        start_time = now - timedelta(days=7)
        end_time = end_time_skew_tolerance
    elif timeframe == "30d":
        start_time = now - timedelta(days=30)
        end_time = end_time_skew_tolerance
    elif timeframe == "custom" and start_date and end_date:
        start_time = start_date
        end_time = end_date
    else:
        start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_time = end_time_skew_tolerance

    # Fetch ordered sensor readings within timeframe
    readings: List[SensorReading] = (
        db.query(SensorReading)
        .filter(
            SensorReading.room_id == room_id,
            SensorReading.timestamp >= start_time,
            SensorReading.timestamp <= end_time,
        )
        .order_by(SensorReading.timestamp.asc())
        .all()
    )

    total_light_on_seconds = 0.0
    total_occupancy_seconds = 0.0
    automatic_activations = 0
    manual_activations = 0

    # Fetch light events within timeframe for activation metrics
    events: List[LightEvent] = (
        db.query(LightEvent)
        .filter(
            LightEvent.room_id == room_id,
            LightEvent.timestamp >= start_time,
            LightEvent.timestamp <= end_time,
        )
        .order_by(LightEvent.timestamp.asc())
        .all()
    )

    for ev in events:
        if ev.state is True:  # Turned ON
            if ev.mode == "AUTO":
                automatic_activations += 1
            else:
                manual_activations += 1

    # If no explicit events exist but we have sensor readings, count ON transitions
    if not events and readings:
        for i in range(1, len(readings)):
            if readings[i].light_state and not readings[i - 1].light_state:
                automatic_activations += 1

    # Approximate duration from successive sensor readings interval
    if len(readings) > 1:
        for i in range(len(readings) - 1):
            curr = readings[i]
            nxt = readings[i + 1]

            t_curr = curr.timestamp.replace(tzinfo=timezone.utc) if curr.timestamp.tzinfo is None else curr.timestamp
            t_nxt = nxt.timestamp.replace(tzinfo=timezone.utc) if nxt.timestamp.tzinfo is None else nxt.timestamp

            step_sec = (t_nxt - t_curr).total_seconds()
            # Cap realistic step interval to 5 minutes to avoid huge gaps during sleep/power-off
            step_sec = min(step_sec, 300.0)

            if curr.light_state:
                total_light_on_seconds += step_sec
            if curr.occupancy:
                total_occupancy_seconds += step_sec
    elif len(readings) == 1:
        if readings[0].light_state:
            total_light_on_seconds = 30.0
        if readings[0].occupancy:
            total_occupancy_seconds = 30.0

    total_activations = automatic_activations + manual_activations
    if total_activations > 0:
        avg_session_seconds = total_light_on_seconds / total_activations
    else:
        avg_session_seconds = 0.0

    return {
        "room_id": room_id,
        "timeframe": timeframe,
        "total_light_on_seconds": round(total_light_on_seconds, 1),
        "total_light_on_formatted": format_duration(total_light_on_seconds),
        "total_occupancy_seconds": round(total_occupancy_seconds, 1),
        "total_occupancy_formatted": format_duration(total_occupancy_seconds),
        "automatic_activations_count": automatic_activations,
        "manual_activations_count": manual_activations,
        "avg_session_duration_seconds": round(avg_session_seconds, 1),
        "avg_session_duration_formatted": format_duration(avg_session_seconds),
        "readings_count": len(readings),
        "disclaimer": (
            "Note: Light metrics are calculated strictly from relay command states and occupancy events, "
            "not physical optical photodetectors."
        ),
    }
