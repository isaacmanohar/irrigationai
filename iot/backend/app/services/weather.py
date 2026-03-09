import httpx
import logging

logger = logging.getLogger(__name__)

# Open-Meteo URL - example: https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m

async def get_weather(lat: float, lon: float):
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,precipitation&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min&timezone=auto"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                current_weather = data.get("current_weather", {})
                daily = data.get("daily", {})
                
                # 5-day forecast
                forecast = []
                if "time" in daily and "temperature_2m_max" in daily:
                    for i in range(min(5, len(daily["time"]))):
                        forecast.append({
                            "date": daily["time"][i],
                            "max_temp": daily["temperature_2m_max"][i],
                            "min_temp": daily["temperature_2m_min"][i]
                        })
                        
                return {
                    "temperature": current_weather.get("temperature"),
                    "windspeed": current_weather.get("windspeed"),
                    "humidity": data.get("hourly", {}).get("relativehumidity_2m", [0])[0] if data.get("hourly", {}).get("relativehumidity_2m") else 0,
                    "precipitation": data.get("hourly", {}).get("precipitation", [0])[0] if data.get("hourly", {}).get("precipitation") else 0,
                    "sunrise": daily.get("sunrise", [""])[0].split("T")[-1] if daily.get("sunrise") else "06:00",
                    "sunset": daily.get("sunset", [""])[0].split("T")[-1] if daily.get("sunset") else "18:00",
                    "forecast": forecast
                }
            else:
                logger.error(f"Weather API returned status code: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error fetching weather data: {str(e)}")
            return None
