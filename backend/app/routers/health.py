from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.database import get_db
from app.models.models import User, ActivityLog, HealthScore
from app.schemas.schemas import TrendPrediction, RiskScore, DashboardStats, HealthScoreOut
from app.auth import get_current_user
from app.ml.engine import predict_trend, compute_risk_score
from typing import List
from datetime import date, timedelta
import numpy as np

router = APIRouter(prefix="/health", tags=["health"])

def _logs_to_dicts(logs):
    return [{"date": l.date, "sleep_hours": l.sleep_hours, "steps": l.steps,
             "calories": l.calories, "water_ml": l.water_ml} for l in logs]

@router.get("/scores", response_model=List[HealthScoreOut])
def get_scores(limit: int = 30, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(HealthScore).filter(HealthScore.user_id == user.id)\
        .order_by(desc(HealthScore.date)).limit(limit).all()

@router.get("/risk", response_model=RiskScore)
def get_risk(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    logs = db.query(ActivityLog).filter(ActivityLog.user_id == user.id)\
        .order_by(ActivityLog.date).limit(7).all()
    return compute_risk_score(_logs_to_dicts(logs))

@router.get("/trend/{metric}", response_model=TrendPrediction)
def get_trend(metric: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    valid = {"sleep_hours", "steps", "calories", "water_ml"}
    if metric not in valid:
        from fastapi import HTTPException
        raise HTTPException(400, f"metric must be one of {valid}")
    logs = db.query(ActivityLog).filter(ActivityLog.user_id == user.id)\
        .order_by(ActivityLog.date).limit(14).all()
    return predict_trend(_logs_to_dicts(logs), metric)

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    logs = db.query(ActivityLog).filter(ActivityLog.user_id == user.id)\
        .order_by(desc(ActivityLog.date)).limit(30).all()
    if not logs:
        return DashboardStats(avg_sleep=0, avg_steps=0, avg_calories=0,
                              avg_water=0, total_logs=0, current_streak=0, latest_score=None)

    avg_sleep = round(float(np.mean([l.sleep_hours for l in logs])), 1)
    avg_steps = int(np.mean([l.steps for l in logs]))
    avg_calories = int(np.mean([l.calories for l in logs]))
    avg_water = int(np.mean([l.water_ml for l in logs]))

    # streak
    today = date.today()
    streak = 0
    dates = {l.date for l in logs}
    check = today
    while check in dates:
        streak += 1
        check -= timedelta(days=1)

    latest_score_obj = db.query(HealthScore).filter(HealthScore.user_id == user.id)\
        .order_by(desc(HealthScore.date)).first()

    return DashboardStats(
        avg_sleep=avg_sleep, avg_steps=avg_steps,
        avg_calories=avg_calories, avg_water=avg_water,
        total_logs=len(logs), current_streak=streak,
        latest_score=latest_score_obj.score if latest_score_obj else None
    )
