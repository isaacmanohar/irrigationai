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
    profile_photo: Optional[str] = None
    
    class Config:
        from_attributes = True

class FarmInfo(BaseModel):
    farm_name: Optional[str]
    village: str
    farm_size: float
    latitude: Optional[float]
    longitude: Optional[float]

class CropInfo(BaseModel):
    crop_type: str
    planting_date: Optional[datetime]
    growth_stage: str
    irrigation_method: str

class DeviceSchema(BaseModel):
    device_id: str
    device_type: str
    status: str
    last_sync: Optional[datetime]
    health_score: int

class UserSettingsSchema(BaseModel):
    sms_alerts: bool
    voice_alerts: bool
    dashboard_notifications: bool
    auto_irrigation: bool
    soil_moisture_threshold: float
    max_irrigation_duration: int
    water_usage_limit: int

class FullProfileUpdate(BaseModel):
    # Combined update schema
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    preferred_language: Optional[str] = None
    profile_photo: Optional[str] = None
    
    farm_name: Optional[str] = None
    village: Optional[str] = None
    farm_size: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    crop_type: Optional[str] = None
    planting_date: Optional[datetime] = None
    growth_stage: Optional[str] = None
    irrigation_method: Optional[str] = None
    
    sms_alerts: Optional[bool] = None
    voice_alerts: Optional[bool] = None
    dashboard_notifications: Optional[bool] = None
    auto_irrigation: Optional[bool] = None
    soil_moisture_threshold: Optional[float] = None
    max_irrigation_duration: Optional[int] = None
    water_usage_limit: Optional[int] = None

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
