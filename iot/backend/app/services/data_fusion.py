"""
Data Fusion Service — Phase 4
==============================
Combines IoT sensor readings, weather forecast, satellite NDVI, and
farm/crop profile into a single, coherent FarmState object.

This is the single source of truth consumed by:
  - IrrigationPredictor  (ML models)
  - IrrigationAgent      (Agentic AI reasoning)
  - XAI explanation      (feature importance)
  - Dashboard status     (enriched response)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


# ─── FarmState dataclass ──────────────────────────────────────────────────────

@dataclass
class FarmState:
    """Unified representation of a farm's current state from all data sources."""

    # Metadata
    timestamp: str = ""
    field_id: int = 0
    farmer_name: str = "Unknown"
    farmer_village: str = "Unknown"

    # Crop / field
    crop: str = "Unknown"
    growth_stage: str = "Unknown"
    field_area_ha: float = 1.0
    soil_type: str = "loamy"
    season: str = "Kharif"
    optimal_moisture: float = 40.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    # IoT sensor readings
    soil_moisture: float = 40.0
    temperature: float = 25.0
    humidity: float = 60.0
    flow_rate: float = 0.0
    sensor_timestamp: Optional[str] = None
    sensor_available: bool = False

    # Satellite (NDVI)
    ndvi: float = 0.5
    ndvi_status: str = "Unknown"
    ndvi_stress_alert: bool = False
    ndvi_trend: str = "stable"          # "improving" | "declining" | "stable" | "unknown"
    ndvi_available: bool = False

    # Weather
    weather_temp: float = 25.0
    weather_humidity: float = 60.0
    rainfall_mm: float = 0.0
    rain_probability: float = 0.0
    wind_speed_kmh: float = 10.0
    sunlight_hours: float = 8.0
    weather_available: bool = False

    # 7-day daily rain forecast (list of mm per day)
    forecast_rain_7d: List[float] = field(default_factory=lambda: [0.0] * 7)

    # Irrigation history
    prev_irrigation_mm: float = 10.0
    days_since_irrigation: int = 99
    irrigation_history: List[Dict] = field(default_factory=list)

    # Derived / computed features
    water_stress_index: float = 0.0     # 0 (no stress) … 1 (severe)
    crop_health_index: float = 0.5      # derived from NDVI
    evapotranspiration_est: float = 5.0  # simple ET estimate mm/day

    # Source quality flags
    sources_used: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_ml_features(self) -> Dict[str, Any]:
        """
        Map FarmState fields to the feature names expected by the trained
        RandomForest models (capital-letter convention from train_comprehensive.py).
        """
        CROP_ENCODING = {
            "rice": 0, "wheat": 1, "maize": 2, "corn": 2,
            "cotton": 3, "sugarcane": 4, "pulse": 5, "other": 1,
        }
        STAGE_ENCODING = {
            "initial": 0, "germination": 0,
            "development": 1, "vegetative": 1, "mid": 2,
            "late": 2, "flowering": 2, "harvest": 2, "reproduction": 2,
        }
        SEASON_ENCODING = {"kharif": 0, "rabi": 1, "zaid": 2}
        SOIL_ENCODING = {
            "sandy": 0, "loamy": 1, "clay": 2,
            "silt": 3, "peat": 4, "chalky": 5,
        }

        crop_enc = CROP_ENCODING.get(self.crop.lower(), 1)
        stage_enc = STAGE_ENCODING.get(self.growth_stage.lower(), 1)
        season_enc = SEASON_ENCODING.get(self.season.lower(), 0)
        soil_enc = SOIL_ENCODING.get(self.soil_type.lower(), 1)

        return {
            "Soil_Type": soil_enc,
            "Soil_Moisture": self.soil_moisture,
            "Temperature_C": self.temperature,
            "Humidity": self.humidity,
            "Rainfall_mm": self.rainfall_mm,
            "Wind_Speed_kmh": self.wind_speed_kmh,
            "Sunlight_Hours": self.sunlight_hours,
            "Crop_Type": crop_enc,
            "Crop_Growth_Stage": stage_enc,
            "Season": season_enc,
            "NDVI": self.ndvi,
            "Previous_Irrigation_mm": self.prev_irrigation_mm,
        }


# ─── DataFusionService ────────────────────────────────────────────────────────

