import random
import logging
import os
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class SatelliteService:
    def __init__(self):
        """Initialize satellite service with Google Earth Engine credentials"""
        self.gee_available = False
        try:
            import ee
            # Try to authenticate with Earth Engine
            # In production, use service account credentials
            try:
                ee.Initialize()
                self.gee_available = True
                logger.info("Google Earth Engine initialized successfully")
            except Exception as e:
                logger.warning(f"Could not initialize Earth Engine: {e}. Using simulated data.")
                self.gee_available = False
        except ImportError:
            logger.warning("earthengine-api not installed. Using simulated satellite data.")
            self.gee_available = False
    
    async def get_ndvi(self, lat: float, lon: float, days_back: int = 30):
        """
        Fetches NDVI (Normalized Difference Vegetation Index) for a given location.
        
        Args:
            lat: Latitude of the field
            lon: Longitude of the field
            days_back: Number of days to look back for satellite imagery
            
        Returns:
            Dictionary with NDVI value, health status, and metadata
        """
        if self.gee_available:
            return await self._get_ndvi_from_gee(lat, lon, days_back)
        else:
            return self._get_simulated_ndvi(lat, lon)
    
    async def _get_ndvi_from_gee(self, lat: float, lon: float, days_back: int):
        """Fetch NDVI from Google Earth Engine using Sentinel-2 data"""
        try:
            import ee
            
            # Create a point geometry for the field
            point = ee.Geometry.Point([lon, lat])
            
            # Get Sentinel-2 imagery
            # Filter by date and cloud cover
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            sentinel2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                        .filterBounds(point)
                        .filterDate(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
                        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                        .sort('system:time_start', False))
            
            if sentinel2.size().getInfo() == 0:
                logger.warning(f"No cloud-free Sentinel-2 images found for {lat}, {lon}")
                return self._get_simulated_ndvi(lat, lon)
            
            # Get the most recent image
            latest_image = sentinel2.first()
            
            # Calculate NDVI = (NIR - Red) / (NIR + Red)
            # Sentinel-2 bands: B4=Red, B8=NIR
            ndvi = latest_image.normalizedDifference(['B8', 'B4']).rename('NDVI')
            
            # Get NDVI value at the point
            ndvi_value = ndvi.sample(point, 30).first().get('NDVI').getInfo()
            
            # Get image date
            image_date = ee.Date(latest_image.get('system:time_start')).format('YYYY-MM-dd').getInfo()
            
            # Interpret NDVI
            health_status, stress_alert = self._interpret_ndvi(ndvi_value)
            
            return {
                "ndvi_value": round(float(ndvi_value), 3),
                "health_status": health_status,
                "stress_alert": stress_alert,
                "image_date": image_date,
                "source": "Sentinel-2"
            }
            
        except Exception as e:
            logger.error(f"Error fetching NDVI from GEE: {e}")
            return self._get_simulated_ndvi(lat, lon)
    
    def _get_simulated_ndvi(self, lat: float, lon: float):
        """Generate simulated NDVI data for demonstration"""
        # Simulate realistic NDVI values based on location
        # Add some variation based on coordinates for consistency
        random.seed(int(lat * 1000 + lon * 1000))
        ndvi = round(random.uniform(0.3, 0.85), 3)
        
        health_status, stress_alert = self._interpret_ndvi(ndvi)
        
        return {
            "ndvi_value": ndvi,
            "health_status": health_status,
            "stress_alert": stress_alert,
            "image_date": (datetime.now() - timedelta(days=random.randint(1, 5))).strftime('%Y-%m-%d'),
            "source": "Simulated"
        }
    
    def _interpret_ndvi(self, ndvi_value: float):
        """Interpret NDVI value to health status"""
        if ndvi_value < 0.2:
            return "Poor vegetation", True
        elif ndvi_value < 0.4:
            return "Poor vegetation", True
        elif ndvi_value < 0.6:
            return "Moderate vegetation", False
        elif ndvi_value < 0.8:
            return "Healthy vegetation", False
        else:
            return "Very healthy vegetation", False
    
    async def get_crop_health_trend(self, field_id: int, db_session):
        """Get NDVI trend over time for a field"""
        from ..models.database import SatelliteData
        
        # Get last 10 satellite data points
        satellite_records = (db_session.query(SatelliteData)
                            .filter(SatelliteData.field_id == field_id)
                            .order_by(SatelliteData.timestamp.desc())
                            .limit(10)
                            .all())
        
        if not satellite_records:
            return {"trend": "No data", "records": []}
        
        records = [
            {
                "ndvi": record.ndvi_value,
                "health": record.health_status,
                "date": record.image_date.isoformat() if record.image_date else record.timestamp.isoformat(),
                "timestamp": record.timestamp.isoformat()
            }
            for record in reversed(satellite_records)
        ]
        
        # Determine trend
        if len(records) >= 2:
            latest_ndvi = records[-1]["ndvi"]
            previous_ndvi = records[-2]["ndvi"]
            
            if latest_ndvi > previous_ndvi + 0.05:
                trend = "Improving"
            elif latest_ndvi < previous_ndvi - 0.05:
                trend = "Declining"
            else:
                trend = "Stable"
        else:
            trend = "Insufficient data"
        
        return {
            "trend": trend,
            "records": records,
            "latest_ndvi": records[-1]["ndvi"] if records else None,
            "latest_health": records[-1]["health"] if records else None
        }

satellite_service = SatelliteService()
