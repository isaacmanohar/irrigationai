from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.database import Field, SatelliteData
from ..services.satellite import satellite_service
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/satellite", tags=["Satellite"])

@router.get("/ndvi/{field_id}")
async def get_field_ndvi(field_id: int, db: Session = Depends(get_db)):
    """Get latest NDVI data for a field"""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field or not field.owner:
        raise HTTPException(status_code=404, detail="Field not found")
    
    # Check if we have recent satellite data (within 7 days)
    latest_satellite = (db.query(SatelliteData)
                       .filter(SatelliteData.field_id == field_id)
                       .order_by(SatelliteData.timestamp.desc())
                       .first())
    
    # If no recent data, fetch new data
    if not latest_satellite or (datetime.utcnow() - latest_satellite.timestamp).days > 7:
        # Fetch NDVI from satellite service
        ndvi_data = await satellite_service.get_ndvi(field.owner.latitude, field.owner.longitude)
        
        # Store in database
        satellite_record = SatelliteData(
            field_id=field_id,
            ndvi_value=ndvi_data["ndvi_value"],
            health_status=ndvi_data["health_status"],
            stress_alert=ndvi_data["stress_alert"],
            image_date=datetime.fromisoformat(ndvi_data["image_date"]) if "image_date" in ndvi_data else datetime.utcnow()
        )
        db.add(satellite_record)
        db.commit()
        db.refresh(satellite_record)
        
        return {
            "field_id": field_id,
            "ndvi_value": satellite_record.ndvi_value,
            "health_status": satellite_record.health_status,
            "stress_alert": satellite_record.stress_alert,
            "image_date": satellite_record.image_date.isoformat(),
            "fetched_at": satellite_record.timestamp.isoformat(),
            "source": ndvi_data.get("source", "Unknown")
        }
    else:
        return {
            "field_id": field_id,
            "ndvi_value": latest_satellite.ndvi_value,
            "health_status": latest_satellite.health_status,
            "stress_alert": latest_satellite.stress_alert,
            "image_date": latest_satellite.image_date.isoformat() if latest_satellite.image_date else None,
            "fetched_at": latest_satellite.timestamp.isoformat(),
            "source": "Cached"
        }

@router.get("/crop-health/{field_id}")
async def get_crop_health(field_id: int, db: Session = Depends(get_db)):
    """Get crop health status and trend"""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    # Get health trend
    trend_data = await satellite_service.get_crop_health_trend(field_id, db)
    
    # Get latest sensor data for combined analysis
    from ..models.database import SensorData
    latest_sensor = (db.query(SensorData)
                    .filter(SensorData.field_id == field_id)
                    .order_by(SensorData.timestamp.desc())
                    .first())
    
    # Combine satellite and sensor data for irrigation recommendation
    irrigation_recommendation = "No action needed"
    recommendation_reason = ""
    
    if trend_data["latest_ndvi"]:
        ndvi = trend_data["latest_ndvi"]
        
        if latest_sensor:
            soil_moisture = latest_sensor.soil_moisture
            
            # Decision logic
            if ndvi < 0.4 and soil_moisture < 30:
                irrigation_recommendation = "Strongly recommended"
                recommendation_reason = f"Low NDVI ({ndvi}) and low soil moisture ({soil_moisture}%)"
            elif ndvi < 0.5 and soil_moisture < 40:
                irrigation_recommendation = "Recommended"
                recommendation_reason = f"Moderate NDVI ({ndvi}) and moderate soil moisture ({soil_moisture}%)"
            elif ndvi >= 0.7 and soil_moisture >= 50:
                irrigation_recommendation = "Not needed"
                recommendation_reason = f"Healthy NDVI ({ndvi}) and sufficient soil moisture ({soil_moisture}%)"
            elif ndvi < 0.3:
                irrigation_recommendation = "Critical - immediate action"
                recommendation_reason = f"Very low NDVI ({ndvi}) indicates crop stress"
        else:
            if ndvi < 0.4:
                irrigation_recommendation = "Likely needed"
                recommendation_reason = f"Low NDVI ({ndvi}) suggests water stress"
    
    return {
        "field_id": field_id,
        "crop_type": field.crop_type,
        "growth_stage": field.growth_stage,
        "health_trend": trend_data["trend"],
        "latest_ndvi": trend_data["latest_ndvi"],
        "latest_health_status": trend_data["latest_health"],
        "irrigation_recommendation": irrigation_recommendation,
        "recommendation_reason": recommendation_reason,
        "ndvi_history": trend_data["records"]
    }

@router.get("/history/{field_id}")
async def get_satellite_history(field_id: int, limit: int = 30, db: Session = Depends(get_db)):
    """Get historical satellite data for a field"""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    # Get satellite data history
    satellite_records = (db.query(SatelliteData)
                        .filter(SatelliteData.field_id == field_id)
                        .order_by(SatelliteData.timestamp.desc())
                        .limit(limit)
                        .all())
    
    return {
        "field_id": field_id,
        "total_records": len(satellite_records),
        "history": [
            {
                "id": record.id,
                "ndvi_value": record.ndvi_value,
                "health_status": record.health_status,
                "stress_alert": record.stress_alert,
                "image_date": record.image_date.isoformat() if record.image_date else None,
                "fetched_at": record.timestamp.isoformat()
            }
            for record in reversed(satellite_records)
        ]
    }

@router.post("/refresh/{field_id}")
async def refresh_satellite_data(field_id: int, db: Session = Depends(get_db)):
    """Force refresh satellite data for a field"""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field or not field.owner:
        raise HTTPException(status_code=404, detail="Field not found")
    
    try:
        # Fetch fresh NDVI data
        ndvi_data = await satellite_service.get_ndvi(field.owner.latitude, field.owner.longitude)
        
        # Store in database
        satellite_record = SatelliteData(
            field_id=field_id,
            ndvi_value=ndvi_data["ndvi_value"],
            health_status=ndvi_data["health_status"],
            stress_alert=ndvi_data["stress_alert"],
            image_date=datetime.fromisoformat(ndvi_data["image_date"]) if "image_date" in ndvi_data else datetime.utcnow()
        )
        db.add(satellite_record)
        db.commit()
        db.refresh(satellite_record)
        
        return {
            "status": "success",
            "message": "Satellite data refreshed",
            "ndvi_value": satellite_record.ndvi_value,
            "health_status": satellite_record.health_status,
            "stress_alert": satellite_record.stress_alert,
            "image_date": satellite_record.image_date.isoformat(),
            "fetched_at": satellite_record.timestamp.isoformat()
        }
    except Exception as e:
        logger.error(f"Error refreshing satellite data: {e}")
        raise HTTPException(status_code=500, detail=f"Error refreshing satellite data: {str(e)}")
