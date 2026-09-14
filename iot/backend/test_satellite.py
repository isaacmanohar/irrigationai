print("Start of script")
import asyncio
import os
from dotenv import load_dotenv
load_dotenv()
print("Env loaded")

import sys
sys.path.append(os.getcwd())
print("Path appended")

try:
    from app.services.satellite import satellite_service
    print("Service imported")
except Exception as e:
    print(f"Import error: {e}")
    sys.exit(1)

async def test():
    print("Testing Satellite Service...")
    lat, lon = 17.3850, 78.4867
    
    print(f"Fetching NDVI for {lat}, {lon}...")
    try:
        ndvi = await satellite_service.get_ndvi(lat, lon)
        print(f"NDVI Result: {ndvi}")
    except Exception as e:
        print(f"NDVI Error: {e}")

    print(f"\nFetching images for {lat}, {lon}...")
    try:
        images = await satellite_service.get_satellite_image(lat, lon)
        print(f"Images Result: {images}")
    except Exception as e:
        print(f"Images Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
