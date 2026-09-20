from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import AnalyticsSummary, AIInsightsReport
from ..services.analytics_service import calculate_room_analytics
from ..ai.anomaly_detection import analyze_room_anomalies

router = APIRouter(tags=["Analytics & AI"])


@router.get("/api/rooms/{room_id}/analytics", response_model=AnalyticsSummary)
def get_room_analytics(
    room_id: str,
    timeframe: str = Query("today", pattern="^(today|7d|30d|custom)$"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    """
    Retrieve light usage statistics, total ON duration, automatic activations,
    average session duration, and occupancy duration.
    """
    metrics = calculate_room_analytics(
        db=db,
        room_id=room_id,
        timeframe=timeframe,
        start_date=start_date,
        end_date=end_date,
    )
    return metrics


@router.get("/api/rooms/{room_id}/ai-insights", response_model=AIInsightsReport)
def get_room_ai_insights(room_id: str, db: Session = Depends(get_db)):
    """
    Generate AI insights, detected temperature/humidity/light anomalies,
    and recommendations based on actual historical telemetry.
    """
    report = analyze_room_anomalies(db=db, room_id=room_id)
    return report
