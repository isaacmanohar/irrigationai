from fastapi import APIRouter, Depends, HTTPException, Request, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.database import Field, Farmer
from ..services.twilio_service import twilio_service
from ..services.ai_service import ai_service
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["Voice"])

# Use an environment variable for the base URL (ngrok)
BASE_URL = os.getenv("BASE_URL", "http://your-app.com")

@router.post("/call-advisory/{field_id}")
async def trigger_manual_advisory_call(field_id: int, db: Session = Depends(get_db)):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field or not field.owner:
        raise HTTPException(status_code=404, detail="Field or Farmer not found")
    
    farmer = field.owner
    
    # NEW: Groq AI Generation
    ai_data = {
        'farmer_name': farmer.name,
        'crop': field.crop_type,
        'soil_moisture': field.sensor_data[-1].soil_moisture if field.sensor_data else 42,
        'temperature': field.sensor_data[-1].temperature if field.sensor_data else 31,
        'prediction': "Medium" # Logic can pull from actual model
    }
    
    translated_message = await ai_service.generate_irrigation_advice(ai_data, farmer.preferred_language)
    
    twiml_url = f"{BASE_URL}/api/v1/voice/advisory-twiml?msg={translated_message}&lang={farmer.preferred_language}"
    
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
    phone = form_data.get("To") # Twilio sends the 'From' of the call as 'To' in some contexts or we use 'From'
    # Actually 'From' is the caller (Twilio #), 'To' is the farmer
    farmer_phone = form_data.get("To")
    
    lang_map = {
        "1": "English",
        "2": "Hindi",
        "3": "Telugu",
        "4": "Tamil",
        "5": "Kannada"
    }
    
    selected_lang = lang_map.get(digit, "English")
    
    farmer = db.query(Farmer).filter(Farmer.phone_number == farmer_phone).first()
    if farmer:
        farmer.preferred_language = selected_lang
        db.commit()
    
    from twilio.twiml.voice_response import VoiceResponse
    response = VoiceResponse()
    
    thanks_msg = {
        "English": "Thank you. Your language has been saved.",
        "Hindi": "धन्यवाद। आपकी भाषा सहेजी गई है।",
        "Telugu": "ధన్యవాదాలు. మీ భాష సేవ్ చేయబడింది.",
        "Tamil": "நன்றி. உங்கள் மொழி சேமிக்கப்பட்டது.",
        "Kannada": "ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ಭಾಷೆ ಉಳಿಸಲಾಗಿದೆ."
    }
    
    voice_map = {
        "English": {"voice": "Google.en-IN-Standard-A", "lang": "en-IN"},
        "Hindi": {"voice": "Google.hi-IN-Standard-A", "lang": "hi-IN"},
        "Telugu": {"voice": "Google.te-IN-Standard-A", "lang": "te-IN"},
        "Tamil": {"voice": "Google.ta-IN-Standard-A", "lang": "ta-IN"},
        "Kannada": {"voice": "Google.kn-IN-Standard-A", "lang": "kn-IN"}
    }
    
    v = voice_map.get(selected_lang, voice_map["English"])
    response.say(thanks_msg.get(selected_lang), voice=v["voice"], language=v["lang"])
    # Continue to ask for location
    response.redirect(f"{BASE_URL}/api/v1/voice/ask-location")
    return Response(content=str(response), media_type="application/xml")

# ========== DATA COLLECTION FLOW ==========

@router.post("/ask-location")
async def ask_location(request: Request, db: Session = Depends(get_db)):
    """Ask farmer for their village/location via speech"""
    form_data = await request.form()
    farmer_phone = form_data.get("To", "")
    
    from twilio.twiml.voice_response import VoiceResponse, Gather
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    farmer = db.query(Farmer).filter(Farmer.phone_number == farmer_phone).first()
    lang = farmer.preferred_language if farmer else "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    prompts = {
        "English": "Now please tell us your village name after the beep.",
        "Hindi": "अब कृपया बीप के बाद अपने गाँव का नाम बताएं।",
        "Telugu": "దయచేసి బీప్ తర్వాత మీ గ్రామం పేరు చెప్పండి.",
        "Tamil": "பீப் ஒலிக்குப் பிறகு உங்கள் கிராமத்தின் பெயரைச் சொல்லுங்கள்.",
        "Kannada": "ದಯವಿಟ್ಟು ಬೀಪ್ ನಂತರ ನಿಮ್ಮ ಹಳ್ಳಿಯ ಹೆಸರನ್ನು ಹೇಳಿ."
    }
    
    speech_lang_map = {"English": "en-IN", "Hindi": "hi-IN", "Telugu": "te-IN", "Tamil": "ta-IN", "Kannada": "kn-IN"}
    
    gather = Gather(
        input="speech", 
        action=f"{BASE_URL}/api/v1/voice/save-location", 
        method="POST",
        language=speech_lang_map.get(lang, "en-IN"),
        speech_timeout="auto"
    )
    gather.say(prompts.get(lang), voice=lang_info["voice"], language=lang_info["lang"])
    response.append(gather)
    response.redirect(f"{BASE_URL}/api/v1/voice/ask-location")
    return Response(content=str(response), media_type="application/xml")

