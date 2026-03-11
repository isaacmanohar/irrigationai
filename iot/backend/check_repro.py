
import os
import sys
import logging

# Configure basic logging to see the satellite service output
logging.basicConfig(level=logging.INFO)

# Add the backend to path
sys.path.append(r'd:\iot\iot-day2\iot\iot\backend')

from dotenv import load_dotenv
load_dotenv(r'd:\iot\iot-day2\iot\iot\backend\.env')

print("--- TESTING REPRO ---")
print(f"Working Directory: {os.getcwd()}")
print(f"GEE_PRIVATE_KEY_PATH (env): {os.getenv('GEE_PRIVATE_KEY_PATH')}")
print(f"Does key exist? {os.path.exists(os.getenv('GEE_PRIVATE_KEY_PATH', ''))}")

from app.services.satellite import satellite_service
print(f"GEE Available (Final): {satellite_service.gee_available}")
