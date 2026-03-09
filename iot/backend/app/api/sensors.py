from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.database import SensorData, Field, Farmer
from ..schemas.schemas import SensorDataCreate
from ..services.prediction import predictor
from ..services.weather import get_weather
from ..services.twilio_service import twilio_service
import datetime

router = APIRouter(prefix="/sensors", tags=["Sensors"])

@router.post("/data")
async def receive_sensor_data(data: SensorDataCreate, db: Session = Depends(get_db)):
    # 1. Store sensor data
    new_data = SensorData(
        field_id=data.field_id,
        soil_moisture=data.soil_moisture,
        temperature=data.temperature,
        humidity=data.humidity,
        flow_rate=data.flow_rate
    )
    db.add(new_data)
    
    # 2. Get Field and Farmer info for context
    field = db.query(Field).filter(Field.id == data.field_id).first()
    farmer = field.owner if field else None
    
    # 3. Fetch Weather data
    weather = None
    if farmer and farmer.latitude:
        weather = await get_weather(farmer.latitude, farmer.longitude)
    
    # 4. AI Prediction
    prediction_input = {
        'soil_moisture': data.soil_moisture,
        'temperature': data.temperature,
        'humidity': data.humidity,
        'rainfall_mm': weather.get('precipitation', 0) if weather else 0,
        'sunlight_hours': 8, # placeholder
        'wind_speed_kmh': weather.get('windspeed', 0) if weather else 0,
        'crop_type': 1, # placeholder mapping
        'growth_stage': 1, # placeholder
        'field_area_hectare': field.field_area if field else 1.0,
        'prev_irrigation_mm': 10 # placeholder from history
    }
    
    irrigation_need = predictor.predict_irrigation_need(prediction_input)
    
    # 5. Safety Checks (Over-irrigation)
    threshold = field.optimal_moisture_level if field else 40.0
    pump_action = "STAY_OFF"
    
    if data.soil_moisture >= threshold + 10:
        pump_action = "FORCE_OFF"
        # Trigger alert if over-irrigating
        if farmer:
            # twilio_service.make_advisory_call(...) 
            pass
    elif irrigation_need in ["Medium", "High"] and data.soil_moisture < threshold:
        pump_action = "START"
    
    db.commit()
    
    return {
        "status": "success",
        "irrigation_recommendation": irrigation_need,
        "pump_action": pump_action
    }
