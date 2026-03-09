"""Configure Twilio phone number webhook for incoming calls"""
import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID").strip()
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN").strip()
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER").strip()
BASE_URL = os.getenv("BASE_URL").strip()

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# Find the phone number SID
numbers = client.incoming_phone_numbers.list(phone_number=TWILIO_PHONE_NUMBER)

if numbers:
    number = numbers[0]
    webhook_url = f"{BASE_URL}/api/v1/voice/incoming"
    
    # Update the webhook
    number.update(
        voice_url=webhook_url,
        voice_method="POST"
    )
    print(f"✅ Twilio number {TWILIO_PHONE_NUMBER} configured!")
    print(f"   Voice Webhook: {webhook_url}")
    print(f"\n📞 Farmers can now CALL {TWILIO_PHONE_NUMBER} to talk to the AI assistant!")
else:
    print(f"❌ Phone number {TWILIO_PHONE_NUMBER} not found in your Twilio account")