@router.post("/save-location")
async def save_location(request: Request, db: Session = Depends(get_db)):
    """Save farmer's spoken village name"""
    form_data = await request.form()
    speech_result = form_data.get("SpeechResult", "")
    farmer_phone = form_data.get("To", "")
    
    from twilio.twiml.voice_response import VoiceResponse
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    farmer = db.query(Farmer).filter(Farmer.phone_number == farmer_phone).first()
    if farmer and speech_result:
        farmer.village = speech_result.strip()
        # Try to geocode
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
    
    response.say(confirm.get(lang), voice=lang_info["voice"], language=lang_info["lang"])
    response.redirect(f"{BASE_URL}/api/v1/voice/ask-crop")
    return Response(content=str(response), media_type="application/xml")

@router.post("/ask-crop")
async def ask_crop(request: Request, db: Session = Depends(get_db)):
    """Ask farmer to select crop type via keypad"""
    form_data = await request.form()
    farmer_phone = form_data.get("To", "")
    
    from twilio.twiml.voice_response import VoiceResponse, Gather
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    farmer = db.query(Farmer).filter(Farmer.phone_number == farmer_phone).first()
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
    gather.say(prompts.get(lang), voice=lang_info["voice"], language=lang_info["lang"])
    response.append(gather)
    response.redirect(f"{BASE_URL}/api/v1/voice/ask-crop")
    return Response(content=str(response), media_type="application/xml")

@router.post("/save-crop")
async def save_crop(request: Request, db: Session = Depends(get_db)):
    """Save farmer's crop selection"""
    form_data = await request.form()
    digit = form_data.get("Digits", "")
    farmer_phone = form_data.get("To", "")
    
    from twilio.twiml.voice_response import VoiceResponse
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    crop_map = {"1": "Rice", "2": "Wheat", "3": "Maize", "4": "Cotton", "5": "Sugarcane"}
    selected_crop = crop_map.get(digit, "Rice")
    
    farmer = db.query(Farmer).filter(Farmer.phone_number == farmer_phone).first()
    if farmer:
        field = db.query(Field).filter(Field.farmer_id == farmer.id).first()
        if field:
            field.crop_type = selected_crop
            db.commit()
    
    lang = farmer.preferred_language if farmer else "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    crop_names = {
        "English": selected_crop,
        "Hindi": {"Rice": "चावल", "Wheat": "गेहूं", "Maize": "मक्का", "Cotton": "कपास", "Sugarcane": "गन्ना"}.get(selected_crop),
        "Telugu": {"Rice": "వరి", "Wheat": "గోధుమ", "Maize": "మొక్కజొన్న", "Cotton": "పత్తి", "Sugarcane": "చెరకు"}.get(selected_crop),
        "Tamil": {"Rice": "நெல்", "Wheat": "கோதுமை", "Maize": "மக்காச்சோளம்", "Cotton": "பருத்தி", "Sugarcane": "கரும்பு"}.get(selected_crop),
        "Kannada": {"Rice": "ಭತ್ತ", "Wheat": "ಗೋಧಿ", "Maize": "ಮೆಕ್ಕೆಜೋಳ", "Cotton": "ಹತ್ತಿ", "Sugarcane": "ಕಬ್ಬು"}.get(selected_crop)
    }
    
    confirm = {
        "English": f"Crop saved as {crop_names['English']}. Now select your crop growth stage.",
        "Hindi": f"फसल {crop_names['Hindi']} के रूप में सहेजी गई। अब फसल की अवस्था चुनें।",
        "Telugu": f"పంట {crop_names['Telugu']} గా సేవ్ చేయబడింది. ఇప్పుడు పంట దశ ఎంచుకోండి.",
        "Tamil": f"பயிர் {crop_names['Tamil']} ஆகச் சேமிக்கப்பட்டது. இப்போது பயிர் வளர்ச்சி நிலையைத் தேர்வு செய்யுங்கள்.",
        "Kannada": f"ಬೆಳೆ {crop_names['Kannada']} ಎಂದು ಉಳಿಸಲಾಗಿದೆ. ಈಗ ಬೆಳೆ ಬೆಳವಣಿಗೆ ಹಂತವನ್ನು ಆಯ್ಕೆಮಾಡಿ."
    }
    
    response.say(confirm.get(lang), voice=lang_info["voice"], language=lang_info["lang"])
    response.redirect(f"{BASE_URL}/api/v1/voice/ask-field-area")
    return Response(content=str(response), media_type="application/xml")

