
import os
import sys

# Add the backend to path
sys.path.append(r'd:\iot\iot-day2\iot\iot\backend')

from dotenv import load_dotenv
load_dotenv(r'd:\iot\iot-day2\iot\iot\backend\.env')

from app.services.satellite import satellite_service

print(f"GEE Available: {satellite_service.gee_available}")
if not satellite_service.gee_available:
    print("The NDVI score is currently being SIMULATED.")
else:
    print("The NDVI score is coming from GOOGLE EARTH ENGINE.")
