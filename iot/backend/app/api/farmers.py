from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, File, UploadFile
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.database import Farmer, Field, UserSettings
from ..schemas.schemas import FarmerCreate, FarmerResponse, Token, LoginRequest, ProfileUpdate, FullProfileUpdate
from ..services.geocoding import get_coordinates
from ..services.twilio_service import twilio_service
from ..core.auth import get_password_hash, verify_password, create_access_token, get_current_user
from datetime import datetime
import os

router = APIRouter(prefix="/farmers", tags=["Farmers"])

@router.get("/test")
async def test_farmers():
    return {"status": "farmers router working"}

@router.post("/register", response_model=FarmerResponse)
async def register_farmer(farmer_in: FarmerCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Check if phone already registered
    existing = db.query(Farmer).filter(
        (Farmer.phone_number == farmer_in.phone_number) | 
        (Farmer.email == farmer_in.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account with this phone number already registered")
    
    # Geocode village
    lat, lon = await get_coordinates(farmer_in.village)
    
    # Create Farmer
    new_farmer = Farmer(
        name=farmer_in.name,
        email=farmer_in.email,
        hashed_password=get_password_hash(farmer_in.password),
        phone_number=farmer_in.phone_number,
        village=farmer_in.village,
        latitude=lat,
        longitude=lon,
        preferred_language=farmer_in.preferred_language
    )
    db.add(new_farmer)
    db.commit()
    db.refresh(new_farmer)
    
    # Create Field for the farmer with default values
    # These will be updated during the AI voice call
    new_field = Field(
        farmer_id=new_farmer.id,
        crop_type=farmer_in.crop_type or "Unknown",
        field_area=farmer_in.field_area or 1.0,
        growth_stage=farmer_in.growth_stage or "Initial",
        season=farmer_in.season or "Kharif"
    )
    db.add(new_field)
    
    # Create Default Settings
    new_settings = UserSettings(
        user_id=new_farmer.id,
        sms_alerts=True,
        voice_alerts=True,
        dashboard_notifications=True,
        auto_irrigation=False,
        soil_moisture_threshold=30.0,
        max_irrigation_duration=30,
        water_usage_limit=500
    )
    db.add(new_settings)
    
    db.commit()
    
    # Trigger onboarding call in the background
    base_url = os.getenv("BASE_URL", "http://your-app.com")
    background_tasks.add_task(twilio_service.make_onboarding_call, new_farmer.phone_number, base_url)
    
    return new_farmer
    
@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    # Normalize username for searching
    username = login_data.username.strip()
    
    # Try direct match
    user = db.query(Farmer).filter(
        (Farmer.email == username) | 
        (Farmer.phone_number == username)
    ).first()
    
    # If not found, try matching by phone number suffix (last 10 digits) 
    if not user:
        clean_user = username.replace('+', '').replace(' ', '')
        if clean_user.isdigit() and len(clean_user) >= 10:
             phone_suffix = clean_user[-10:]
             user = db.query(Farmer).filter(
                 Farmer.phone_number.like(f"%{phone_suffix}%")
             ).first()
        elif '@' in username:
             phone_part = username.split('@')[0].replace('+', '')
             user = db.query(Farmer).filter(
                 Farmer.phone_number.like(f"%{phone_part}%")
             ).first()
        
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password"
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.put("/{farmer_id}/profile")
async def update_farmer_profile(farmer_id: int, profile_update: ProfileUpdate, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
        
    if profile_update.village and profile_update.village != farmer.village:
        farmer.village = profile_update.village
        lat, lon = await get_coordinates(profile_update.village)
        if lat and lon:
            farmer.latitude = lat
            farmer.longitude = lon
            
    if profile_update.crop_type:
        field = db.query(Field).filter(Field.farmer_id == farmer_id).first()
        if field:
            field.crop_type = profile_update.crop_type
            
    db.commit()
    db.refresh(farmer)
    return {"status": "success", "message": "Profile updated"}

@router.get("/me", response_model=FarmerResponse)
async def get_my_profile(current_user: Farmer = Depends(get_current_user)):
    return current_user

@router.get("/full-profile")
async def get_full_profile(current_user: Farmer = Depends(get_current_user), db: Session = Depends(get_db)):
    # Returns everything: Farmer, Field, Devices, Settings
    field = db.query(Field).filter(Field.farmer_id == current_user.id).first()
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    
    # Ensure settings exist (for older users)
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return {
        "profile": {
            "name": current_user.name,
            "email": current_user.email,
            "phone_number": current_user.phone_number,
            "preferred_language": current_user.preferred_language,
            "profile_photo": current_user.profile_photo,
        },
        "farm": {
            "id": field.id if field else None,
            "farm_name": field.farm_name if field else f"{current_user.name}'s Farm",
            "village": current_user.village,
            "farm_size": field.field_area if field else 1.0,
            "latitude": current_user.latitude,
            "longitude": current_user.longitude,
        },
        "crop": {
            "crop_type": field.crop_type if field else "Unknown",
            "planting_date": field.planting_date if field else None,
            "growth_stage": field.growth_stage if field else "Initial",
            "irrigation_method": field.irrigation_method if field else "Drip",
        },
        "settings": {
            "sms_alerts": settings.sms_alerts,
            "voice_alerts": settings.voice_alerts,
            "dashboard_notifications": settings.dashboard_notifications,
            "auto_irrigation": settings.auto_irrigation,
            "soil_moisture_threshold": settings.soil_moisture_threshold,
            "max_irrigation_duration": settings.max_irrigation_duration,
            "water_usage_limit": settings.water_usage_limit,
        },
        "devices": [
            {
                "id": d.id,
                "device_id": d.device_id,
                "device_type": d.device_type,
                "status": d.status,
                "last_sync": d.last_sync,
                "health_score": d.health_score
            } for d in current_user.devices
        ]
    }

@router.put("/full-profile/update")
async def update_full_profile(
    profile_update: FullProfileUpdate, 
    current_user: Farmer = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    field = db.query(Field).filter(Field.farmer_id == current_user.id).first()
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    
    # 1. Update Farmer Profile
    if profile_update.name: current_user.name = profile_update.name
    if profile_update.email: current_user.email = profile_update.email
    if profile_update.phone_number: current_user.phone_number = profile_update.phone_number
    if profile_update.preferred_language: current_user.preferred_language = profile_update.preferred_language
    if profile_update.profile_photo: current_user.profile_photo = profile_update.profile_photo
    
    # 2. Update Farm
    if field:
        if profile_update.farm_name: field.farm_name = profile_update.farm_name
        if profile_update.village: 
            field.village = profile_update.village
            lat, lon = await get_coordinates(profile_update.village)
            if lat: 
                current_user.latitude = lat
                current_user.longitude = lon
        if profile_update.farm_size is not None: field.field_area = profile_update.farm_size
        if profile_update.latitude is not None: current_user.latitude = profile_update.latitude
        if profile_update.longitude is not None: current_user.longitude = profile_update.longitude
        
        # 3. Update Crop
        if profile_update.crop_type: field.crop_type = profile_update.crop_type
        if profile_update.planting_date: field.planting_date = profile_update.planting_date
        if profile_update.growth_stage: field.growth_stage = profile_update.growth_stage
        if profile_update.irrigation_method: field.irrigation_method = profile_update.irrigation_method

    # 4. Update Settings
    if settings:
        if profile_update.sms_alerts is not None: settings.sms_alerts = profile_update.sms_alerts
        if profile_update.voice_alerts is not None: settings.voice_alerts = profile_update.voice_alerts
        if profile_update.dashboard_notifications is not None: settings.dashboard_notifications = profile_update.dashboard_notifications
        if profile_update.auto_irrigation is not None: settings.auto_irrigation = profile_update.auto_irrigation
        if profile_update.soil_moisture_threshold is not None: settings.soil_moisture_threshold = profile_update.soil_moisture_threshold
        if profile_update.max_irrigation_duration is not None: settings.max_irrigation_duration = profile_update.max_irrigation_duration
        if profile_update.water_usage_limit is not None: settings.water_usage_limit = profile_update.water_usage_limit
    
    db.commit()
    return {"status": "success", "message": "Full profile updated successfully"}

@router.post("/devices/register")
async def register_device(device_id: str, current_user: Farmer = Depends(get_current_user), db: Session = Depends(get_db)):
    from ..models.database import Device
    existing = db.query(Device).filter(Device.device_id == device_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Device already registered")
    
    new_device = Device(
        user_id=current_user.id,
        device_id=device_id,
        status="Online",
        last_sync=datetime.utcnow()
    )
    db.add(new_device)
    db.commit()
    return {"status": "success", "device_id": device_id}

@router.delete("/devices/{device_id}")
async def delete_device(device_id: str, current_user: Farmer = Depends(get_current_user), db: Session = Depends(get_db)):
    from ..models.database import Device
    device = db.query(Device).filter(Device.device_id == device_id, Device.user_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    db.delete(device)
    db.commit()
    return {"status": "success", "message": "Device removed"}

@router.post("/upload-photo")
async def upload_farmer_photo(
    file: UploadFile = File(...),
    current_user: Farmer = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure directory exists
    os.makedirs("static/uploads", exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"profile_{current_user.id}{file_extension}"
    file_path = os.path.join("static/uploads", file_name)
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # Update user profile photo field
    photo_url = f"/static/uploads/{file_name}"
    current_user.profile_photo = photo_url
    db.commit()
    
    return {"info": f"file '{file.filename}' saved at '{file_path}'", "photo_url": photo_url}


