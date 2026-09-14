"""
Weather Service — Open-Meteo integration.

Provides:
  get_weather(lat, lon)          → current conditions + 5-day summary
  get_detailed_forecast(lat, lon) → real 7-day daily forecast (Phase 8 fix)
"""

import httpx
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

_OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"


async def get_weather(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """
    Fetch current weather conditions + 5-day forecast summary.
    Existing callers (dashboard, sensors API, voice) use this function — unchanged.
    """
    url = (
        f"{_OPEN_METEO_BASE}?latitude={lat}&longitude={lon}"
        "&current_weather=true"
        "&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,precipitation"
        "&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,precipitation_sum"
        "&timezone=auto"
    )

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            response = await client.get(url)
            if response.status_code != 200:
                logger.error(f"Weather API status {response.status_code} for ({lat},{lon})")
                return None

            data = response.json()
            current = data.get("current_weather", {})
            daily = data.get("daily", {})
            hourly = data.get("hourly", {})

            # 5-day forecast
            forecast = []
            times = daily.get("time", [])
            for i in range(min(5, len(times))):
                forecast.append({
                    "date": times[i],
                    "max_temp": daily.get("temperature_2m_max", [None] * 7)[i],
                    "min_temp": daily.get("temperature_2m_min", [None] * 7)[i],
                    "precipitation_mm": daily.get("precipitation_sum", [0] * 7)[i] or 0,
                })

            return {
                "temperature": current.get("temperature"),
                "windspeed": current.get("windspeed"),
                "humidity": hourly.get("relativehumidity_2m", [0])[0] if hourly.get("relativehumidity_2m") else 0,
                "precipitation": hourly.get("precipitation", [0])[0] if hourly.get("precipitation") else 0,
                "sunrise": daily.get("sunrise", [""])[0].split("T")[-1] if daily.get("sunrise") else "06:00",
                "sunset": daily.get("sunset", [""])[0].split("T")[-1] if daily.get("sunset") else "18:00",
                "forecast": forecast,
            }

        except Exception as exc:
            logger.error(f"Error fetching weather for ({lat},{lon}): {exc}")
            return None


async def get_detailed_forecast(
    lat: float, lon: float
) -> Optional[Dict[str, Any]]:
    """
    Phase 8 — Real 7-day daily forecast with precipitation probability.
    Used by DataFusionService and ScheduleAdvisor to replace the fake estimate.

    Returns:
        {
          "daily_rain_mm":        [float × 7],   daily precipitation totals
          "daily_precip_prob":    [float × 7],   precipitation probability 0-100
          "daily_max_temp":       [float × 7],
          "daily_min_temp":       [float × 7],
          "daily_humidity":       [float × 7],   mean daily humidity
          "daily_wind_kmh":       [float × 7],
          "today_precip_prob":    float,
        }
    """
    url = (
        f"{_OPEN_METEO_BASE}?latitude={lat}&longitude={lon}"
        "&daily=precipitation_sum,precipitation_probability_max,"
        "temperature_2m_max,temperature_2m_min,"
        "windspeed_10m_max,relativehumidity_2m_max"
        "&timezone=auto"
    )

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            response = await client.get(url)
            if response.status_code != 200:
                logger.error(f"Detailed forecast API status {response.status_code}")
                return None

            data = response.json()
            daily = data.get("daily", {})
            n = min(7, len(daily.get("time", [])))

            def _safe_list(key: str, default: float = 0.0) -> List[float]:
                vals = daily.get(key, [])
                return [float(v) if v is not None else default for v in vals[:n]]

            rain_mm = _safe_list("precipitation_sum", 0.0)
            precip_prob = _safe_list("precipitation_probability_max", 0.0)
            max_temp = _safe_list("temperature_2m_max", 25.0)
            min_temp = _safe_list("temperature_2m_min", 15.0)
            wind = _safe_list("windspeed_10m_max", 10.0)
            humidity = _safe_list("relativehumidity_2m_max", 60.0)

            # Pad to 7 days if fewer returned
            while len(rain_mm) < 7:
                rain_mm.append(0.0)
                precip_prob.append(0.0)
                max_temp.append(25.0)
                min_temp.append(15.0)
                wind.append(10.0)
                humidity.append(60.0)

            logger.info(
                f"Weather: 7-day forecast fetched for ({lat:.3f},{lon:.3f}): "
                f"rain totals={[round(r,1) for r in rain_mm[:7]]}"
            )

            return {
                "daily_rain_mm": rain_mm[:7],
                "daily_precip_prob": precip_prob[:7],
                "daily_max_temp": max_temp[:7],
                "daily_min_temp": min_temp[:7],
                "daily_humidity": humidity[:7],
                "daily_wind_kmh": wind[:7],
                "today_precip_prob": precip_prob[0] if precip_prob else 0.0,
            }

        except Exception as exc:
            logger.error(f"Error fetching detailed forecast for ({lat},{lon}): {exc}")
            return None
