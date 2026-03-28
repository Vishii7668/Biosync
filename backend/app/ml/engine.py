import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from datetime import date, timedelta
from typing import List, Dict
from app.schemas.schemas import TrendPoint, TrendPrediction, RiskScore

# ─── Weights for health score ────────────────────────────────────────────────
WEIGHTS = {"sleep": 0.35, "steps": 0.30, "nutrition": 0.20, "hydration": 0.15}

# Ideal targets
IDEAL_SLEEP = 8.0       # hours
IDEAL_STEPS = 10000
IDEAL_CALORIES_MIN = 1800
IDEAL_CALORIES_MAX = 2500
IDEAL_WATER = 2500      # ml


def _score_sleep(hours: float) -> float:
    """0-100 score for sleep hours."""
    if hours >= 7 and hours <= 9:
        return 100.0
    elif hours < 7:
        return max(0, (hours / 7) * 85)
    else:  # > 9
        return max(60, 100 - (hours - 9) * 10)


def _score_steps(steps: int) -> float:
    """0-100 score for daily steps."""
    return min(100.0, (steps / IDEAL_STEPS) * 100)


def _score_nutrition(calories: int) -> float:
    """0-100 score for caloric intake."""
    if IDEAL_CALORIES_MIN <= calories <= IDEAL_CALORIES_MAX:
        return 100.0
    elif calories < IDEAL_CALORIES_MIN:
        return max(0, (calories / IDEAL_CALORIES_MIN) * 80)
    else:
        excess = calories - IDEAL_CALORIES_MAX
        return max(0, 100 - (excess / 100) * 5)


def _score_hydration(water_ml: int) -> float:
    """0-100 score for water intake."""
    return min(100.0, (water_ml / IDEAL_WATER) * 100)


def compute_health_score(sleep_hours: float, steps: int, calories: int, water_ml: int) -> Dict:
    """Compute weighted health score and sub-scores."""
    sleep_s = _score_sleep(sleep_hours)
    steps_s = _score_steps(steps)
    nutrition_s = _score_nutrition(calories)
    hydration_s = _score_hydration(water_ml)

    overall = (
        sleep_s * WEIGHTS["sleep"] +
        steps_s * WEIGHTS["steps"] +
        nutrition_s * WEIGHTS["nutrition"] +
        hydration_s * WEIGHTS["hydration"]
    )

    return {
        "score": round(overall, 1),
        "sleep_score": round(sleep_s, 1),
        "steps_score": round(steps_s, 1),
        "nutrition_score": round(nutrition_s, 1),
        "hydration_score": round(hydration_s, 1),
    }


def compute_risk_score(logs: List[Dict]) -> RiskScore:
    """
    Compute risk profile from last 7 days of logs.
    Returns overall score, risk level, sub-scores, and recommendations.
    """
    if not logs:
        return RiskScore(
            overall_score=0, risk_level="insufficient_data",
            sleep_score=0, steps_score=0, nutrition_score=0, hydration_score=0,
            breakdown={}, recommendations=["Log at least 3 days of data for a risk assessment."]
        )

    recent = logs[-7:]
    avg_sleep = np.mean([l["sleep_hours"] for l in recent])
    avg_steps = np.mean([l["steps"] for l in recent])
    avg_calories = np.mean([l["calories"] for l in recent])
    avg_water = np.mean([l["water_ml"] for l in recent])

    scores = compute_health_score(avg_sleep, int(avg_steps), int(avg_calories), int(avg_water))
    overall = scores["score"]

    if overall >= 80:
        risk_level = "low"
    elif overall >= 60:
        risk_level = "moderate"
    elif overall >= 40:
        risk_level = "elevated"
    else:
        risk_level = "high"

    recommendations = []
    if scores["sleep_score"] < 70:
        recommendations.append(f"Aim for 7–9 hours of sleep. Your average is {avg_sleep:.1f}h.")
    if scores["steps_score"] < 70:
        recommendations.append(f"Try to reach 10,000 steps/day. Your average is {int(avg_steps):,}.")
    if scores["nutrition_score"] < 70:
        recommendations.append(f"Keep calories between 1,800–2,500/day. Your average is {int(avg_calories):,}.")
    if scores["hydration_score"] < 70:
        recommendations.append(f"Drink at least 2,500ml/day. Your average is {int(avg_water):,}ml.")
    if not recommendations:
        recommendations.append("Great work! Keep maintaining your healthy habits.")

    return RiskScore(
        overall_score=overall,
        risk_level=risk_level,
        sleep_score=scores["sleep_score"],
        steps_score=scores["steps_score"],
        nutrition_score=scores["nutrition_score"],
        hydration_score=scores["hydration_score"],
        breakdown={
            "avg_sleep": round(avg_sleep, 1),
            "avg_steps": int(avg_steps),
            "avg_calories": int(avg_calories),
            "avg_water": int(avg_water),
            "weights": WEIGHTS,
        },
        recommendations=recommendations
    )


def predict_trend(logs: List[Dict], metric: str, forecast_days: int = 3) -> TrendPrediction:
    """
    Fit a linear regression on historical metric values and forecast N days ahead.
    metric: 'sleep_hours' | 'steps' | 'calories' | 'water_ml'
    """
    if len(logs) < 3:
        empty = [TrendPoint(date=str(l["date"]), value=l[metric]) for l in logs]
        return TrendPrediction(
            metric=metric, historical=empty, forecast=[],
            slope=0, trend_direction="insufficient_data"
        )

    df = pd.DataFrame(logs).sort_values("date")
    df["day_idx"] = range(len(df))
    X = df[["day_idx"]].values
    y = df[metric].values.astype(float)

    model = LinearRegression()
    model.fit(X, y)
    slope = float(model.coef_[0])

    historical = [
        TrendPoint(date=str(row["date"]), value=round(float(row[metric]), 1))
        for _, row in df.iterrows()
    ]

    last_date = pd.to_datetime(df["date"].iloc[-1])
    last_idx = int(df["day_idx"].iloc[-1])
    forecast = []
    for i in range(1, forecast_days + 1):
        future_date = last_date + timedelta(days=i)
        pred_val = model.predict([[last_idx + i]])[0]
        forecast.append(TrendPoint(
            date=future_date.strftime("%Y-%m-%d"),
            value=round(max(0, float(pred_val)), 1),
            is_forecast=True
        ))

    if slope > 0.05:
        direction = "improving"
    elif slope < -0.05:
        direction = "declining"
    else:
        direction = "stable"

    return TrendPrediction(
        metric=metric,
        historical=historical,
        forecast=forecast,
        slope=round(slope, 4),
        trend_direction=direction
    )
