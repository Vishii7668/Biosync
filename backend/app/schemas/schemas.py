from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional, List

# Auth
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

# Activity Log
class ActivityLogCreate(BaseModel):
    date: date
    sleep_hours: float
    steps: int
    calories: int
    water_ml: int = 0
    notes: str = ""

class ActivityLogOut(ActivityLogCreate):
    id: int
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Health Score
class HealthScoreOut(BaseModel):
    id: int
    date: date
    score: float
    sleep_score: float
    steps_score: float
    nutrition_score: float
    hydration_score: float
    computed_at: datetime
    class Config:
        from_attributes = True

# ML Predictions
class TrendPoint(BaseModel):
    date: str
    value: float
    is_forecast: bool = False

class TrendPrediction(BaseModel):
    metric: str
    historical: List[TrendPoint]
    forecast: List[TrendPoint]
    slope: float
    trend_direction: str

class RiskScore(BaseModel):
    overall_score: float
    risk_level: str
    sleep_score: float
    steps_score: float
    nutrition_score: float
    hydration_score: float
    breakdown: dict
    recommendations: List[str]

class DashboardStats(BaseModel):
    avg_sleep: float
    avg_steps: float
    avg_calories: float
    avg_water: float
    total_logs: int
    current_streak: int
    latest_score: Optional[float]
