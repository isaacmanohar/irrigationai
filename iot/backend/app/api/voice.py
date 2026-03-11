from fastapi import APIRouter, Depends, HTTPException, Request, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.database import Field, Farmer, SensorData, SatelliteData
from ..services.twilio_service import twilio_service
from ..services.ai_service import ai_service
from ..services.weather import get_weather
import logging
import os
import re

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["Voice"])

# Use an environment variable for the base URL (ngrok)
BASE_URL = os.getenv("BASE_URL", "http://your-app.com")

@router.post("/trigger-request/{farmer_id}")
async def trigger_specific_call(farmer_id: int, request_type: str, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    field = db.query(Field).filter(Field.farmer_id == farmer.id).first()
    lang = farmer.preferred_language or "English"
    
    message = ""
    twiml_url = ""
    
    if request_type == "updates":
        # Irrigation Update
        moisture = field.sensor_data[-1].soil_moisture if field.sensor_data else 42
        temp = field.sensor_data[-1].temperature if field.sensor_data else 31
        
        ai_data = {
            'farmer_name': farmer.name,
            'crop': field.crop_type if field else "Crop",
            'soil_moisture': moisture,
            'temperature': temp,
            'prediction': "Medium"
        }
        message = await ai_service.generate_irrigation_advice(ai_data, lang)
        twiml_url = f"{BASE_URL}/api/v1/voice/advisory-twiml?msg={message}&lang={lang}"
        
    elif request_type == "pump_control":
        # Pump control needs a special TwiML
        twiml_url = f"{BASE_URL}/api/v1/voice/pump-menu"
        
    elif request_type == "crop_health":
        # Satellite Crop Health
        latest_sat = db.query(SatelliteData).filter(SatelliteData.field_id == field.id).order_by(SatelliteData.timestamp.desc()).first() if field else None
        ndvi = latest_sat.ndvi_value if latest_sat else 0.65
        status = latest_sat.health_status if latest_sat else "Healthy"
        
        prompts = {
            "English": f"Hello {farmer.name}, your crop health index is {ndvi}. The status is {status}.",
            "Hindi": f"नमस्ते {farmer.name}, आपकी फसल का स्वास्थ्य सूचकांक {ndvi} है। स्थिति {status} है।",
            "Telugu": f"నమస్కారం {farmer.name}, మీ పంట ఆరోగ్య సూచిక {ndvi}. స్థితి {status}."
        }
        message = prompts.get(lang, prompts["English"])
        twiml_url = f"{BASE_URL}/api/v1/voice/advisory-twiml?msg={message}&lang={lang}"
        
    elif request_type == "rain_status":
        # Rain status from weather
        weather = await get_weather(farmer.latitude, farmer.longitude) if farmer.latitude else None
        temp = weather.get('temperature', 32) if weather else 32
        
        prompts = {
            "English": f"The current temperature is {temp} degrees. The sky is partly cloudy with low chance of rain today.",
            "Hindi": f"वर्तमान तापमान {temp} डिग्री है। आज बारिश की संभावना कम है।",
            "Telugu": f"ప్రస్తుత ఉష్ణోగ్రత {temp} డిగ్రీలు. ఈరోజు వర్షం పడే అవకాశం తక్కువ."
        }
        message = prompts.get(lang, prompts["English"])
        twiml_url = f"{BASE_URL}/api/v1/voice/advisory-twiml?msg={message}&lang={lang}"

    try:
        call = twilio_service.client.calls.create(
            to=farmer.phone_number,
            from_=os.getenv("TWILIO_PHONE_NUMBER"),
            url=twiml_url
        )
        return {"status": "success", "call_sid": call.sid}
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.post("/pump-menu")
async def pump_menu(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    caller_phone = form_data.get("To") or form_data.get("From", "")
    
    clean_phone = caller_phone.replace('+', '').replace(' ', '')
    phone_suffix = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
    
    from twilio.twiml.voice_response import VoiceResponse, Gather
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    farmer = db.query(Farmer).filter(Farmer.phone_number.like(f"%{phone_suffix}%")).first()
    lang = farmer.preferred_language if farmer else "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    prompts = {
        "English": "Press 1 to turn ON the pump. Press 2 to turn OFF.",
        "Hindi": "पंप चालू करने के लिए 1 दबाएं। बंद करने के लिए 2 दबाएं।",
        "Telugu": "పంప్ ఆన్ చేయడానికి 1 నొక్కండి. ఆఫ్ చేయడానికి 2 నొక్కండి."
    }
    
    gather = Gather(num_digits=1, action=f"{BASE_URL}/api/v1/voice/handle-pump", method='POST')
    gather.say(prompts.get(lang, prompts["English"]), voice=lang_info["voice"], language=lang_info["lang"])
    response.append(gather)
    return Response(content=str(response), media_type="application/xml")

@router.post("/handle-pump")
async def handle_pump(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    digit = form_data.get("Digits", "")
    caller_phone = form_data.get("To") or form_data.get("From", "")
    
    from twilio.twiml.voice_response import VoiceResponse
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    clean_phone = caller_phone.replace('+', '').replace(' ', '')
    phone_suffix = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
    farmer = db.query(Farmer).filter(Farmer.phone_number.like(f"%{phone_suffix}%")).first()
    lang = farmer.preferred_language if farmer else "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    if digit == "1":
        msg = {"English": "Pump turned ON.", "Hindi": "पंप चालू हो गया।", "Telugu": "పంప్ ఆన్ చేయబడింది."}.get(lang, "Pump ON")
    elif digit == "2":
        msg = {"English": "Pump turned OFF.", "Hindi": "पंप बंद हो गया।", "Telugu": "పంప్ ఆఫ్ చేయబడింది."}.get(lang, "Pump OFF")
    else:
        msg = "Invalid input."

    response.say(msg, voice=lang_info["voice"], language=lang_info["lang"])
    response.hangup()
    return Response(content=str(response), media_type="application/xml")

@router.post("/onboarding/{farmer_id}")
async def trigger_onboarding_call(farmer_id: int, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    sid = twilio_service.make_onboarding_call(farmer.phone_number, BASE_URL)
    return {"status": "success", "call_sid": sid}

@router.post("/language-selection")
async def language_selection():
    return Response(content=twilio_service.get_language_selection_twiml(BASE_URL), media_type="application/xml")

@router.post("/save-language")
async def save_language(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    digit = form_data.get("Digits")
    farmer_phone = form_data.get("To") or form_data.get("From", "")
    
    clean_phone = farmer_phone.replace('+', '').replace(' ', '')
    phone_suffix = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
    
    lang_map = {"1": "English", "2": "Hindi", "3": "Telugu", "4": "Tamil", "5": "Kannada"}
    selected_lang = lang_map.get(digit, "English")
    
    farmer = db.query(Farmer).filter(Farmer.phone_number.like(f"%{phone_suffix}%")).first()
    if farmer:
        farmer.preferred_language = selected_lang
        db.commit()
    
    from twilio.twiml.voice_response import VoiceResponse
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    thanks_msg = {
        "English": "Thank you. Your language has been saved.",
        "Hindi": "धन्यवाद। आपकी भाषा सहेजी गई है।",
        "Telugu": "ధన్యవాదాలు. మీ భాష సేవ్ చేయబడింది.",
        "Tamil": "நன்றி. உங்கள் மொழி சேமிக்கப்பட்டது.",
        "Kannada": "ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ಭಾಷೆ ಉಳಿಸಲಾಗಿದೆ।"
    }
    
    v = LANGUAGE_MAP.get(selected_lang, LANGUAGE_MAP["English"])
    response.say(thanks_msg.get(selected_lang, thanks_msg["English"]), voice=v["voice"], language=v["lang"])
    response.redirect(f"{BASE_URL}/api/v1/voice/ask-location")
    return Response(content=str(response), media_type="application/xml")

# ========== DATA COLLECTION FLOW ==========

@router.post("/ask-location")
async def ask_location(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    farmer_phone = form_data.get("To") or form_data.get("From", "")
    
    clean_phone = farmer_phone.replace('+', '').replace(' ', '')
    phone_suffix = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
    
    from twilio.twiml.voice_response import VoiceResponse, Gather
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    farmer = db.query(Farmer).filter(Farmer.phone_number.like(f"%{phone_suffix}%")).first()
    lang = farmer.preferred_language if farmer else "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    prompts = {
        "English": "Now please tell us your village name after the beep.",
        "Hindi": "अब कृपया बीप के बाद अपने गाँव का नाम बताएं।",
        "Telugu": "దయచేసి బీప్ తర్వాత మీ గ్రామం పేరు చెప్పండి.",
        "Tamil": "பீப் ஒலிக்குப் பிறகு உங்கள் கிராமத்தின் பெயரைச் சொல்லுங்கள்.",
        "Kannada": "ದಯವಿಟ್ಟು బీప్ తర్వాత మీ హళ్ళియ హెసరన్ను హేళి."
    }
    
    speech_lang_map = {"English": "en-IN", "Hindi": "hi-IN", "Telugu": "te-IN", "Tamil": "ta-IN", "Kannada": "kn-IN"}
    
    gather = Gather(
        input="speech", 
        action=f"{BASE_URL}/api/v1/voice/save-location", 
        method="POST",
        language=speech_lang_map.get(lang, "en-IN"),
        speech_timeout="auto"
    )
    gather.say(prompts.get(lang, prompts["English"]), voice=lang_info["voice"], language=lang_info["lang"])
    response.append(gather)
    response.redirect(f"{BASE_URL}/api/v1/voice/ask-location")
    return Response(content=str(response), media_type="application/xml")

@router.post("/save-location")
async def save_location(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    speech_result = form_data.get("SpeechResult", "")
    farmer_phone = form_data.get("To") or form_data.get("From", "")
    
    clean_phone = farmer_phone.replace('+', '').replace(' ', '')
    phone_suffix = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
    
    from twilio.twiml.voice_response import VoiceResponse
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    farmer = db.query(Farmer).filter(Farmer.phone_number.like(f"%{phone_suffix}%")).first()
    if farmer and speech_result:
        farmer.village = speech_result.strip()
        from ..services.geocoding import get_coordinates
        lat, lon = await get_coordinates(speech_result.strip())
        if lat:
            farmer.latitude = lat
            farmer.longitude = lon
        db.commit()
    
    lang = farmer.preferred_language if farmer else "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    confirm = {
        "English": f"Your location has been saved as {speech_result}. Now select your crop type.",
        "Hindi": f"आपका स्थान {speech_result} के रूप में सहेजा गया है। अब अपनी फसल चुनें।",
        "Telugu": f"మీ స్థానం {speech_result} గా సేవ్ చేయబడింది. ఇప్పుడు మీ పంట ఎంచుకోండి.",
        "Tamil": f"உங்கள் இடம் {speech_result} ஆகச் சேமிக்கப்பட்டது. இப்போது உங்கள் பயிரைத் தேர்வு செய்யுங்கள்.",
        "Kannada": f"ನಿಮ್ಮ ಸ್ಥಳವನ್ನು {speech_result} ಎಂದು ಉಳಿಸಲಾಗಿದೆ. ಈಗ ನಿಮ್ಮ ಬೆಳೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ."
    }
    
    response.say(confirm.get(lang, confirm["English"]), voice=lang_info["voice"], language=lang_info["lang"])
    response.redirect(f"{BASE_URL}/api/v1/voice/ask-crop")
    return Response(content=str(response), media_type="application/xml")

@router.post("/ask-crop")
async def ask_crop(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    farmer_phone = form_data.get("To") or form_data.get("From", "")
    
    clean_phone = farmer_phone.replace('+', '').replace(' ', '')
    phone_suffix = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
    
    from twilio.twiml.voice_response import VoiceResponse, Gather
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    farmer = db.query(Farmer).filter(Farmer.phone_number.like(f"%{phone_suffix}%")).first()
    lang = farmer.preferred_language if farmer else "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    prompts = {
        "English": "Press 1 for Rice. Press 2 for Wheat. Press 3 for Maize. Press 4 for Cotton. Press 5 for Sugarcane.",
        "Hindi": "चावल के लिए 1 दबाएं। गेहूं के लिए 2 दबाएं। मक्का के लिए 3 दबाएं। कपास के लिए 4 दबाएं। गन्ना के लिए 5 दबाएं।",
        "Telugu": "వరి కోసం 1 నొక్కండి. గోధుమ కోసం 2 నొక్కండి. మొక్కజొన్న కోసం 3 నొక్కండి. పత్తి కోసం 4 నొక్కండి. చెరకు కోసం 5 నొక్కండి.",
        "Tamil": "நெல்லுக்கு 1 அழுத்தவும். கோதுமைக்கு 2 அழுத்தவும். மக்காச்சோளத்திற்கு 3 அழுத்தவும். பருத்திக்கு 4 அழுத்தவும். கரும்புக்கு 5 அழுத்தவும்.",
        "Kannada": "ಭತ್ತಕ್ಕಾಗಿ 1 ಒತ್ತಿರಿ. ಗೋಧಿಗಾಗಿ 2 ಒತ್ತಿರಿ. ಮೆಕ್ಕೆಜೋಳಕ್ಕಾಗಿ 3 ಒತ್ತಿರಿ. ಹತ್ತಿಗಾಗಿ 4 ಒತ್ತಿರಿ. ಕಬ್ಬಿಗಾಗಿ 5 ಒತ್ತಿರಿ."
    }
    
    gather = Gather(num_digits=1, action=f"{BASE_URL}/api/v1/voice/save-crop", method="POST")
    gather.say(prompts.get(lang, prompts["English"]), voice=lang_info["voice"], language=lang_info["lang"])
    response.append(gather)
    response.redirect(f"{BASE_URL}/api/v1/voice/ask-crop")
    return Response(content=str(response), media_type="application/xml")

@router.post("/save-crop")
async def save_crop(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    digit = form_data.get("Digits", "")
    farmer_phone = form_data.get("To") or form_data.get("From", "")
    
    clean_phone = farmer_phone.replace('+', '').replace(' ', '')
    phone_suffix = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
    
    from twilio.twiml.voice_response import VoiceResponse
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    crop_map = {"1": "Rice", "2": "Wheat", "3": "Maize", "4": "Cotton", "5": "Sugarcane"}
    selected_crop = crop_map.get(digit, "Rice")
    
    farmer = db.query(Farmer).filter(Farmer.phone_number.like(f"%{phone_suffix}%")).first()
    if farmer:
        field = db.query(Field).filter(Field.farmer_id == farmer.id).first()
        if field:
            field.crop_type = selected_crop
            db.commit()
    
    lang = farmer.preferred_language if farmer else "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    crop_names = {
        "English": selected_crop,
        "Hindi": {"Rice": "चावल", "Wheat": "गेहूं", "Maize": "मक्का", "Cotton": "कपास", "Sugarcane": "गन्ना"}.get(selected_crop, selected_crop),
        "Telugu": {"Rice": "వరి", "Wheat": "గోధుమ", "Maize": "మొక్కజొన్న", "Cotton": "పత్తి", "Sugarcane": "చెరకు"}.get(selected_crop, selected_crop),
        "Tamil": {"Rice": "நெல்", "Wheat": "கோதுமை", "Maize": "மக்காச்சோளம்", "Cotton": "பருத்தி", "Sugarcane": "கரும்பு"}.get(selected_crop, selected_crop),
        "Kannada": {"Rice": "ಭತ್ತ", "Wheat": "ಗೋಧಿ", "Maize": "ಮೆಕ್ಕೆಜೋಳ", "Cotton": "ಹತ್ತಿ", "Sugarcane": "ಕಬ್ಬು"}.get(selected_crop, selected_crop)
    }
    
    confirm = {
        "English": f"Crop saved as {crop_names['English']}. Now tell us your field area.",
        "Hindi": f"फसल {crop_names['Hindi']} के रूप में सहेजी गई। अब अपने खेत का क्षेत्रफल बताएं।",
        "Telugu": f"పంట {crop_names['Telugu']} గా సేవ్ చేయబడింది. ఇప్పుడు మీ పొలం విస్తీర్ణం చెప్పండి.",
        "Tamil": f"பயிர் {crop_names['Tamil']} ஆகச் சேமிக்கப்பட்டது. இப்போது உங்கள் வயல் பரப்பளவைச் சொல்லுங்கள்.",
        "Kannada": f"ಬೆಳೆ {crop_names['Kannada']} ಎಂದು ಉಳಿಸಲಾಗಿದೆ. ಈಗ ನಿಮ್ಮ ಹೊಲದ ವಿಸ್ತೀರ್ಣವನ್ನು ಹೇಳಿ."
    }
    
    response.say(confirm.get(lang, confirm["English"]), voice=lang_info["voice"], language=lang_info["lang"])
    response.redirect(f"{BASE_URL}/api/v1/voice/ask-field-area")
    return Response(content=str(response), media_type="application/xml")

@router.post("/ask-field-area")
async def ask_field_area(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    farmer_phone = form_data.get("To") or form_data.get("From", "")
    
    clean_phone = farmer_phone.replace('+', '').replace(' ', '')
    phone_suffix = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
    
    from twilio.twiml.voice_response import VoiceResponse, Gather
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    farmer = db.query(Farmer).filter(Farmer.phone_number.like(f"%{phone_suffix}%")).first()
    lang = farmer.preferred_language if farmer else "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    prompts = {
        "English": "Please tell us your field area after the beep. You can say it in acres, bigha, or hectares.",
        "Hindi": "कृपया बीप के बाद अपने खेत का क्षेत्रफल बताएं। आप इसे एकड़, बीघा या हेक्टेयर में बता सकते हैं।",
        "Telugu": "దయచేసి బీప్ తర్వాత మీ పొలం విస్తీర్ణం చెప్పండి. మీరు దీన్ని ఎకరాలు, బిఘా లేదా హెక్టార్లలో చెప్పవచ్చు.",
        "Tamil": "பீப் ஒலிக்குப் பிறகு உங்கள் வயல் பரப்பளவைச் சொல்லுங்கள். நீங்கள் அதை ஏக்கர், பீகா அல்லது ஹெக்டேரில் சொல்லலாம்.",
        "Kannada": "ದಯವಿಟ್ಟು బీప్ తర్వాత మీ హోలద విస్తీర్ణవన్ను హేళి."
    }
    
    speech_lang_map = {"English": "en-IN", "Hindi": "hi-IN", "Telugu": "te-IN", "Tamil": "ta-IN", "Kannada": "kn-IN"}
    
    gather = Gather(
        input="speech", 
        action=f"{BASE_URL}/api/v1/voice/save-field-area", 
        method="POST",
        language=speech_lang_map.get(lang, "en-IN"),
        speech_timeout="auto"
    )
    gather.say(prompts.get(lang, prompts["English"]), voice=lang_info["voice"], language=lang_info["lang"])
    response.append(gather)
    response.redirect(f"{BASE_URL}/api/v1/voice/ask-field-area")
    return Response(content=str(response), media_type="application/xml")

@router.post("/save-field-area")
async def save_field_area(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    speech_result = form_data.get("SpeechResult", "").lower()
    farmer_phone = form_data.get("To") or form_data.get("From", "")
    
    clean_phone = farmer_phone.replace('+', '').replace(' ', '')
    phone_suffix = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
    
    from twilio.twiml.voice_response import VoiceResponse
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    farmer = db.query(Farmer).filter(Farmer.phone_number.like(f"%{phone_suffix}%")).first()
    
    numbers = re.findall(r'\d+\.?\d*', speech_result)
    area_value = float(numbers[0]) if numbers else 1.0
    
    if 'acre' in speech_result or 'एकड़' in speech_result or 'ఎకరా' in speech_result:
        area_hectares = area_value * 0.404686
    elif 'bigha' in speech_result or 'बीघा' in speech_result:
        area_hectares = area_value * 0.25
    else:
        area_hectares = area_value
    
    if farmer:
        field = db.query(Field).filter(Field.farmer_id == farmer.id).first()
        if field:
            field.field_area = round(area_hectares, 2)
            db.commit()
    
    lang = farmer.preferred_language if farmer else "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    response.say(f"Area saved. Now select growth stage.", voice=lang_info["voice"], language=lang_info["lang"])
    response.redirect(f"{BASE_URL}/api/v1/voice/ask-stage")
    return Response(content=str(response), media_type="application/xml")

@router.post("/ask-stage")
async def ask_stage(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    farmer_phone = form_data.get("To") or form_data.get("From", "")
    
    clean_phone = farmer_phone.replace('+', '').replace(' ', '')
    phone_suffix = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
    
    from twilio.twiml.voice_response import VoiceResponse, Gather
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    farmer = db.query(Farmer).filter(Farmer.phone_number.like(f"%{phone_suffix}%")).first()
    lang = farmer.preferred_language if farmer else "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    prompts = {
        "English": "Press 1 for Initial stage. Press 2 for Growing stage. Press 3 for Flowering stage. Press 4 for Harvesting stage.",
        "Hindi": "बुवाई के लिए 1। बढ़ने के लिए 2। फूलने के लिए 3। कटाई के लिए 4।",
        "Telugu": "విత్తనం కోసం 1. పెరుగుదల కోసం 2. పూత కోసం 3. కోత కోసం 4."
    }
    
    gather = Gather(num_digits=1, action=f"{BASE_URL}/api/v1/voice/save-stage", method="POST")
    gather.say(prompts.get(lang, prompts["English"]), voice=lang_info["voice"], language=lang_info["lang"])
    response.append(gather)
    response.redirect(f"{BASE_URL}/api/v1/voice/ask-stage")
    return Response(content=str(response), media_type="application/xml")

@router.post("/save-stage")
async def save_stage(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    digit = form_data.get("Digits", "")
    farmer_phone = form_data.get("To") or form_data.get("From", "")
    
    clean_phone = farmer_phone.replace('+', '').replace(' ', '')
    phone_suffix = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
    
    from twilio.twiml.voice_response import VoiceResponse
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    stage_map = {"1": "Initial", "2": "Vegetative", "3": "Flowering", "4": "Harvesting"}
    selected_stage = stage_map.get(digit, "Initial")
    
    farmer = db.query(Farmer).filter(Farmer.phone_number.like(f"%{phone_suffix}%")).first()
    if farmer:
        field = db.query(Field).filter(Field.farmer_id == farmer.id).first()
        if field:
            field.growth_stage = selected_stage
            db.commit()
    
    lang = farmer.preferred_language if farmer else "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    response.say("Profile complete. Thank you! Goodbye.", voice=lang_info["voice"], language=lang_info["lang"])
    return Response(content=str(response), media_type="application/xml")

@router.get("/advisory-twiml")
async def get_advisory_twiml(msg: str, lang: str):
    return Response(content=twilio_service.get_advisory_twiml(msg, lang), media_type="application/xml")

@router.post("/incoming")
async def handle_incoming_call(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    caller_phone = form_data.get("From", "")
    
    from twilio.twiml.voice_response import VoiceResponse, Gather
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    farmer = db.query(Farmer).filter(Farmer.phone_number == caller_phone).first()
    if not farmer:
        response.say("Number not registered.", voice="Polly.Raveena", language="en-IN")
        return Response(content=str(response), media_type="application/xml")
    
    lang = farmer.preferred_language or "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    greetings = {
        "English": f"Hello {farmer.name}. Press 1 for status. Press 2 for advice. Press 3 to change language.",
        "Hindi": f"नमस्ते {farmer.name}। स्थिति के लिए 1। सलाह के लिए 2। भाषा के लिए 3।",
        "Telugu": f"నమస్కారం {farmer.name}. స్థితి కోసం 1. సలహా కోసం 2. భాష కోసం 3."
    }
    
    gather = Gather(num_digits=1, action=f"{BASE_URL}/api/v1/voice/handle-menu", method='POST')
    gather.say(greetings.get(lang, greetings["English"]), voice=lang_info["voice"], language=lang_info["lang"])
    response.append(gather)
    response.redirect(f"{BASE_URL}/api/v1/voice/incoming")
    return Response(content=str(response), media_type="application/xml")

@router.post("/handle-menu")
async def handle_menu_input(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    digit = form_data.get("Digits", "")
    caller_phone = form_data.get("From", "")
    
    from twilio.twiml.voice_response import VoiceResponse
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    farmer = db.query(Farmer).filter(Farmer.phone_number == caller_phone).first()
    if not farmer:
        return Response(content=str(response), media_type="application/xml")
    
    lang = farmer.preferred_language or "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    field = db.query(Field).filter(Field.farmer_id == farmer.id).first()
    
    if digit == "1":
        msg = "Your field is healthy." # Placeholder
        response.say(msg, voice=lang_info["voice"], language=lang_info["lang"])
    elif digit == "2":
        msg = "Irrigate for 2 hours today." # Placeholder
        response.say(msg, voice=lang_info["voice"], language=lang_info["lang"])
    elif digit == "3":
        response.redirect(f"{BASE_URL}/api/v1/voice/language-selection")
    
    response.redirect(f"{BASE_URL}/api/v1/voice/incoming")
    return Response(content=str(response), media_type="application/xml")