class DataFusionService:
    """
    Assembles a FarmState by querying the DB, weather API, and satellite service.
    Each source is fetched independently — missing sources degrade gracefully.
    """

    async def build_farm_state(
        self,
        field_id: int,
        db: Session,
        fetch_weather: bool = True,
        fetch_ndvi: bool = False,   # GEE is slow; caller decides
    ) -> FarmState:
        """
        Build a complete FarmState for a given field.

        Args:
            field_id: database field ID
            db: active SQLAlchemy session
            fetch_weather: whether to call Open-Meteo (async)
            fetch_ndvi: whether to call GEE for fresh NDVI (slow — use cached DB value by default)
        """
        state = FarmState(
            timestamp=datetime.utcnow().isoformat(),
            field_id=field_id,
        )

        # ── 1. Farm / crop profile ───────────────────────────────────────────
        await self._load_farm_profile(state, field_id, db)

        # ── 2. IoT sensor readings ───────────────────────────────────────────
        self._load_sensor_data(state, field_id, db)

        # ── 3. Satellite NDVI (cached from DB, optionally fresh from GEE) ───
        await self._load_ndvi(state, field_id, db, fetch_fresh=fetch_ndvi)

        # ── 4. Weather (current + forecast) ─────────────────────────────────
        if fetch_weather and state.latitude and state.longitude:
            await self._load_weather(state)

        # ── 5. Irrigation history ────────────────────────────────────────────
        self._load_irrigation_history(state, field_id, db)

        # ── 6. Derived features ──────────────────────────────────────────────
        self._compute_derived(state)

        logger.info(
            f"DataFusion: field={field_id} sources={state.sources_used} "
            f"moisture={state.soil_moisture:.1f}% ndvi={state.ndvi:.3f} "
            f"rain={state.rainfall_mm:.1f}mm"
        )
        return state

    # ── private helpers ───────────────────────────────────────────────────────

    async def _load_farm_profile(
        self, state: FarmState, field_id: int, db: Session
    ) -> None:
        from app.models.database import Field, Farmer

        field = db.query(Field).filter(Field.id == field_id).first()
        if not field:
            logger.warning(f"DataFusion: field {field_id} not found in DB")
            return

        state.crop = field.crop_type or "Unknown"
        state.growth_stage = field.growth_stage or "Unknown"
        state.field_area_ha = field.field_area or 1.0
        state.season = field.season or "Kharif"
        state.optimal_moisture = field.optimal_moisture_level or 40.0

        farmer: Optional[Farmer] = field.owner
        if farmer:
            state.farmer_name = farmer.name or "Unknown"
            state.farmer_village = farmer.village or "Unknown"
            state.latitude = farmer.latitude
            state.longitude = farmer.longitude

        state.sources_used.append("farm_profile")

    def _load_sensor_data(
        self, state: FarmState, field_id: int, db: Session
    ) -> None:
        from app.models.database import SensorData

        latest = (
            db.query(SensorData)
            .filter(SensorData.field_id == field_id)
            .order_by(SensorData.timestamp.desc())
            .first()
        )
        if latest:
            state.soil_moisture = latest.soil_moisture or 40.0
            state.temperature = latest.temperature or 25.0
            state.humidity = latest.humidity or 60.0
            state.flow_rate = latest.flow_rate or 0.0
            state.sensor_timestamp = latest.timestamp.isoformat()
            state.sensor_available = True
            state.sources_used.append("iot_sensor")
        else:
            logger.warning(f"DataFusion: no sensor data for field {field_id}")

    async def _load_ndvi(
        self, state: FarmState, field_id: int, db: Session, fetch_fresh: bool
    ) -> None:
        from app.models.database import SatelliteData

        if fetch_fresh and state.latitude and state.longitude:
            try:
                from app.services.satellite import satellite_service
                ndvi_data = await satellite_service.get_ndvi(
                    state.latitude, state.longitude
                )
                state.ndvi = ndvi_data.get("ndvi_value", 0.5)
                state.ndvi_status = ndvi_data.get("health_status", "Unknown")
                state.ndvi_stress_alert = ndvi_data.get("stress_alert", False)
                state.ndvi_available = True
                state.sources_used.append("satellite_live")
            except Exception as exc:
                logger.warning(f"DataFusion: live NDVI fetch failed — {exc}")

        # Always try the cached DB value as fallback / supplement
        cached = (
            db.query(SatelliteData)
            .filter(SatelliteData.field_id == field_id)
            .order_by(SatelliteData.timestamp.desc())
            .first()
        )
        if cached and not state.ndvi_available:
            state.ndvi = cached.ndvi_value or 0.5
            state.ndvi_status = cached.health_status or "Unknown"
            state.ndvi_stress_alert = cached.stress_alert or False
            state.ndvi_available = True
            state.sources_used.append("satellite_cached")

        # Compute NDVI trend from last two DB records
        records = (
            db.query(SatelliteData)
            .filter(SatelliteData.field_id == field_id)
            .order_by(SatelliteData.timestamp.desc())
            .limit(2)
            .all()
        )
        if len(records) >= 2:
            delta = records[0].ndvi_value - records[1].ndvi_value
            if delta > 0.05:
                state.ndvi_trend = "improving"
            elif delta < -0.05:
                state.ndvi_trend = "declining"
            else:
                state.ndvi_trend = "stable"

    async def _load_weather(self, state: FarmState) -> None:
        try:
            from app.services.weather import get_weather, get_detailed_forecast
            weather = await get_weather(state.latitude, state.longitude)
            if weather:
                state.weather_temp = weather.get("temperature") or state.temperature
                state.weather_humidity = weather.get("humidity") or state.humidity
                state.rainfall_mm = weather.get("precipitation") or 0.0
                state.wind_speed_kmh = weather.get("windspeed") or 10.0
                state.weather_available = True
                state.sources_used.append("weather_current")

            # 7-day rain forecast
            forecast = await get_detailed_forecast(state.latitude, state.longitude)
            if forecast:
                state.forecast_rain_7d = forecast.get("daily_rain_mm", [0.0] * 7)
                state.rain_probability = forecast.get("today_precip_prob", 0.0)
                state.sources_used.append("weather_forecast")

        except Exception as exc:
            logger.warning(f"DataFusion: weather fetch failed — {exc}")

    def _load_irrigation_history(
        self, state: FarmState, field_id: int, db: Session
    ) -> None:
        from app.models.database import IrrigationHistory
        from datetime import datetime as dt

        records = (
            db.query(IrrigationHistory)
            .filter(IrrigationHistory.field_id == field_id)
            .order_by(IrrigationHistory.start_time.desc())
            .limit(5)
            .all()
        )
        if records:
            last = records[0]
            state.prev_irrigation_mm = last.water_used or 10.0
            if last.start_time:
                delta = dt.utcnow() - last.start_time
                state.days_since_irrigation = delta.days
            state.irrigation_history = [
                {
                    "date": r.start_time.strftime("%Y-%m-%d") if r.start_time else "N/A",
                    "water_used": r.water_used or 0,
                    "status": r.status or "Unknown",
                }
                for r in records
            ]
            state.sources_used.append("irrigation_history")

    def _compute_derived(self, state: FarmState) -> None:
        """Compute secondary/derived features from primary sources."""
        # Water stress index: 0 = no stress, 1 = severe
        moisture_deficit = max(0.0, state.optimal_moisture - state.soil_moisture) / state.optimal_moisture
        ndvi_stress = max(0.0, 0.6 - state.ndvi) / 0.6  # normalized
        state.water_stress_index = round(
            0.6 * moisture_deficit + 0.4 * ndvi_stress, 3
        )

        # Crop health index from NDVI (0–1)
        state.crop_health_index = round(
            min(1.0, max(0.0, state.ndvi / 0.8)), 3
        )

        # Simple Penman-Monteith inspired ET estimate (mm/day)
        # ET ≈ 0.0023 × (T_mean + 17.8) × (T_max − T_min)^0.5 × Ra
        # Simplified: ET = kc × (0.5 + 0.01*temp - 0.005*humidity)
        # Crop coefficient heuristic
        stage_kc = {"initial": 0.4, "development": 0.7, "mid": 1.15, "late": 0.8}
        kc = stage_kc.get(state.growth_stage.lower(), 0.75)
        et_raw = kc * (0.5 + 0.01 * state.temperature - 0.005 * state.humidity)
        state.evapotranspiration_est = round(max(0.5, min(15.0, et_raw * 8)), 2)


# Singleton
data_fusion_service = DataFusionService()
