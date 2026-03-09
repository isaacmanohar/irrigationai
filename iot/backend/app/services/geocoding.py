from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import logging

logger = logging.getLogger(__name__)

async def get_coordinates(village_name: str):
    geolocator = Nominatim(user_agent="ai_precision_irrigation_assistant")
    try:
        location = geolocator.geocode(village_name)
        if location:
            return location.latitude, location.longitude
        return None, None
    except GeocoderTimedOut:
        logger.error(f"Geocoding timed out for village: {village_name}")
        return None, None
    except Exception as e:
        logger.error(f"Error geocoding village: {village_name} - {str(e)}")
        return None, None
