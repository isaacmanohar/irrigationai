import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

from app.services.satellite import satellite_service

async def test():
    # Coords for suresh
    lat, lon = 17.515397, 78.3817156
    print(f"Testing satellite for {lat}, {lon}...")
    result = await satellite_service.get_satellite_image(lat, lon, days_back=180)
    print("\nRESULT:")
    import json
    # Filter out long URLs for readability if needed, but let's see them
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    asyncio.run(test())