@router.post("/ask-field-area")
async def ask_field_area(request: Request, db: Session = Depends(get_db)):
    """Ask farmer for field area in their local units"""
    form_data = await request.form()
    farmer_phone = form_data.get("To", "")
    
    from twilio.twiml.voice_response import VoiceResponse, Gather
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    farmer = db.query(Farmer).filter(Farmer.phone_number == farmer_phone).first()
    lang = farmer.preferred_language if farmer else "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    prompts = {
        "English": "Please tell us your field area after the beep. You can say it in acres, bigha, or hectares.",
        "Hindi": "कृपया बीप के बाद अपने खेत का क्षेत्रफल बताएं। आप इसे एकड़, बीघा या हेक्टेयर में बता सकते हैं।",
        "Telugu": "దయచేసి బీప్ తర్వాత మీ పొలం విస్తీర్ణం చెప్పండి. మీరు దీన్ని ఎకరాలు, బిఘా లేదా హెక్టార్లలో చెప్పవచ్చు.",
        "Tamil": "பீப் ஒலிக்குப் பிறகு உங்கள் வயல் பரப்பளவைச் சொல்லுங்கள். நீங்கள் அதை ஏக்கர், பீகா அல்லது ஹெக்டேரில் சொல்லலாம்.",
        "Kannada": "ದಯವಿಟ್ಟು ಬೀಪ್ ನಂತರ ನಿಮ್ಮ ಹೊಲದ ವಿಸ್ತೀರ್ಣವನ್ನು ಹೇಳಿ. ನೀವು ಅದನ್ನು ಎಕರೆ, ಬಿಘಾ ಅಥವಾ ಹೆಕ್ಟೇರ್‌ನಲ್ಲಿ ಹೇಳಬಹುದು."
    }
    
    speech_lang_map = {"English": "en-IN", "Hindi": "hi-IN", "Telugu": "te-IN", "Tamil": "ta-IN", "Kannada": "kn-IN"}
    
    gather = Gather(
        input="speech", 
        action=f"{BASE_URL}/api/v1/voice/save-field-area", 
        method="POST",
        language=speech_lang_map.get(lang, "en-IN"),
        speech_timeout="auto"
    )
    gather.say(prompts.get(lang), voice=lang_info["voice"], language=lang_info["lang"])
    response.append(gather)
    response.redirect(f"{BASE_URL}/api/v1/voice/ask-field-area")
    return Response(content=str(response), media_type="application/xml")

