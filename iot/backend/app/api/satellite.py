from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.database import Field, SatelliteData, Farmer
from ..services.satellite import satellite_service
from ..core.auth import get_current_user
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/satellite", tags=["Satellite"])

DEFAULT_LAT = 17.515397
DEFAULT_LON = 78.3817156

@router.get("/ndvi")
async def get_ndvi_analysis(
    current_user: Farmer = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Requested Module 1: NDVI Crop Health Analysis.
    Calculates NDVI using Sentinel-2 B8 and B4 bands.
    """
    field = db.query(Field).filter(Field.farmer_id == current_user.id).first()
    if not field:
        field = Field(
            farmer_id=current_user.id,
            crop_type="Mixed Crop",
            field_area=2.0,
            growth_stage="Vegetative",
            season="Kharif"
        )
        db.add(field)
        db.commit()
        db.refresh(field)
        
    lat = current_user.latitude if current_user.latitude is not None else DEFAULT_LAT
    lon = current_user.longitude if current_user.longitude is not None else DEFAULT_LON

    try:
        ndvi_data = await satellite_service.get_ndvi(lat, lon)
        
        # Save to database for history
        record = SatelliteData(
            field_id=field.id,
            ndvi_value=ndvi_data["ndvi_value"],
            health_status=ndvi_data["health_status"],
            stress_alert=ndvi_data["stress_alert"],
            image_date=datetime.strptime(ndvi_data["image_date"], '%Y-%m-%d') if ndvi_data.get("image_date") else datetime.utcnow()
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        
        return {
            "ndvi_value": record.ndvi_value,
            "status": record.health_status,
            "classification": record.health_status,
            "image_date": record.image_date.strftime('%Y-%m-%d'),
            "is_stressed": record.stress_alert,
            "source": ndvi_data.get("source", "Sentinel-2")
        }
    except Exception as e:
        logger.error(f"Error in NDVI Analysis: {e}")
        return {
            "ndvi_value": 0.45,
            "status": "Moderate growth",
            "classification": "Moderate growth",
            "image_date": datetime.now().strftime('%Y-%m-%d'),
            "is_stressed": False,
            "source": "Simulated (GEE error)"
        }

@router.get("/health-map")
async def get_satellite_health_map(
    current_user: Farmer = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Requested Module 2: Farm Health Map.
    Returns RGB, False Color, and NDVI visualization URLs.
    """
    lat = current_user.latitude if current_user.latitude is not None else DEFAULT_LAT
    lon = current_user.longitude if current_user.longitude is not None else DEFAULT_LON

    try:
        map_data = await satellite_service.get_satellite_image(lat, lon)
        return {
            "true_color_url": map_data["rgb_image_url"],
            "ndvi_viz_url": map_data["ndvi_image_url"],
            "false_color_url": map_data.get("false_color_url", map_data["rgb_image_url"]),
            "metadata": {
                "date": map_data.get("image_date", datetime.now().strftime('%Y-%m-%d')),
                "lat": lat,
                "lon": lon,
                "ndvi_point": map_data.get("ndvi_value", 0.5)
            }
        }
    except Exception as e:
        logger.error(f"Error in Health Map: {e}")
        return {
            "true_color_url": "https://mt1.google.com/vt/lyrs=y&x=94073&y=59057&z=17",
            "ndvi_viz_url": "https://mt1.google.com/vt/lyrs=y&x=94073&y=59057&z=17",
            "false_color_url": "https://mt1.google.com/vt/lyrs=y&x=94073&y=59057&z=17",
            "metadata": {
                "date": datetime.now().strftime('%Y-%m-%d'),
                "lat": lat,
                "lon": lon,
                "ndvi_point": 0.45
            }
        }

@router.get("/ndvi-trend")
async def get_ndvi_trend(
    current_user: Farmer = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Requested Module 3: Crop Growth Monitoring.
    Returns Week-by-Week trend for chart generation.
    Requested Module 4: Water Stress Detection.
    """
    field = db.query(Field).filter(Field.farmer_id == current_user.id).first()
    if not field:
        field = Field(
            farmer_id=current_user.id,
            crop_type="Mixed Crop",
            field_area=2.0,
            growth_stage="Vegetative",
            season="Kharif"
        )
        db.add(field)
        db.commit()
        db.refresh(field)
        
    trend_data = await satellite_service.get_crop_health_trend(field.id, db)
    
    alert = None
    if trend_data.get("stress_detected"):
        alert = "Satellite imagery indicates possible water stress in the field."
        field.health_status = "STRESSED"
        db.commit()
        
    return {
        "latest_ndvi": trend_data.get("latest_ndvi"),
        "trend": trend_data.get("records"),
        "alert": alert,
        "is_stressed": trend_data.get("stress_detected")
    }

@router.get("/image")
async def get_satellite_image_classic(
    lat: float = Query(DEFAULT_LAT), 
    lon: float = Query(DEFAULT_LON)
):
    """Classic endpoint for generic use cases"""
    return await satellite_service.get_satellite_image(lat, lon)

