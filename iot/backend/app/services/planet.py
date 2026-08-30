import os
import httpx
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class PlanetService:
    """Service to interact with Planet Labs API (Student & Research Plan)"""
    
    def __init__(self):
        self.api_key = os.getenv("PLANET_API_KEY")
        self.base_url = "https://api.planet.com/data/v1"
        self.auth = (self.api_key, "") if self.api_key else None
        
    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def get_latest_imagery(self, lat: float, lon: float, days_back: int = 30) -> Optional[Dict[str, Any]]:
        """
        Find the latest PlanetScope (3m) imagery for a location.
        Returns metadata and thumbnail URLs.
        """
        if not self.is_configured():
            logger.warning("Planet API Key not found. Please add PLANET_API_KEY to .env")
            return None

        # 1. Define Search Filter
        # Search for PSScene with analytic_sr (Surface Reflectance)
        search_request = {
            "item_types": ["PSScene"],
            "filter": {
                "type": "AndFilter",
                "config": [
                    {
                        "type": "GeometryFilter",
                        "field_name": "geometry",
                        "config": {
                            "type": "Point",
                            "coordinates": [lon, lat]
                        }
                    },
                    {
                        "type": "DateRangeFilter",
                        "field_name": "acquired",
                        "config": {
                            "gt": (datetime.now() - timedelta(days=days_back)).isoformat() + "Z"
                        }
                    },
                    {
                        "type": "RangeFilter",
                        "field_name": "cloud_cover",
                        "config": {
                            "lte": 0.5 # Max 50% clouds for testing
                        }
                    }
                ]
            }
        }

        print(f"DEBUG: Planet Search for {lat}, {lon} (days_back={days_back})")
        async with httpx.AsyncClient() as client:
            try:
                # 2. Execute Search
                response = await client.post(
                    f"{self.base_url}/quick-search",
                    json=search_request,
                    auth=self.auth,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"DEBUG: Planet API Error {response.status_code}: {response.text}")
                    logger.error(f"Planet API Error {response.status_code}: {response.text}")
                    return None
                
                data = response.json()
                features = data.get("features", [])
                print(f"DEBUG: Planet Features found: {len(features)}")
                
                if not features:
                    logger.info("No Planet imagery found for this location and time range.")
                    return None
                
                # Use the most recent image
                latest = features[0]
                properties = latest.get("properties", {})
                item_id = latest.get("id")
                
                # 3. Get Thumbnail URL
                # Planet provides a direct thumbnail endpoint
                thumbnail_url = f"https://api.planet.com/data/v1/item-types/PSScene/items/{item_id}/thumb?api_key={self.api_key}"
                
                print(f"DEBUG: Latest Planet Image: {item_id} from {properties.get('acquired')}")
                return {
                    "item_id": item_id,
                    "acquired": properties.get("acquired"),
                    "cloud_cover": properties.get("cloud_cover"),
                    "pixel_res": properties.get("pixel_res"),
                    "thumbnail_url": thumbnail_url,
                    "provider": "Planet (3m resolution)",
                    "instrument": properties.get("instrument"),
                    "ndvi_estimated": self._estimate_ndvi_from_metadata(properties)
                }
                
            except Exception as e:
                logger.error(f"Exception calling Planet API: {str(e)}")
                return None

    def _estimate_ndvi_from_metadata(self, properties: Dict) -> float:
        """
        Heuristic: In many cases, we can't calculate NDVI from metadata alone,
        but we can return a default or use available quality scores.
        Real NDVI would require downloading analytic assets.
        """
        # This is a placeholder for real spectral analysis
        return 0.65 # Placeholder for "Healthy" on high-res maps

    def get_tile_url_template(self) -> str:
        """Returns the XYZ tile template for Planet Mosaics if available"""
        # Example for the global monthly basemap which is often in S&R
        return f"https://tiles.planet.com/basemaps/v1/planet-tiles/global_monthly_latest/g/{{z}}/{{x}}/{{y}}.png?api_key={self.api_key}"

planet_service = PlanetService()
