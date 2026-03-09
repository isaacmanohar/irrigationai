import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID").strip()
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN").strip()

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

try:
    # Get the last 3 calls to see their status and potential errors
    calls = client.calls.list(limit=3)
    print("--- RECENT CALL LOGS ---")
    for call in calls:
        print(f"SID: {call.sid}")
        print(f"To: {call.to}")
        print(f"Status: {call.status}")
        print(f"Duration: {call.duration} seconds")
        print(f"Price: {call.price} {call.price_unit}")
        print("-" * 20)
except Exception as e:
    print(f"Error fetching logs: {str(e)}")
