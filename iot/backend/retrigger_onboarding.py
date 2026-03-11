
import os
import sys
import logging

# Add the backend to path
sys.path.append(r'd:\iot\iot-day2\iot\iot\backend')

from dotenv import load_dotenv
load_dotenv(r'd:\iot\iot-day2\iot\iot\backend\.env')

from app.services.twilio_service import twilio_service

# Farmer details
TO_PHONE = "+919502042442"
BASE_URL = os.getenv("BASE_URL")

print(f"Triggering onboarding call...")
print(f"To: {TO_PHONE}")
print(f"Base URL: {BASE_URL}")

sid = twilio_service.make_onboarding_call(TO_PHONE, BASE_URL)
if sid:
    print(f"✓ Success! Call SID: {sid}")
else:
    print("✗ Failed to initiate call.")
