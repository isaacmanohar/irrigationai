from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    username: str # using email as username
    password: str

class FarmerCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone_number: str
    village: str
    preferred_language: str
    crop_type: Optional[str] = "Unknown"
    field_area: Optional[float] = 1.0
    growth_stage: Optional[str] = "Initial"
    season: Optional[str] = "Kharif"

class FarmerResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone_number: str
    village: str
    latitude: Optional[float]
    longitude: Optional[float]
    preferred_language: str
    
    class Config:
        from_attributes = True

class SensorDataCreate(BaseModel):
    field_id: int
    soil_moisture: float
    temperature: float
    humidity: float
    flow_rate: Optional[float] = 0.0

class PredictionResponse(BaseModel):
    field_id: int
    irrigation_need: str
    timestamp: datetime

class DashboardStats(BaseModel):
    soil_moisture: float
    temperature: float
    humidity: float
    pump_status: str
    last_irrigation: Optional[datetime]
    ndvi_health: str
    water_used_today: float

class ProfileUpdate(BaseModel):
    village: Optional[str] = None
    crop_type: Optional[str] = None
