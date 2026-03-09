from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.database import SensorData, Field, Farmer, IrrigationHistory, SatelliteData
from ..services.satellite import satellite_service
from ..services.prediction import predictor
from ..services.ai_service import ai_service
from typing import List
from datetime import datetime, timedelta

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/status/{field_id}")
async def get_field_status(field_id: int, db: Session = Depends(get_db)):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
        
    farmer = field.owner
    latest_data = db.query(SensorData).filter(SensorData.field_id == field_id).order_by(SensorData.timestamp.desc()).first()
    
    # Get latest satellite data
    latest_satellite = (db.query(SatelliteData)
                       .filter(SatelliteData.field_id == field_id)
                       .order_by(SatelliteData.timestamp.desc())
                       .first())
    
    # Get NDVI
    ndvi_info = await satellite_service.get_ndvi(farmer.latitude, farmer.longitude) if farmer and farmer.latitude else {"ndvi_value": 0.5, "health_status": "Healthy vegetation"}
    
    # Get Weather
    from ..services.weather import get_weather
    weather_info = await get_weather(farmer.latitude, farmer.longitude) if farmer and farmer.latitude else None
    
    # Generate AI insights
    ai_insights = ""
    if latest_satellite and latest_data:
        # Check for declining NDVI
        previous_satellite = (db.query(SatelliteData)
                             .filter(SatelliteData.field_id == field_id)
                             .order_by(SatelliteData.timestamp.desc())
                             .offset(1)
                             .first())
        
        if previous_satellite:
            ndvi_change = latest_satellite.ndvi_value - previous_satellite.ndvi_value
            if ndvi_change < -0.05 and latest_data.soil_moisture < 40:
                ai_insights = f"Satellite analysis shows declining crop health (NDVI: {latest_satellite.ndvi_value}). Combined with low soil moisture ({latest_data.soil_moisture}%), irrigation is strongly recommended."
            elif latest_satellite.ndvi_value < 0.4 and latest_data.soil_moisture < 30:
                ai_insights = f"Critical: Low NDVI ({latest_satellite.ndvi_value}) and very low soil moisture ({latest_data.soil_moisture}%) detected. Immediate irrigation needed."
            elif latest_satellite.ndvi_value >= 0.7 and latest_data.soil_moisture >= 50:
                ai_insights = f"Crop health is excellent (NDVI: {latest_satellite.ndvi_value}) with sufficient soil moisture ({latest_data.soil_moisture}%). No irrigation needed at this time."
    
    return {
        "field_info": {
            "id": field.id,
            "crop": field.crop_type,
            "area": field.field_area,
            "stage": field.growth_stage
        },
        "sensor_data": {
            "soil_moisture": latest_data.soil_moisture if latest_data else None,
            "temperature": latest_data.temperature if latest_data else None,
            "humidity": latest_data.humidity if latest_data else None,
            "flow_rate": latest_data.flow_rate if latest_data else None,
            "timestamp": latest_data.timestamp.isoformat() if latest_data else None
        },
        "satellite_data": {
            "ndvi_value": latest_satellite.ndvi_value if latest_satellite else ndvi_info.get("ndvi_value"),
            "health_status": latest_satellite.health_status if latest_satellite else ndvi_info.get("health_status"),
            "stress_alert": latest_satellite.stress_alert if latest_satellite else False,
            "image_date": latest_satellite.image_date.isoformat() if latest_satellite and latest_satellite.image_date else None
        },
        "weather": weather_info,
        "pump_status": "OFF",
        "farmer_name": farmer.name if farmer else "Farmer",
        "farmer_village": farmer.village if farmer else "Unknown",
        "ai_insights": ai_insights
    }

@router.get("/history/{field_id}")
async def get_irrigation_history(field_id: int, db: Session = Depends(get_db)):
    history = db.query(IrrigationHistory).filter(IrrigationHistory.field_id == field_id).order_by(IrrigationHistory.start_time.desc()).limit(10).all()
    return history

@router.get("/satellite-insights/{field_id}")
async def get_satellite_insights(field_id: int, db: Session = Depends(get_db)):
    """Get detailed satellite-based insights for a field"""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    # Get latest satellite data
    latest_satellite = (db.query(SatelliteData)
                       .filter(SatelliteData.field_id == field_id)
                       .order_by(SatelliteData.timestamp.desc())
                       .first())
    
    # Get satellite trend
    trend_data = await satellite_service.get_crop_health_trend(field_id, db)
    
    # Get latest sensor data
    latest_sensor = (db.query(SensorData)
                    .filter(SensorData.field_id == field_id)
                    .order_by(SensorData.timestamp.desc())
                    .first())
    
    # Generate comprehensive insights
    insights = []
    
    if latest_satellite:
        ndvi = latest_satellite.ndvi_value
        
        # NDVI-based insights
        if ndvi < 0.3:
            insights.append({
                "type": "critical",
                "message": f"Very low NDVI ({ndvi}) indicates severe crop stress. Immediate intervention required.",
                "action": "Increase irrigation frequency and check for pest/disease"
            })
        elif ndvi < 0.4:
            insights.append({
                "type": "warning",
                "message": f"Low NDVI ({ndvi}) suggests poor vegetation. Monitor closely.",
                "action": "Increase irrigation and apply nutrients"
            })
        elif ndvi >= 0.7:
            insights.append({
                "type": "positive",
                "message": f"Excellent crop health with NDVI of {ndvi}.",
                "action": "Maintain current irrigation schedule"
            })
        
        # Trend analysis
        if trend_data["trend"] == "Declining":
            insights.append({
                "type": "warning",
                "message": "Crop health is declining over time.",
                "action": "Investigate cause and adjust management practices"
            })
        elif trend_data["trend"] == "Improving":
            insights.append({
                "type": "positive",
                "message": "Crop health is improving.",
                "action": "Continue current management practices"
            })
    
    # Combine with sensor data
    if latest_sensor:
        if latest_sensor.soil_moisture < 25:
            insights.append({
                "type": "critical",
                "message": f"Soil moisture critically low at {latest_sensor.soil_moisture}%.",
                "action": "Irrigate immediately"
            })
        elif latest_sensor.soil_moisture < 40:
            insights.append({
                "type": "warning",
                "message": f"Soil moisture low at {latest_sensor.soil_moisture}%.",
                "action": "Schedule irrigation soon"
            })
        
        if latest_sensor.temperature > 35:
            insights.append({
                "type": "warning",
                "message": f"High temperature ({latest_sensor.temperature}°C) increases water demand.",
                "action": "Increase irrigation frequency"
            })
    
    return {
        "field_id": field_id,
        "crop_type": field.crop_type,
        "latest_ndvi": latest_satellite.ndvi_value if latest_satellite else None,
        "health_trend": trend_data["trend"],
        "insights": insights,
        "last_updated": latest_satellite.timestamp.isoformat() if latest_satellite else None
    }
