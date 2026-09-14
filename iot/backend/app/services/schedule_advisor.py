import os
import json
import logging
from groq import Groq
from datetime import datetime, timedelta
from typing import Dict, List, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class ScheduleAdvisor:
    """Uses Groq API to generate irrigation schedules with explanations"""
    
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.3-70b-versatile"  # Using latest Llama 3.3 model
    
    def generate_weekly_schedule(
        self,
        crop_type: str,
        growth_stage: str,
        current_moisture: float,
        ndvi_index: float,
        latitude: float = None,
        longitude: float = None,
        weekly_rain_forecast: List[float] = None,
        soil_type: str = "loamy",
        field_area_hectare: float = 1.0,
        irrigation_history: List[Dict] = None
    ) -> Dict[str, Any]:
        """
        Generate a weekly irrigation schedule with explanations using Groq API
        
        Args:
            crop_type: Type of crop
            growth_stage: Growth stage
            current_moisture: Current soil moisture
            ndvi_index: NDVI value
            latitude: Field latitude (for weather API)
            longitude: Field longitude (for weather API)
            weekly_rain_forecast: Optional manual rain forecast (if not using API)
            soil_type: Type of soil
            field_area_hectare: Field area
            irrigation_history: Recent irrigation events
            
        Returns:
            Weekly schedule with explanations
        """
        
        try:
            # If coordinates provided, fetch real weather data
            if latitude and longitude:
                from ..services.weather import get_detailed_forecast
                import asyncio
                
                # Get detailed 7-day forecast (real data from Open-Meteo daily endpoint)
                weather_data = asyncio.run(get_detailed_forecast(latitude, longitude))
                
                if weather_data:
                    weekly_rain_forecast = self._extract_weekly_rain_forecast(weather_data)
                    logger.info(f"Fetched real 7-day weather forecast for ({latitude}, {longitude})")
                else:
                    logger.warning("Could not fetch weather forecast, using default zeros")
                    if not weekly_rain_forecast:
                        weekly_rain_forecast = [0.0] * 7
            else:
                # Use provided forecast or default
                if not weekly_rain_forecast:
                    weekly_rain_forecast = [0.0] * 7

            
            # Prepare context for Groq
            prompt = self._build_schedule_prompt(
                crop_type=crop_type,
                growth_stage=growth_stage,
                current_moisture=current_moisture,
                ndvi_index=ndvi_index,
                weekly_rain_forecast=weekly_rain_forecast,
                soil_type=soil_type,
                field_area_hectare=field_area_hectare,
                irrigation_history=irrigation_history
            )
            
            # Call Groq API
            message = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            response_text = message.choices[0].message.content
            
            # Parse the response
            schedule = self._parse_schedule_response(response_text)
            
            return {
                "status": "success",
                "schedule": schedule,
                "generated_at": datetime.now().isoformat(),
                "model_used": self.model,
                "weather_source": "Real-time API" if (latitude and longitude) else "Manual forecast"
            }
            
        except Exception as e:
            logger.error(f"Error generating schedule: {str(e)}")
            return {
                "status": "error",
                "message": str(e),
                "schedule": None
            }
    
    def _extract_weekly_rain_forecast(self, weather_data: Dict) -> List[float]:
        """Extract 7-day rain forecast from detailed weather API data (Phase 8 fix).
        Falls back to [0]*7 if daily data is unavailable."""
        try:
            daily_rain = weather_data.get("daily_rain_mm")
            if daily_rain and isinstance(daily_rain, list):
                result = [float(v) for v in daily_rain[:7]]
                while len(result) < 7:
                    result.append(0.0)
                return result
            # Fallback: use current precipitation for today only
            current_precip = weather_data.get("precipitation", 0) or 0
            return [float(current_precip)] + [0.0] * 6
        except Exception as e:
            logger.error(f"Error extracting rain forecast: {str(e)}")
            return [0.0] * 7

    
    def _build_schedule_prompt(
        self,
        crop_type: str,
        growth_stage: str,
        current_moisture: float,
        ndvi_index: float,
        weekly_rain_forecast: List[float],
        soil_type: str,
        field_area_hectare: float,
        irrigation_history: List[Dict]
    ) -> str:
        """Build the prompt for Groq API with dates"""
        
        total_rain = sum(weekly_rain_forecast)
        
        # Get dates for the week
        today = datetime.now()
        dates = [(today + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        # Format irrigation history
        history_text = ""
        if irrigation_history:
            history_text = "\nRecent Irrigation History:\n"
            for event in irrigation_history[-5:]:
                history_text += f"- {event.get('date', 'N/A')}: {event.get('amount_mm', 0)}mm\n"
        
        # Build date-day mapping
        date_mapping = "\n".join([f"- {day_names[i]}: {dates[i]}" for i in range(7)])
        
        prompt = f"""You are an expert agricultural advisor specializing in irrigation management. 
Analyze the following field conditions and provide a detailed weekly irrigation schedule with explanations.

FIELD CONDITIONS:
- Crop Type: {crop_type}
- Growth Stage: {growth_stage}
- Soil Type: {soil_type}
- Field Area: {field_area_hectare} hectares
- Current Soil Moisture: {current_moisture}%
- NDVI Index (Crop Health): {ndvi_index:.2f} (0=dead, 0.5=moderate, 1=very healthy)
- Total Forecasted Rain This Week: {total_rain:.1f}mm

WEEK DATES:
{date_mapping}

DAILY RAIN FORECAST (mm):
- Monday ({dates[0]}): {weekly_rain_forecast[0]:.1f}mm
- Tuesday ({dates[1]}): {weekly_rain_forecast[1]:.1f}mm
- Wednesday ({dates[2]}): {weekly_rain_forecast[2]:.1f}mm
- Thursday ({dates[3]}): {weekly_rain_forecast[3]:.1f}mm
- Friday ({dates[4]}): {weekly_rain_forecast[4]:.1f}mm
- Saturday ({dates[5]}): {weekly_rain_forecast[5]:.1f}mm
- Sunday ({dates[6]}): {weekly_rain_forecast[6]:.1f}mm

{history_text}

CROP WATER REQUIREMENTS BY GROWTH STAGE:
- Initial Stage: 2-4mm/day
- Development Stage: 4-6mm/day
- Mid/Late Stage: 5-8mm/day

SOIL MOISTURE THRESHOLDS:
- Critical (< 25%): Immediate irrigation needed
- Low (25-40%): Irrigation recommended
- Adequate (40-60%): Monitor, may not need irrigation
- High (> 60%): No irrigation needed, risk of waterlogging

NDVI INTERPRETATION:
- < 0.3: Severe crop stress
- 0.3-0.5: Moderate stress
- 0.5-0.7: Healthy crop
- > 0.7: Very healthy crop

Please provide:
1. A day-by-day irrigation schedule for the week with dates
2. Identify the NEXT irrigation date (first day when irrigation is needed)
3. Explanation for each day's decision
4. Key factors influencing the schedule
5. Risk assessment (drought risk, waterlogging risk)
6. Recommendations for next week

Format your response as JSON:
{{
    "schedule": [
        {{
            "day": "Monday",
            "date": "{dates[0]}",
            "irrigate": true/false,
            "water_amount_mm": 0-50,
            "reason": "explanation",
            "confidence": "high/medium/low"
        }},
        ...
    ],
    "next_irrigation_date": "YYYY-MM-DD",
    "next_irrigation_day": "day name",
    "next_irrigation_water_mm": number,
    "key_factors": ["factor1", "factor2"],
    "risk_assessment": {{
        "drought_risk": "low/medium/high",
        "waterlogging_risk": "low/medium/high",
        "explanation": "explanation"
    }},
    "summary": "overall summary",
    "next_week_recommendation": "recommendation"
}}

Provide ONLY valid JSON, no additional text."""
        
        return prompt
    
    def _parse_schedule_response(self, response_text: str) -> Dict[str, Any]:
        """Parse the Groq API response"""
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                schedule = json.loads(json_str)
                return schedule
            else:
                logger.warning("Could not find JSON in response")
                return {"error": "Invalid response format"}
                
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON response: {str(e)}")
            return {"error": "Failed to parse schedule"}
    
    def generate_model_explanation(
        self,
        crop_type: str,
        growth_stage: str,
        current_moisture: float,
        ndvi_index: float,
        irrigation_prediction: bool,
        water_requirement: float,
        confidence: float
    ) -> Dict[str, Any]:
        """
        Generate explanation for why the model made a specific irrigation decision
        """
        
        try:
            prompt = f"""You are an expert in machine learning and agriculture. 
Explain why an irrigation prediction model made a specific decision.

MODEL PREDICTION:
- Decision: {"Irrigation NEEDED" if irrigation_prediction else "NO irrigation needed"}
- Confidence: {confidence:.1%}
- Predicted Water Requirement: {water_requirement:.1f}mm

FIELD CONDITIONS:
- Crop Type: {crop_type}
- Growth Stage: {growth_stage}
- Current Soil Moisture: {current_moisture}%
- NDVI Index (Crop Health): {ndvi_index:.2f}

Please provide:
1. Why the model made this decision (2-3 key reasons)
2. Which factors were most influential
3. Any concerns or edge cases
4. Confidence assessment

Format as JSON:
{{
    "decision": "explanation of the decision",
    "key_reasons": ["reason1", "reason2", "reason3"],
    "influential_factors": {{"factor": "impact"}},
    "concerns": ["concern1", "concern2"],
    "confidence_assessment": "explanation of confidence level"
}}

Provide ONLY valid JSON."""
            
            message = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.5,
                max_tokens=1000
            )
            
            response_text = message.choices[0].message.content
            
            # Parse JSON response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                explanation = json.loads(json_str)
                return {
                    "status": "success",
                    "explanation": explanation
                }
            else:
                return {
                    "status": "error",
                    "message": "Could not parse explanation"
                }
                
        except Exception as e:
            logger.error(f"Error generating explanation: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }


# Create singleton instance
schedule_advisor = ScheduleAdvisor()
