import os
import logging
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if self.api_key:
            self.client = Groq(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("GROQ_API_KEY not found in .env")

    async def generate_irrigation_advice(self, data: dict, language: str):
        """
        Uses Groq AI (Llama 3) to generate a personalized irrigation advice message.
        """
        if not self.client:
            return f"Hello {data.get('farmer_name')}. AI suggests a {data.get('prediction')} irrigation need."

        prompt = f"""
        You are an AI Irrigation Assistant. 
        Farmer Name: {data.get('farmer_name')}
        Crop: {data.get('crop')}
        Soil Moisture: {data.get('soil_moisture')}%
        Temperature: {data.get('temperature')}°C
        AI Prediction: {data.get('prediction')} irrigation need.
        
        Generate a friendly, concise advice message (max 2 sentences) for the farmer.
        Translate the message directly into {language} if it is not English.
        """

        try:
            completion = self.client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=200,
            )
            return completion.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Groq AI Error: {str(e)}")
            return f"Hello {data.get('farmer_name')}. AI suggests a {data.get('prediction')} irrigation need."

ai_service = AIService()
