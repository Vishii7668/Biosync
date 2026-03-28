from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import date
from app.models.database import get_db
from app.models.models import User, ActivityLog, HealthScore
from app.schemas.schemas import ActivityLogCreate, ActivityLogOut
from app.auth import get_current_user
from app.ml.engine import compute_health_score

router = APIRouter(prefix="/logs", tags=["logs"])

@router.post("/", response_model=ActivityLogOut, status_code=201)
def create_log(payload: ActivityLogCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(ActivityLog).filter(
        ActivityLog.user_id == user.id,
        ActivityLog.date == payload.date
    ).first()
    if existing:
        for k, v in payload.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        log = existing
    else:
        log = ActivityLog(user_id=user.id, **payload.model_dump())
        db.add(log)
        db.commit()
        db.refresh(log)

    scores = compute_health_score(log.sleep_hours, log.steps, log.calories, log.water_ml)
    existing_score = db.query(HealthScore).filter(
        HealthScore.user_id == user.id,
        HealthScore.date == log.date
    ).first()
    if existing_score:
        for k, v in scores.items():
            setattr(existing_score, k, v)
    else:
        db.add(HealthScore(user_id=user.id, date=log.date, **scores))
    db.commit()
    return log

@router.get("/", response_model=List[ActivityLogOut])
def get_logs(limit: int = 30, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(ActivityLog).filter(ActivityLog.user_id == user.id)\
        .order_by(desc(ActivityLog.date)).limit(limit).all()

@router.get("/{log_date}", response_model=ActivityLogOut)
def get_log_by_date(log_date: date, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    log = db.query(ActivityLog).filter(ActivityLog.user_id == user.id, ActivityLog.date == log_date).first()
    if not log:
        raise HTTPException(status_code=404, detail="No log for this date")
    return log

@router.delete("/{log_id}", status_code=204)
def delete_log(log_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    log = db.query(ActivityLog).filter(ActivityLog.id == log_id, ActivityLog.user_id == user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
