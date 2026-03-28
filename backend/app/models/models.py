from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    logs = relationship("ActivityLog", back_populates="user", cascade="all, delete")
    scores = relationship("HealthScore", back_populates="user", cascade="all, delete")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    sleep_hours = Column(Float, nullable=False)
    steps = Column(Integer, nullable=False)
    calories = Column(Integer, nullable=False)
    water_ml = Column(Integer, default=0)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="logs")

class HealthScore(Base):
    __tablename__ = "health_scores"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    score = Column(Float, nullable=False)
    sleep_score = Column(Float, nullable=False)
    steps_score = Column(Float, nullable=False)
    nutrition_score = Column(Float, nullable=False)
    hydration_score = Column(Float, nullable=False)
    computed_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="scores")
