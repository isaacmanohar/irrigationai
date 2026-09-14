import os
import sys
import json
import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy import create_engine, desc
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add the current directory to sys.path to import app modules
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, CURRENT_DIR)

from app.models.database import Farmer, Field, SensorData, SatelliteData, Base
from app.services.prediction import predictor
from app.services.schedule_advisor import schedule_advisor
from app.services.twilio_service import twilio_service
from app.services.ai_service import ai_service

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
DB_URL = "sqlite:///d:/iot/iot-day2/iot/iot/backend/irrigation.db"
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def trigger_smart_call(farmer_id: int):
    db = SessionLocal()
    try:
        # 1. Fetch Farmer and Field data
        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        if not farmer:
            logger.error(f"Farmer with ID {farmer_id} not found.")
            return

        field = db.query(Field).filter(Field.farmer_id == farmer_id).first()
        if not field:
            logger.error(f"No field found for farmer {farmer.name}.")
            return

        # 2. Fetch Latest Sensor Data
        latest_sensor = db.query(SensorData).filter(SensorData.field_id == field.id).order_by(desc(SensorData.timestamp)).first()
        if not latest_sensor:
            logger.warning(f"No sensor data found for field {field.id}. Using defaults.")
            latest_sensor = SensorData(soil_moisture=35.0, temperature=28.0, humidity=60.0)

        # 3. Fetch Latest Satellite Data
        latest_sat = db.query(SatelliteData).filter(SatelliteData.field_id == field.id).order_by(desc(SatelliteData.timestamp)).first()
        ndvi_value = latest_sat.ndvi_value if latest_sat else 0.5

        # 4. Run Predictions
        sensor_features = {
            'soil_type': 1, # Defaulting to Loamy
            'soil_moisture': latest_sensor.soil_moisture,
            'temperature': latest_sensor.temperature,
            'humidity': latest_sensor.humidity,
            'rainfall_mm': 0.0, # Default
            'sunlight_hours': 8.0,
            'wind_speed_kmh': 10.0,
            'crop_type': 1 if field.crop_type == "Wheat" else 0,
            'growth_stage': 1, # Default
            'season': 1,
            'ndvi': ndvi_value,
            'prev_irrigation_mm': 10.0
        }

        prediction_result = predictor.predict_with_satellite(
            sensor_features, 
            ndvi_value=ndvi_value
        )
        
        # 5. Generate Weekly Schedule
        schedule_result = await schedule_advisor.generate_weekly_schedule(
            crop_type=field.crop_type or "Wheat",
            growth_stage=field.growth_stage or "Development",
            current_moisture=latest_sensor.soil_moisture,
            ndvi_index=ndvi_value,
            latitude=farmer.latitude,
            longitude=farmer.longitude,
            soil_type="loamy",
            field_area_hectare=field.field_area or 1.0
        )

        schedule = schedule_result.get('schedule', {})
        
        # 6. Construct Smart Message for the Farmer
        # We want to tell them:
        # - Current soil moisture
        # - Irrigation need (from model)
        # - Water requirement (from model)
        # - Next scheduled irrigation date
        
        needs_irrigation = prediction_result.get('needs_irrigation', False)
        water_req = prediction_result.get('water_requirement_mm', 0)
        next_date = schedule.get('next_irrigation_date', 'tomorrow')
        
        # Format the date for speech
        try:
            date_obj = datetime.strptime(next_date, '%Y-%m-%d')
            formatted_date = date_obj.strftime('%B %d')
        except:
            formatted_date = next_date

        summary_prompt = f"""
        Farmer: {farmer.name}
        Crop: {field.crop_type}
        Soil Moisture: {latest_sensor.soil_moisture}%
        NDVI: {ndvi_value}
        Prediction: {"Irrigation is recommended" if needs_irrigation else "Soil moisture is adequate"}
        Water Required: {water_req} mm
        Next Scheduled Irrigation: {formatted_date}
        
        Generate a friendly, professional AI Advisor voice message for the farmer.
        Keep it concise (max 2 sentences).
        Speak directly to the farmer.
        If irrigation is needed, specify the amount.
        Mention the next scheduled date.
        
        Response language: {farmer.preferred_language}
        """

        # Use Groq to generate the natural language message
        ai_message = await ai_service.generate_irrigation_advice(
            {
                "farmer_name": farmer.name,
                "crop": field.crop_type,
                "soil_moisture": latest_sensor.soil_moisture,
                "temperature": latest_sensor.temperature,
                "prediction": "High" if needs_irrigation else "Low",
                "water_req": water_req,
                "next_date": formatted_date
            },
            farmer.preferred_language
        )
        
        # Ensure message is very short for Twilio trial
        if len(ai_message) > 150:
             ai_message = ai_message[:147] + "..."

        logger.info(f"Generated AI Message: {ai_message}")

        # 7. Trigger the Call
        if farmer.phone_number:
            logger.info(f"Triggering call to {farmer.name} at {farmer.phone_number}")
            call_sid = twilio_service.client.calls.create(
                to=farmer.phone_number,
                from_=os.getenv("TWILIO_PHONE_NUMBER"),
                twiml=f'<Response><Say voice="Polly.Raveena" language="en-IN">{ai_message}</Say></Response>'
            )
            logger.info(f"Call initiated. SID: {call_sid.sid}")
            print(f"Call successfully triggered for {farmer.name}!")
            print(f"Message: {ai_message}")
        else:
            logger.error(f"No phone number for farmer {farmer.name}")

    except Exception as e:
        logger.error(f"Error in smart call trigger: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    # Test with farmer ID 7 (Suresh)
    asyncio.run(trigger_smart_call(7))
