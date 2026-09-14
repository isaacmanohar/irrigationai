import asyncio
import os
import json
from dotenv import load_dotenv
load_dotenv()

from app.services.satellite import satellite_service

async def test():
    lat, lon = 17.515397, 78.3817156
    try:
        # Suppress prints for this test
        import sys
        original_stdout = sys.stdout
        sys.stdout = open(os.devnull, 'w')
        
        result = await satellite_service.get_satellite_image(lat, lon, days_back=180)
        
        sys.stdout = original_stdout
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
