from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.database import engine
from app.models.models import Base
from app.routers import auth, logs, health

Base.metadata.create_all(bind=engine)

app = FastAPI(title="BioSync API", version="1.0.0", description="Personal Health Intelligence System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(logs.router)
app.include_router(health.router)

@app.get("/")
def root():
    return {"message": "BioSync API is running", "docs": "/docs"}
