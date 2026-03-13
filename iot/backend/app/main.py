import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
from .api import farmers, sensors, dashboard, voice, satellite, schedule
from .db.session import init_db
from .services.scheduler import start_scheduler, stop_scheduler

app = FastAPI(title="AI Precision Irrigation Assistant API")

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

# Initialize database
init_db()

app.include_router(farmers.router, prefix="/api/v1")
app.include_router(sensors.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(voice.router, prefix="/api/v1")
app.include_router(satellite.router, prefix="/api/v1")
app.include_router(schedule.router)

@app.on_event("startup")
async def startup_event():
    """Start background scheduler on app startup"""
    logger.info("Starting application...")
    start_scheduler()

@app.on_event("shutdown")
async def shutdown_event():
    """Stop background scheduler on app shutdown"""
    logger.info("Shutting down application...")
    stop_scheduler()

@app.get("/")
async def root():
    return {"message": "Welcome to AI Precision Irrigation Assistant API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
