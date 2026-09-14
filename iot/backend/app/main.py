import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from .api import farmers, sensors, dashboard, voice, satellite, schedule, demo
from .api import agent as agent_router          # Phase 6 & 7: Agentic AI + XAI
from .db.session import init_db
from .services.scheduler import start_scheduler, stop_scheduler
from .services.mqtt_service import mqtt_service

app = FastAPI(
    title="AgriMate — Agentic AI Explainable Precision Farming API",
    description=(
        "Multi-source data fusion (IoT + Weather + Satellite + ML) with "
        "an agentic LLM decision engine, XAI explanations, and farmer feedback loops."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize database (creates new tables like ai_recommendation_feedback)
init_db()

app.include_router(farmers.router, prefix="/api/v1")
app.include_router(sensors.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(voice.router, prefix="/api/v1")
app.include_router(satellite.router, prefix="/api/v1")
app.include_router(schedule.router)
app.include_router(agent_router.router, prefix="/api/v1")   # /api/v1/agent/...
app.include_router(demo.router, prefix="/api/v1")           # /api/v1/demo/...

@app.on_event("startup")
async def startup_event():
    """Start background scheduler and MQTT service on app startup"""
    logger.info("Starting application...")
    start_scheduler()
    mqtt_service.start()

@app.on_event("shutdown")
async def shutdown_event():
    """Stop background scheduler and MQTT service on app shutdown"""
    logger.info("Shutting down application...")
    stop_scheduler()
    mqtt_service.stop()


@app.get("/")
async def root():
    return {"message": "Welcome to AI Precision Irrigation Assistant API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
