from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.database import Farmer, Field
from ..schemas.schemas import FarmerCreate, FarmerResponse, Token, LoginRequest, ProfileUpdate
from ..services.geocoding import get_coordinates
from ..services.twilio_service import twilio_service
from ..core.auth import get_password_hash, verify_password, create_access_token
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
    db.commit()
    
    # Trigger onboarding call in the background
    base_url = os.getenv("BASE_URL", "http://your-app.com")
    background_tasks.add_task(twilio_service.make_onboarding_call, new_farmer.phone_number, base_url)
    
    return new_farmer
    
@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Farmer).filter(
        (Farmer.email == login_data.username) | 
        (Farmer.phone_number == login_data.username)
    ).first()
    
    # Try one more case: if the frontend sends +9112345678@farmer.local
    if not user and login_data.username.endswith('@farmer.local'):
        phone_part = login_data.username.replace('@farmer.local', '')
        user = db.query(Farmer).filter(Farmer.phone_number == phone_part).first()
        
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
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
