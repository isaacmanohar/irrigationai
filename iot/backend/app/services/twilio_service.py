from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Twilio credentials should be in .env
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

# Language mapping for Twilio <Say> with Google voices
LANGUAGE_MAP = {
    "English": {"lang": "en-IN", "voice": "Google.en-IN-Standard-A"},
    "Hindi": {"lang": "hi-IN", "voice": "Google.hi-IN-Standard-A"},
    "Telugu": {"lang": "te-IN", "voice": "Google.te-IN-Standard-A"},
    "Tamil": {"lang": "ta-IN", "voice": "Google.ta-IN-Standard-A"},
    "Kannada": {"lang": "kn-IN", "voice": "Google.kn-IN-Standard-A"}
}

class TwilioVoiceService:
    def __init__(self):
        if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
            self.client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        else:
            self.client = None
            logger.warning("Twilio credentials not found. Voice calls will be simulated.")

    def make_onboarding_call(self, to_phone: str, base_url: str):
        if not self.client:
            logger.info(f"SIMULATED ONBOARDING CALL to {to_phone}")
            return "simulated_onboarding_sid"
        
        twiml_url = f"{base_url}/api/v1/voice/language-selection"
        
        try:
            call = self.client.calls.create(
                to=to_phone,
                from_=TWILIO_PHONE_NUMBER,
                url=twiml_url
            )
            return call.sid
        except Exception as e:
            logger.error(f"Error making Twilio onboarding call: {str(e)}")
            return None

    def get_language_selection_twiml(self, base_url: str):
        response = VoiceResponse()
        gather = Gather(num_digits=1, action=f"{base_url}/api/v1/voice/save-language", method='POST', timeout=10)
        
        # Keep it SHORT to fit within trial time limit
        gather.say("English press 1.", voice="Google.en-IN-Standard-A", language="en-IN")
        gather.say("हिंदी के लिए 2 दबाएं।", voice="Google.hi-IN-Standard-A", language="hi-IN")
        gather.say("తెలుగు కోసం 3 నొక్కండి.", voice="Google.te-IN-Standard-A", language="te-IN")
        gather.say("தமிழுக்கு 4 அழுத்தவும்.", voice="Google.ta-IN-Standard-A", language="ta-IN")
        gather.say("ಕನ್ನಡಕ್ಕಾಗಿ 5 ಒತ್ತಿರಿ.", voice="Google.kn-IN-Standard-A", language="kn-IN")
        
        response.append(gather)
        response.redirect(f"{base_url}/api/v1/voice/language-selection")
        return str(response)

    def get_advisory_twiml(self, message: str, language: str):
        response = VoiceResponse()
        lang_info = LANGUAGE_MAP.get(language, LANGUAGE_MAP["English"])
        response.say(message, voice=lang_info["voice"], language=lang_info["lang"])
        return str(response)

    def get_irrigation_alert_twiml(self, language: str):
        response = VoiceResponse()
        lang_info = LANGUAGE_MAP.get(language, LANGUAGE_MAP["English"])
        
        gather = Gather(num_digits=1, action='/api/v1/voice/handle-alert-input', method='POST')
        
        alert_texts = {
            "English": "Soil moisture is still low. Press 1 to continue irrigation. Press 2 to stop irrigation.",
            "Hindi": "मिट्टी की नमी अभी भी कम है। सिंचाई जारी रखने के लिए 1 दबाएं। रोकने के लिए 2 दबाएं।",
            "Telugu": "నేల తేమ ఇంకా తక్కువగా ఉంది. సాగును కొనసాగించడానికి 1 నొక్కండి. నిలిపివేయడానికి 2 నొక్కండి.",
            "Tamil": "மண் ஈரப்பதம் இன்னும் குறைவாக உள்ளது. நீர்ப்பாசனத்தைத் தொடர 1 ஐ அழுத்தவும். நிறுத்த 2 ஐ அழுத்தவும்.",
            "Kannada": "ಮಣ್ಣಿನ ತೇವಾಂಶ ಇನ್ನೂ ಕಡಿಮೆಯಿದೆ. ನೀರಾವರಿ ಮುಂದುವರಿಸಲು 1 ಒತ್ತಿರಿ. ನಿಲ್ಲಿಸಲು 2 ಒತ್ತಿರಿ."
        }
        
        text = alert_texts.get(language, alert_texts["English"])
        gather.say(text, voice=lang_info["voice"], language=lang_info["lang"])
        response.append(gather)
        return str(response)

twilio_service = TwilioVoiceService()
