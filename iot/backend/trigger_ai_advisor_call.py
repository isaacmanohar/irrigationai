import os
import asyncio
from twilio.rest import Client
from groq import Groq
from dotenv import load_dotenv

# Load env vars
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

# Farmer/Field Data
FARMER_NAME = "Raju"
PHONE_NUMBER = "+918639975947"
CROP = "Wheat"
SOIL_MOISTURE = 35
TEMPERATURE = 28
LANGUAGE = "English"

async def generate_advice():
    client = Groq(api_key=GROQ_API_KEY)
    prompt = f"""
    You are an AI Irrigation Assistant. 
    Farmer Name: {FARMER_NAME}
    Crop: {CROP}
    Soil Moisture: {SOIL_MOISTURE}%
    Temperature: {TEMPERATURE}°C
    AI Prediction: Low soil moisture alert.
    
    Generate a friendly, concise advice message (max 2 sentences) for the farmer.
    Keep it VERY short (under 130 characters) to ensure it fits Twilio's trial limits.
    Respond only with the advice message.
    """
    
    try:
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=200,
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating advice: {e}")
        return f"Hello {FARMER_NAME}. Soil moisture is low ({SOIL_MOISTURE}%). Please consider irrigating your wheat field soon."

def trigger_call(message):
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    # Twilio mapping for voices
    voice_map = {
        "English": {"voice": "Google.en-IN-Standard-A", "lang": "en-IN"},
    }
    v = voice_map.get(LANGUAGE, voice_map["English"])
    
    twiml_content = f'<Response><Say voice="{v["voice"]}" language="{v["lang"]}">{message}</Say></Response>'
    
    try:
        print(f"Initiating AI ADVISOR call from {TWILIO_PHONE_NUMBER} to {PHONE_NUMBER}...")
        print(f"Message: {message}")
        call = client.calls.create(
            to=PHONE_NUMBER,
            from_=TWILIO_PHONE_NUMBER,
            twiml=twiml_content
        )
        print(f"Call successfully initiated! SID: {call.sid}")
    except Exception as e:
        print(f"Error: {str(e)}")

async def main():
    message = await generate_advice()
    trigger_call(message)

if __name__ == "__main__":
    asyncio.run(main())
