import random
import logging
import os
import asyncio
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class SatelliteService:
    def __init__(self):
        """Initialize satellite service with Google Earth Engine credentials"""
        self.gee_available = False
        try:
            import ee
            
            # GEE Authentication configuration
            service_account = os.getenv("GEE_SERVICE_ACCOUNT")
            private_key_path = os.getenv("GEE_PRIVATE_KEY_PATH")
            project_id = os.getenv("GEE_PROJECT_ID", "irrigation-ai")

            try:
                if service_account and private_key_path and os.path.exists(private_key_path):
                    credentials = ee.ServiceAccountCredentials(service_account, private_key_path)
                    ee.Initialize(credentials, project=project_id)
                    logger.info(f"GEE initialized with Service Account: {service_account}")
                else:
                    ee.Initialize(project=project_id)
                    logger.info("GEE initialized with local credentials")
                
                self.gee_available = True
            except Exception as e:
                logger.warning(f"Could not initialize Earth Engine: {e}. Using simulated data.")
                self.gee_available = False
        except ImportError:
            logger.warning("earthengine-api not installed. Using simulated satellite data.")
            self.gee_available = False
    
    async def get_ndvi(self, lat: float, lon: float, days_back: int = 30):
        """Fetch NDVI analysis for specific coordinates"""
        if self.gee_available:
            return await asyncio.get_event_loop().run_in_executor(None, self._sync_get_ndvi, lat, lon, days_back)
        else:
            return self._get_simulated_ndvi(lat, lon)

    def _sync_get_ndvi(self, lat: float, lon: float, days_back: int):
        """Sync NDVI fetch from Google Earth Engine"""
        try:
            import ee
            point = ee.Geometry.Point([lon, lat])
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            sentinel2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                        .filterBounds(point)
                        .filterDate(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
                        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                        .sort('system:time_start', False))
            
            if sentinel2.size().getInfo() == 0:
                return self._get_simulated_ndvi(lat, lon)
            
            latest_image = sentinel2.first()
            # NDVI = (B8 - B4) / (B8 + B4)
            ndvi = latest_image.normalizedDifference(['B8', 'B4']).rename('NDVI')
            ndvi_value = ndvi.sample(point, 30).first().get('NDVI').getInfo()
            image_date = ee.Date(latest_image.get('system:time_start')).format('YYYY-MM-dd').getInfo()
            
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

    async def get_satellite_image(self, lat: float, lon: float, days_back: int = 60):
        """Returns True Color, False Color, and NDVI thumbnail URLs"""
        if self.gee_available:
            return await asyncio.get_event_loop().run_in_executor(
                None, self._sync_get_satellite_image, lat, lon, days_back
            )
        else:
            return self._get_simulated_image(lat, lon)

    def _sync_get_satellite_image(self, lat: float, lon: float, days_back: int):
        try:
            import ee
            point = ee.Geometry.Point([lon, lat])
            region = point.buffer(1000).bounds() # 1km radius

            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)

            collection = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                         .filterBounds(region)
                         .filterDate(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
                         .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 15))
                         .sort('system:time_start', False))

            if collection.size().getInfo() == 0:
                return self._get_simulated_image(lat, lon)

            latest = collection.first()
            image_date = ee.Date(latest.get('system:time_start')).format('YYYY-MM-dd').getInfo()

            # RGB URL
            rgb_url = latest.getThumbURL({
                'bands': ['B4', 'B3', 'B2'],
                'min': 0, 'max': 3000, 'gamma': 1.4,
                'region': region, 'dimensions': 512, 'format': 'png'
            })

            # False Color URL
            fc_url = latest.getThumbURL({
                'bands': ['B8', 'B4', 'B3'],
                'min': 0, 'max': 3000, 'gamma': 1.4,
                'region': region, 'dimensions': 512, 'format': 'png'
            })

            # NDVI URL with Palette
            ndvi_image = latest.normalizedDifference(['B8', 'B4'])
            ndvi_url = ndvi_image.getThumbURL({
                'min': 0, 'max': 1,
                'palette': ['#ff0000', '#ffff00', '#00ff00'], # Red, Yellow, Green as requested
                'region': region, 'dimensions': 512, 'format': 'png'
            })
            
            # Latest point value
            ndvi_value = ndvi_image.sample(point, 30).first().get('nd').getInfo()
            health_status, stress_alert = self._interpret_ndvi(ndvi_value)

            return {
                "rgb_image_url": rgb_url,
                "false_color_url": fc_url,
                "ndvi_image_url": ndvi_url,
                "ndvi_value": round(float(ndvi_value), 3),
                "health_status": health_status,
                "stress_alert": stress_alert,
                "image_date": image_date,
                "lat": lat, "lon": lon,
                "source": "Sentinel-2 (Live)"
            }
        except Exception as e:
            logger.error(f"Error fetching images from GEE: {e}")
            return self._get_simulated_image(lat, lon)

    def _interpret_ndvi(self, ndvi: float):
        """Requested classifications:
        NDVI > 0.6 -> Healthy vegetation
        NDVI 0.3-0.6 -> Moderate growth
        NDVI < 0.3 -> Crop stress
        """
        if ndvi > 0.6:
            return "Healthy vegetation", False
        elif ndvi >= 0.3:
            return "Moderate growth", False
        else:
            return "Crop stress", True

    def _get_simulated_image(self, lat: float, lon: float):
        import math
        # Calculate Tile Coordinates for a realistic zoom level (17)
        zoom = 17
        lat_rad = math.radians(lat)
        n = 2.0 ** zoom
        xtile = int((lon + 180.0) / 360.0 * n)
        ytile = int((1.0 - math.log(math.tan(lat_rad) + (1.0 / math.cos(lat_rad))) / math.pi) / 2.0 * n)
        
        # Using Google Hybrid/Satellite tiles for a "live" look in simulation
        # lyrs=s: Satellite, lyrs=y: Hybrid
        tile_url = f"https://mt1.google.com/vt/lyrs=y&x={xtile}&y={ytile}&z={zoom}"
        
        random.seed(int(lat * 1000 + lon * 1000))
        ndvi = round(random.uniform(0.2, 0.8), 3)
        status, alert = self._interpret_ndvi(ndvi)
        
        return {
            "rgb_image_url": tile_url,
            "false_color_url": tile_url, # Fallback to real tile
            "ndvi_image_url": "https://images.unsplash.com/photo-1500382017468-9049fee74a62?auto=format&fit=crop&w=800&q=80", # Farm placeholder
            "ndvi_value": ndvi,
            "health_status": status,
            "stress_alert": alert,
            "image_date": datetime.now().strftime('%Y-%m-%d'),
            "lat": lat, "lon": lon,
            "source": "Simulated (Location Sync)"
        }

    def _get_simulated_ndvi(self, lat: float, lon: float):
        random.seed(int(lat * 1000 + lon * 1000))
        ndvi = round(random.uniform(0.2, 0.8), 3)
        status, alert = self._interpret_ndvi(ndvi)
        return {
            "ndvi_value": ndvi,
            "health_status": status,
            "stress_alert": alert,
            "image_date": datetime.now().strftime('%Y-%m-%d'),
            "source": "Simulated"
        }

    async def get_crop_health_trend(self, field_id: int, db_session):
        from ..models.database import SatelliteData
        records = (db_session.query(SatelliteData)
                  .filter(SatelliteData.field_id == field_id)
                  .order_by(SatelliteData.timestamp.asc())
                  .limit(12)
                  .all())
        
        if not records:
            return {"trend": "No data", "records": []}
            
        history = [
            {
                "week": f"Week {i+1}",
                "ndvi": r.ndvi_value,
                "status": r.health_status,
                "date": r.image_date.strftime('%Y-%m-%d') if r.image_date else r.timestamp.strftime('%Y-%m-%d')
            }
            for i, r in enumerate(records)
        ]
        
        # Water Stress Detection (Logic #4)
        stress_detected = False
        if len(records) >= 2:
            last = records[-1].ndvi_value
            prev = records[-2].ndvi_value
            # If NDVI drops significantly (>0.15) mark as water stress
            if last < prev - 0.15:
                stress_detected = True
        
        return {
            "latest_ndvi": records[-1].ndvi_value,
            "latest_status": records[-1].health_status,
            "stress_detected": stress_detected,
            "records": history
        }

satellite_service = SatelliteService()
