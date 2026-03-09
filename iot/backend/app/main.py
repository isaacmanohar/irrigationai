from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import farmers, sensors, dashboard, voice, satellite
from .db.session import init_db

app = FastAPI(title="AI Precision Irrigation Assistant API")

# CORS - must be added FIRST, before anything else
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

app.include_router(farmers.router, prefix="/api/v1")
app.include_router(sensors.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(voice.router, prefix="/api/v1")
app.include_router(satellite.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to AI Precision Irrigation Assistant API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