@router.post("/save-field-area")
async def save_field_area(request: Request, db: Session = Depends(get_db)):
    """Save farmer's field area (converts from local units to hectares)"""
    form_data = await request.form()
    speech_result = form_data.get("SpeechResult", "").lower()
    farmer_phone = form_data.get("To", "")
    
    from twilio.twiml.voice_response import VoiceResponse
    from ..services.twilio_service import LANGUAGE_MAP
    import re
    response = VoiceResponse()
    
    farmer = db.query(Farmer).filter(Farmer.phone_number == farmer_phone).first()
    
    # Extract number and unit from speech
    # Try to find numbers in the speech
    numbers = re.findall(r'\d+\.?\d*', speech_result)
    area_value = float(numbers[0]) if numbers else 1.0
    
    # Convert to hectares based on unit mentioned
    if 'acre' in speech_result or 'एकड़' in speech_result or 'ఎకరా' in speech_result or 'ஏக்கர்' in speech_result or 'ಎಕರೆ' in speech_result:
        # 1 acre = 0.404686 hectares
        area_hectares = area_value * 0.404686
    elif 'bigha' in speech_result or 'बीघा' in speech_result or 'బిఘా' in speech_result or 'பீகா' in speech_result or 'ಬಿಘಾ' in speech_result:
        # 1 bigha = 0.25 hectares (varies by region, using common value)
        area_hectares = area_value * 0.25
    elif 'hectare' in speech_result or 'हेक्टेयर' in speech_result or 'హెక్టార్' in speech_result or 'ஹெக்டேர்' in speech_result or 'ಹೆಕ್ಟೇರ್' in speech_result:
        area_hectares = area_value
    else:
        # Default assume acres
        area_hectares = area_value * 0.404686
    
    if farmer:
        field = db.query(Field).filter(Field.farmer_id == farmer.id).first()
        if field:
            field.field_area = round(area_hectares, 2)
            db.commit()
    
    lang = farmer.preferred_language if farmer else "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    confirm = {
        "English": f"Field area saved as {round(area_hectares, 2)} hectares. Now select your crop growth stage.",
        "Hindi": f"खेत का क्षेत्रफल {round(area_hectares, 2)} हेक्टेयर के रूप में सहेजा गया। अब फसल की अवस्था चुनें।",
        "Telugu": f"పొలం విస్తీర్ణం {round(area_hectares, 2)} హెక్టార్లుగా సేవ్ చేయబడింది. ఇప్పుడు పంట దశ ఎంచుకోండి.",
        "Tamil": f"வயல் பரப்பளவு {round(area_hectares, 2)} ஹெக்டேராகச் சேமிக்கப்பட்டது. இப்போது பயிர் வளர்ச்சி நிலையைத் தேர்வு செய்யுங்கள்.",
        "Kannada": f"ಹೊಲದ ವಿಸ್ತೀರ್ಣವನ್ನು {round(area_hectares, 2)} ಹೆಕ್ಟೇರ್ ಎಂದು ಉಳಿಸಲಾಗಿದೆ. ಈಗ ಬೆಳೆ ಬೆಳವಣಿಗೆ ಹಂತವನ್ನು ಆಯ್ಕೆಮಾಡಿ."
    }
    
    response.say(confirm.get(lang), voice=lang_info["voice"], language=lang_info["lang"])
    response.redirect(f"{BASE_URL}/api/v1/voice/ask-stage")
    return Response(content=str(response), media_type="application/xml")

@router.post("/ask-stage")
async def ask_stage(request: Request, db: Session = Depends(get_db)):
    """Ask farmer for crop growth stage"""
    form_data = await request.form()
    farmer_phone = form_data.get("To", "")
    
    from twilio.twiml.voice_response import VoiceResponse, Gather
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    farmer = db.query(Farmer).filter(Farmer.phone_number == farmer_phone).first()
    lang = farmer.preferred_language if farmer else "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    prompts = {
        "English": "Press 1 for Initial or Sowing stage. Press 2 for Vegetative or Growing stage. Press 3 for Flowering stage. Press 4 for Harvesting stage.",
        "Hindi": "बुवाई अवस्था के लिए 1 दबाएं। बढ़ने की अवस्था के लिए 2 दबाएं। फूलने की अवस्था के लिए 3 दबाएं। कटाई अवस्था के लिए 4 दबाएं।",
        "Telugu": "విత్తనం దశ కోసం 1 నొక్కండి. పెరుగుదల దశ కోసం 2 నొక్కండి. పూత దశ కోసం 3 నొక్కండి. కోత దశ కోసం 4 నొక్కండి.",
        "Tamil": "விதைப்பு நிலைக்கு 1 அழுத்தவும். வளர்ச்சி நிலைக்கு 2 அழுத்தவும். பூக்கும் நிலைக்கு 3 அழுத்தவும். அறுவடை நிலைக்கு 4 அழுத்தவும்.",
        "Kannada": "ಬಿತ್ತನೆ ಹಂತಕ್ಕೆ 1 ಒತ್ತಿರಿ. ಬೆಳವಣಿಗೆ ಹಂತಕ್ಕೆ 2 ಒತ್ತಿರಿ. ಹೂಬಿಡುವ ಹಂತಕ್ಕೆ 3 ಒತ್ತಿರಿ. ಕೊಯ್ಲು ಹಂತಕ್ಕೆ 4 ಒತ್ತಿರಿ."
    }
    
    gather = Gather(num_digits=1, action=f"{BASE_URL}/api/v1/voice/save-stage", method="POST")
    gather.say(prompts.get(lang), voice=lang_info["voice"], language=lang_info["lang"])
    response.append(gather)
    response.redirect(f"{BASE_URL}/api/v1/voice/ask-stage")
    return Response(content=str(response), media_type="application/xml")

