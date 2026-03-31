
#  BioSync — Personal Health Intelligence System

>  Problem Statement: (STOCKHOLM) · Ampcus Cyber

BioSync is a full-stack Personal Health Intelligence System where users log daily activities (sleep, steps, meals, hydration) and receive AI-powered health insights, trend forecasts, and risk assessments.

---

##  Architecture
┌─────────────────────────────────────────────────────────────┐
│                    User (Browser)                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / REST
┌──────────────────────────▼──────────────────────────────────┐
│              Frontend  (React + Vite + Tailwind)            │
│   Dashboard · Log Form · Trend Charts · Risk Report         │
└──────────────────────────┬──────────────────────────────────┘
                           │ /api proxy → :8000
┌──────────────────────────▼──────────────────────────────────┐
│                  Backend (FastAPI + Python)                  │
│   /auth  ·  /logs  ·  /health/dashboard                     │
│   /health/risk  ·  /health/trend/{metric}                   │
└──────────┬────────────────────────────┬────────────────────-┘
           │                            │
┌──────────▼──────────┐    ┌────────────▼────────────────────┐
│  SQLite Database    │    │       ML Engine (scikit-learn)  │
│  users              │    │  • Linear Regression Forecast   │
│  activity_logs      │    │  • Weighted Risk Scorer         │
│  health_scores      │    │  • Sub-metric scoring (0-100)   │
└─────────────────────┘    └─────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React 18 + Vite | Fast HMR, component model |
| Styling | Tailwind CSS | Utility-first, rapid UI |
| Charts | Recharts | Composable React charts |
| Backend | FastAPI (Python) | Auto docs, async, Pydantic |
| Auth | JWT (python-jose) | Stateless, scalable |
| Database | SQLite + SQLAlchemy | Zero-config, ORM, portable |
| ML | scikit-learn + NumPy | Explainable, lightweight |
| Routing | React Router v6 | Declarative SPA routing |


## 📁 Project Structure

```
biosync/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   └── app/
│       ├── auth.py              # JWT auth utilities
│       ├── models/
│       │   ├── models.py        # SQLAlchemy ORM models
│       │   └── database.py      # DB engine + session
│       ├── schemas/
│       │   └── schemas.py       # Pydantic request/response schemas
│       ├── routers/
│       │   ├── auth.py          # /auth endpoints
│       │   ├── logs.py          # /logs endpoints
│       │   └── health.py        # /health endpoints + ML
│       └── ml/
│           └── engine.py        # ML: trend prediction + risk scoring
├── frontend/
│   ├── src/
│   │   ├── api/client.js        # Axios API client
│   │   ├── hooks/useAuth.jsx    # Auth context
│   │   ├── components/
│   │   │   ├── Layout.jsx       # Sidebar + nav
│   │   │   ├── StatCard.jsx     # Metric card
│   │   │   └── ScoreRing.jsx    # SVG score ring
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── Dashboard.jsx    # Overview + charts
│   │       ├── LogEntry.jsx     # Daily log form
│   │       ├── Trends.jsx       # ML forecasting view
│   │       └── RiskReport.jsx   # Risk scoring view
│   └── ...config files
├── setup.sh                     # One-shot install
├── start.sh                     # Start both servers
└── README.md
```

---

##  API Documentation

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Get current user |

### Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/logs/` | Create/update daily log |
| GET | `/logs/` | List recent logs |
| GET | `/logs/{date}` | Get log by date |
| DELETE | `/logs/{id}` | Delete a log |

### Health & ML
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health/dashboard` | Stats + streak |
| GET | `/health/scores` | Historical health scores |
| GET | `/health/risk` | Weighted risk assessment |
| GET | `/health/trend/{metric}` | Linear regression forecast |

**`{metric}`** can be: `sleep_hours`, `steps`, `calories`, `water_ml`

---

##  ML Implementation

### 1. Weighted Risk Scoring Model

Each metric is scored 0–100 against evidence-based targets:

```python
# Scoring functions (app/ml/engine.py)
sleep_score    = f(hours)     # 100 if 7–9h, degrades outside range
steps_score    = min(100, steps / 10000 * 100)
nutrition_score = f(calories)  # 100 if 1800–2500 kcal
hydration_score = min(100, water_ml / 2500 * 100)

# Weighted average
overall = (
  sleep_score    * 0.35 +
  steps_score    * 0.30 +
  nutrition_score * 0.20 +
  hydration_score * 0.15
)
```

Risk level mapping: `≥80 = Low`, `≥60 = Moderate`, `≥40 = Elevated`, `<40 = High`

**Failure cases:** < 3 days of data returns `insufficient_data` with no score.

**Evaluation metrics:** The score range (0–100) and thresholds are validated against WHO physical activity guidelines and sleep foundation recommendations.

### 2. Time-Series Trend Prediction (Linear Regression)

```python
# app/ml/engine.py → predict_trend()
model = LinearRegression()
model.fit(X_day_indices, y_metric_values)
slope = model.coef_[0]        # Rate of change per day
forecast = model.predict(future_indices)

# Trend direction
if slope > 0.05:   direction = "improving"
elif slope < -0.05: direction = "declining"
else:               direction = "stable"
```

**Input:** Last 14 days of logs. **Output:** Historical + 3-day forecast with slope. **Failure cases:** < 3 data points returns empty forecast with `insufficient_data` direction.

---

##  Team Roles

| Member | Component | Responsibility |
|--------|-----------|---------------|
| m1 | Frontend Lead | Dashboard, charts, ScoreRing |
| m2| Frontend | LogEntry form, auth pages, API integration |
| m3| Backend | FastAPI endpoints, JWT auth |
|m4| ML Engineer | engine.py — trend prediction + risk scorer |
| M5 | Fullstack | DB schema, health router, README, DevOps |

---

##  Key Design Decisions (ADR)

**ADR-001: SQLite over PostgreSQL**
Using SQLite for zero-config local development. The SQLAlchemy ORM makes swapping to PostgreSQL a single env-var change

**ADR-002: Linear Regression over Deep Learning**
With 7–14 data points, deep learning would overfit. Linear regression is interpretable, fast, requires no training data splits, and its slope coefficient is directly explainable to evaluators.

**ADR-003: Computed scores stored in DB**
Health scores are computed on log save and persisted. This keeps dashboard queries fast (no runtime ML on read) and creates a clear audit trail.

**ADR-004: JWT stateless auth**
No server-side session storage. Token is stored in localStorage and sent as Bearer header. 7-day expiry with auto-redirect on 401.

**ADR-005: Vite proxy for CORS-free dev**
Frontend proxies `/api` to `:8000`. No CORS configuration needed in development beyond a single Vite config line.

---
<img width="916" height="666" alt="Screenshot 2026-03-31 at 7 06 53 PM" src="https://github.com/user-attachments/assets/fd673621-b99b-478e-a7bd-d277f26e4693" />
<img width="1177" height="428" alt="Screenshot 2026-03-31 at 7 07 02 PM" src="https://github.com/user-attachments/assets/ed5278ab-9cde-4b6f-b3e9-8903647de8fb" />
<img width="1168" height="663" alt="Screenshot 2026-03-31 at 7 07 10 PM" src="https://github.com/user-attachments/assets/b9910f39-71af-4cb3-bb81-848926714038" />
