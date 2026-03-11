
import os
import sys
import asyncio
from dotenv import load_dotenv

# Add the backend to path
sys.path.append(r'd:\iot\iot-day2\iot\iot\backend')
load_dotenv(r'd:\iot\iot-day2\iot\iot\backend\.env')

from app.services.satellite import satellite_service

async def fetch_live_ndvi():
    lat, lon = 17.6339929, 78.4843146
    print(f"Fetching live NDVI for {lat}, {lon}...")
    
    if not satellite_service.gee_available:
        print("ERROR: GEE not available in satellite_service")
        return

    # Call the actual private _sync_get_ndvi to bypass any simulation
    try:
        data = satellite_service._sync_get_ndvi(lat, lon, days_back=60)
        print("--- LIVE RESULTS ---")
        print(f"Source: {data.get('source')}")
        print(f"NDVI: {data.get('ndvi_value')}")
        print(f"Status: {data.get('health_status')}")
        print(f"Date: {data.get('image_date')}")
    except Exception as e:
        print(f"Failed to fetch live data: {e}")

if __name__ == "__main__":
    asyncio.run(fetch_live_ndvi())