@router.post("/save-stage")
async def save_stage(request: Request, db: Session = Depends(get_db)):
    """Save crop stage and complete onboarding"""
    form_data = await request.form()
    digit = form_data.get("Digits", "")
    farmer_phone = form_data.get("To", "")
    
    from twilio.twiml.voice_response import VoiceResponse
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    stage_map = {"1": "Initial", "2": "Vegetative", "3": "Flowering", "4": "Harvesting"}
    selected_stage = stage_map.get(digit, "Initial")
    
    farmer = db.query(Farmer).filter(Farmer.phone_number == farmer_phone).first()
    if farmer:
        field = db.query(Field).filter(Field.farmer_id == farmer.id).first()
        if field:
            field.growth_stage = selected_stage
            db.commit()
    
    lang = farmer.preferred_language if farmer else "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    final_msg = {
        "English": f"Thank you {farmer.name if farmer else ''}! Your profile is complete. You will now receive smart irrigation alerts. You can also call this number anytime for advice. Goodbye!",
        "Hindi": f"धन्यवाद {farmer.name if farmer else ''}! आपकी प्रोफ़ाइल पूरी हो गई है। अब आपको स्मार्ट सिंचाई अलर्ट मिलेंगे। सलाह के लिए कभी भी इस नंबर पर कॉल करें। अलविदा!",
        "Telugu": f"ధన్యవాదాలు {farmer.name if farmer else ''}! మీ ప్రొఫైల్ పూర్తయింది. ఇకపై మీకు స్మార్ట్ నీటిపారుదల అలర్ట్‌లు వస్తాయి. సలహా కోసం ఎప్పుడైనా ఈ నంబర్‌కు కాల్ చేయండి. వీడ్కోలు!",
        "Tamil": f"நன்றி {farmer.name if farmer else ''}! உங்கள் சுயவிவரம் முடிந்தது. இனி நீங்கள் ஸ்மார்ட் நீர்ப்பாசன எச்சரிக்கைகளைப் பெறுவீர்கள். ஆலோசனைக்கு எப்போது வேண்டுமானாலும் இந்த எண்ணை அழைக்கவும். விடைபெறுகிறேன்!",
        "Kannada": f"ಧನ್ಯವಾದಗಳು {farmer.name if farmer else ''}! ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣವಾಗಿದೆ. ಇನ್ನು ಮುಂದೆ ನಿಮಗೆ ಸ್ಮಾರ್ಟ್ ನೀರಾವರಿ ಎಚ್ಚರಿಕೆಗಳು ಬರುತ್ತವೆ. ಸಲಹೆಗಾಗಿ ಯಾವಾಗ ಬೇಕಾದರೂ ಈ ನಂಬರ್‌ಗೆ ಕರೆ ಮಾಡಿ. ವಿದಾಯ!"
    }
    
    response.say(final_msg.get(lang), voice=lang_info["voice"], language=lang_info["lang"])
    return Response(content=str(response), media_type="application/xml")

@router.get("/advisory-twiml")
async def get_advisory_twiml(msg: str, lang: str):
    return Response(content=twilio_service.get_advisory_twiml(msg, lang), media_type="application/xml")

# ========== INCOMING CALL HANDLER ==========
# When a farmer CALLS the Twilio number, this handles it

