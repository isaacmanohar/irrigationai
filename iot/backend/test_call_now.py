import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID").strip()
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN").strip()
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER").strip()

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

target_number = "+918639975947"
# We need a TwiML URL. I'll use a public Twilio demo TwiML or a simple Say.
# Since I don't have a public URL for the local server yet, 
# I'll use a standard Twilio 'Say' TwiML.

twiml_content = '<Response><Say voice="alice">Hello from your A.I. Precision Irrigation Assistant. This is a test call for your smart irrigation system. Have a great day! With ya sweet romance When you do me like that Its hard to take Yeah, yeah </Say></Response>'

try:
    print(f"Initiating call from {TWILIO_PHONE_NUMBER} to {target_number}...")
    call = client.calls.create(
        to=target_number,
        from_=TWILIO_PHONE_NUMBER,
        twiml=twiml_content
    )
    print(f"Call successfully initiated! SID: {call.sid}")
except Exception as e:
    print(f"Error: {str(e)}")