@router.post("/incoming")
async def handle_incoming_call(request: Request, db: Session = Depends(get_db)):
    """Main entry point when a farmer calls the Twilio number"""
    form_data = await request.form()
    caller_phone = form_data.get("From", "")
    
    from twilio.twiml.voice_response import VoiceResponse, Gather
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    # Identify the farmer
    farmer = db.query(Farmer).filter(Farmer.phone_number == caller_phone).first()
    
    if not farmer:
        # Unknown caller - greet in English
        response.say("Welcome to AI Precision Irrigation Assistant. Your number is not registered. Please contact your local agent to register.", 
                      voice="Google.en-IN-Standard-A", language="en-IN")
        return Response(content=str(response), media_type="application/xml")
    
    # Get farmer's language
    lang = farmer.preferred_language or "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    
    # Greet and show menu
    greetings = {
        "English": f"Hello {farmer.name}. Welcome to AI Irrigation Assistant. Press 1 for field status. Press 2 for irrigation advice. Press 3 to change language.",
        "Hindi": f"नमस्ते {farmer.name}। AI सिंचाई सहायक में आपका स्वागत है। खेत की स्थिति के लिए 1 दबाएं। सिंचाई सलाह के लिए 2 दबाएं। भाषा बदलने के लिए 3 दबाएं।",
        "Telugu": f"నమస్కారం {farmer.name}. AI నీటిపారుదల సహాయకుడికి స్వాగతం. పొలం స్థితి కోసం 1 నొక్కండి. నీటిపారుదల సలహా కోసం 2 నొక్కండి. భాష మార్చడానికి 3 నొక్కండి.",
        "Tamil": f"வணக்கம் {farmer.name}. AI நீர்ப்பாசன உதவியாளருக்கு வரவேற்கிறோம். வயல் நிலை அறிய 1 அழுத்தவும். நீர்ப்பாசன ஆலோசனைக்கு 2 அழுத்தவும். மொழி மாற்ற 3 அழுத்தவும்.",
        "Kannada": f"ನಮಸ್ಕಾರ {farmer.name}. AI ನೀರಾವರಿ ಸಹಾಯಕಕ್ಕೆ ಸುಸ್ವಾಗತ. ಹೊಲದ ಸ್ಥಿತಿಗಾಗಿ 1 ಒತ್ತಿರಿ. ನೀರಾವರಿ ಸಲಹೆಗೆ 2 ಒತ್ತಿರಿ. ಭಾಷೆ ಬದಲಾಯಿಸಲು 3 ಒತ್ತಿರಿ."
    }
    
    gather = Gather(num_digits=1, action=f"{BASE_URL}/api/v1/voice/handle-menu", method='POST')
    gather.say(greetings.get(lang, greetings["English"]), voice=lang_info["voice"], language=lang_info["lang"])
    response.append(gather)
    response.redirect(f"{BASE_URL}/api/v1/voice/incoming")
    return Response(content=str(response), media_type="application/xml")

@router.post("/handle-menu")
async def handle_menu_input(request: Request, db: Session = Depends(get_db)):
    """Handles farmer's menu selection"""
    form_data = await request.form()
    digit = form_data.get("Digits", "")
    caller_phone = form_data.get("From", "")
    
    from twilio.twiml.voice_response import VoiceResponse
    from ..services.twilio_service import LANGUAGE_MAP
    response = VoiceResponse()
    
    farmer = db.query(Farmer).filter(Farmer.phone_number == caller_phone).first()
    if not farmer:
        response.say("Error. Farmer not found.", voice="Google.en-IN-Standard-A", language="en-IN")
        return Response(content=str(response), media_type="application/xml")
    
    lang = farmer.preferred_language or "English"
    lang_info = LANGUAGE_MAP.get(lang, LANGUAGE_MAP["English"])
    field = db.query(Field).filter(Field.farmer_id == farmer.id).first()
    
    if digit == "1":
        # Field Status
        from ..models.database import SensorData
        latest = db.query(SensorData).filter(SensorData.field_id == field.id).order_by(SensorData.timestamp.desc()).first() if field else None
        
        if latest:
            status_data = {
                'farmer_name': farmer.name, 'crop': field.crop_type,
                'soil_moisture': latest.soil_moisture, 'temperature': latest.temperature,
                'prediction': "Medium"
            }
        else:
            status_data = {
                'farmer_name': farmer.name, 'crop': field.crop_type if field else "Rice",
                'soil_moisture': 42, 'temperature': 31, 'prediction': "Medium"
            }
        
        msg = await ai_service.generate_irrigation_advice(status_data, lang)
        response.say(msg, voice=lang_info["voice"], language=lang_info["lang"])
        response.redirect(f"{BASE_URL}/api/v1/voice/incoming")
        
    elif digit == "2":
        # AI Irrigation Advice
        ai_data = {
            'farmer_name': farmer.name,
            'crop': field.crop_type if field else "Rice",
            'soil_moisture': 42, 'temperature': 31,
            'prediction': "Medium"
        }
        advice = await ai_service.generate_irrigation_advice(ai_data, lang)
        response.say(advice, voice=lang_info["voice"], language=lang_info["lang"])
        response.redirect(f"{BASE_URL}/api/v1/voice/incoming")
        
    elif digit == "3":
        # Change Language - redirect to language selection
        response.redirect(f"{BASE_URL}/api/v1/voice/language-selection")
    else:
        response.redirect(f"{BASE_URL}/api/v1/voice/incoming")
    
    return Response(content=str(response), media_type="application/xml")
