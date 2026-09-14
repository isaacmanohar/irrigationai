"""
Demo Mode API — Phase 10
==========================
Populates realistic mock live telemetry across IoT sensors, Satellite/NDVI,
Weather for farmer's location, and Crop stage.

All data flows directly through:
  DataFusionService -> ML RandomForest Classifier & Regressor ->
  Agentic AI Engine (Reason -> Plan -> Decide) -> XAI Feature Importance.
"""

import logging
from datetime import datetime, timedelta
import random
from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..models.database import Field, Farmer, SensorData
from ..services.data_fusion import data_fusion_service
from ..services.agent import irrigation_agent
from ..services.prediction import predictor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/demo", tags=["Demo Mode"])

# Preset demo scenarios
DEMO_SCENARIOS = {
    "severe_drought": {
        "key": "severe_drought",
        "title": "Severe Drought Stress",
        "badge": "🚨 Critical Drought",
        "color": "rose",
        "description": "High air temperature (37°C), low humidity (28%), depleted rootzone soil moisture (18.2%), stressed NDVI (0.28), and zero rain forecast.",
        "expected_action": "IRRIGATE_NOW",
        "expected_water_mm": 24.5,
        "base_moisture": 18.2,
        "base_temp": 36.8,
        "base_humidity": 28.0,
        "base_flow": 0.0,
        "ndvi": 0.28,
        "ndvi_status": "Stressed",
        "rain_prob": 5,
        "rain_mm": 0.0,
        "water_stress_index": 0.88,
        "trend_start": 32.0,
    },
    "incoming_rain": {
        "key": "incoming_rain",
        "title": "Incoming Rainfall Event",
        "badge": "🌧️ Rain Forecasted",
        "color": "sky",
        "description": "Marginal soil moisture (26.5%) with moderate crop health (NDVI 0.52). However, 85% probability of 22mm rainfall in 6 hours triggers AI water conservation.",
        "expected_action": "DELAY_FOR_RAIN",
        "expected_water_mm": 0.0,
        "base_moisture": 26.5,
        "base_temp": 27.5,
        "base_humidity": 76.0,
        "base_flow": 0.0,
        "ndvi": 0.52,
        "ndvi_status": "Moderate",
        "rain_prob": 85,
        "rain_mm": 22.0,
        "water_stress_index": 0.35,
        "trend_start": 34.0,
    },
    "optimal_post_irrigation": {
        "key": "optimal_post_irrigation",
        "title": "Optimal Post-Irrigation",
        "badge": "🌿 Optimal Field Health",
        "color": "emerald",
        "description": "Well-saturated rootzone (44.5%), high vegetative index (NDVI 0.74), mild weather (26°C), and healthy transpiration.",
        "expected_action": "MONITOR",
        "expected_water_mm": 0.0,
        "base_moisture": 44.5,
        "base_temp": 26.2,
        "base_humidity": 58.0,
        "base_flow": 0.0,
        "ndvi": 0.74,
        "ndvi_status": "Healthy",
        "rain_prob": 10,
        "rain_mm": 0.0,
        "water_stress_index": 0.12,
        "trend_start": 25.0,
    },
}


class ApplyScenarioRequest(BaseModel):
    field_id: int
    scenario_key: str
    custom_moisture: Optional[float] = None
    custom_temp: Optional[float] = None


class TickSimulationRequest(BaseModel):
    field_id: int
    scenario_key: Optional[str] = "severe_drought"
    is_pump_on: Optional[bool] = False
    step_count: Optional[int] = 1


@router.get("/scenarios")
async def get_demo_scenarios():
    """Return all available demo scenarios with metadata and expected AI decisions."""
    return {
        "status": "success",
        "scenarios": list(DEMO_SCENARIOS.values()),
    }


@router.post("/apply")
async def apply_demo_scenario(
    req: ApplyScenarioRequest,
    db: Session = Depends(get_db),
):
    """
    Apply a demo scenario to a field:
    1. Generates 24 hours of realistic historical SensorData leading up to current reading.
    2. Writes data directly to SQLite database.
    3. Runs real Data Fusion -> ML Prediction -> Agentic AI Decision -> XAI Explanation.
    """
    field = db.query(Field).filter(Field.id == req.field_id).first()
    if not field:
        # Fallback to first field if field_id not found
        field = db.query(Field).first()
        if not field:
            raise HTTPException(status_code=404, detail="No field found in database")

    scenario = DEMO_SCENARIOS.get(req.scenario_key, DEMO_SCENARIOS["severe_drought"])
    
    target_moisture = req.custom_moisture if req.custom_moisture is not None else scenario["base_moisture"]
    target_temp = req.custom_temp if req.custom_temp is not None else scenario["base_temp"]
    target_humidity = scenario["base_humidity"]

    now = datetime.utcnow()

    # Clear existing sensor data for clean demo chart
    db.query(SensorData).filter(SensorData.field_id == field.id).delete()

    # Generate 24 historical points transitioning from trend_start to target_moisture
    trend_start = scenario["trend_start"]
    history_records = []
    
    for i in range(24, 0, -1):
        ts = now - timedelta(hours=i)
        progress = (24 - i) / 24.0
        # Smooth interpolation with minor sensor noise
        noise = (random.random() - 0.5) * 0.8
        hist_moisture = max(5.0, min(80.0, trend_start + (target_moisture - trend_start) * progress + noise))
        hist_temp = max(10.0, min(48.0, target_temp + (random.random() - 0.5) * 1.5))
        hist_hum = max(15.0, min(95.0, target_humidity + (random.random() - 0.5) * 3.0))

        record = SensorData(
            field_id=field.id,
            soil_moisture=round(hist_moisture, 2),
            temperature=round(hist_temp, 2),
            humidity=round(hist_hum, 2),
            flow_rate=0.0,
            timestamp=ts,
        )
        history_records.append(record)

    # Current real-time reading
    latest_record = SensorData(
        field_id=field.id,
        soil_moisture=round(target_moisture, 2),
        temperature=round(target_temp, 2),
        humidity=round(target_humidity, 2),
        flow_rate=scenario["base_flow"],
        timestamp=now,
    )
    history_records.append(latest_record)

    db.bulk_save_objects(history_records)
    db.commit()

    # Run the full pipeline
    try:
        farm_state = await data_fusion_service.build_farm_state(
            field_id=field.id,
            db=db,
            fetch_weather=True,
            fetch_ndvi=False,
        )

        # Override simulated weather and NDVI in the farm_state for the scenario
        farm_state.ndvi = scenario["ndvi"]
        farm_state.ndvi_status = scenario["ndvi_status"]
        farm_state.rain_probability = scenario["rain_prob"]
        farm_state.rainfall_forecast_mm = scenario["rain_mm"]
        farm_state.water_stress_index = scenario["water_stress_index"]

        ml_features = farm_state.to_ml_features()

        # Run ML Models
        ml_decision = predictor.predict_irrigation_need(ml_features)
        ml_water_mm = predictor.predict_water_requirement(ml_features)
        xai = predictor.explain_prediction(ml_features)

        # Run Agentic AI Engine
        agent_decision = irrigation_agent.decide(farm_state)

        return {
            "status": "success",
            "field_id": field.id,
            "scenario": scenario,
            "farm_state": farm_state.to_dict(),
            "ml_prediction": {
                "needs_irrigation": ml_decision.get("needs_irrigation"),
                "confidence": ml_decision.get("confidence"),
                "water_requirement_mm": round(ml_water_mm, 1),
            },
            "agent_decision": agent_decision.to_dict(),
            "xai": xai,
            "message": f"Demo scenario '{scenario['title']}' applied successfully through full ML & Agentic AI pipeline.",
        }

    except Exception as exc:
        logger.error(f"Error executing demo pipeline: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(exc)}")


@router.post("/tick")
async def tick_simulation(
    req: TickSimulationRequest,
    db: Session = Depends(get_db),
):
    """
    Advances the live simulation by 1 time step:
    - If pump is ON: soil moisture increases (+2.5% per tick).
    - If pump is OFF: soil moisture dries down (-0.4% per tick under sun).
    - Writes new SensorData record to database.
    - Re-evaluates entire Agentic AI pipeline.
    """
    field = db.query(Field).filter(Field.id == req.field_id).first()
    if not field:
        field = db.query(Field).first()
        if not field:
            raise HTTPException(status_code=404, detail="No field found")

    # Get latest reading
    latest = (
        db.query(SensorData)
        .filter(SensorData.field_id == field.id)
        .order_by(SensorData.timestamp.desc())
        .first()
    )

    current_m = latest.soil_moisture if latest else 28.0
    current_t = latest.temperature if latest else 32.0
    current_h = latest.humidity if latest else 45.0

    if req.is_pump_on:
        new_m = min(65.0, current_m + 2.5 + (random.random() - 0.5) * 0.4)
        new_flow = 15.0 + random.random() * 2.0
    else:
        new_m = max(10.0, current_m - 0.4 + (random.random() - 0.5) * 0.2)
        new_flow = 0.0

    # Temperature oscillation
    temp_delta = (random.random() - 0.48) * 0.5
    new_t = round(max(15.0, min(45.0, current_t + temp_delta)), 1)
    new_h = round(max(20.0, min(90.0, current_h - (temp_delta * 0.8))), 1)

    now = datetime.utcnow()
    new_record = SensorData(
        field_id=field.id,
        soil_moisture=round(new_m, 2),
        temperature=round(new_t, 2),
        humidity=round(new_h, 2),
        flow_rate=round(new_flow, 1),
        timestamp=now,
    )
    db.add(new_record)
    db.commit()

    # Re-run pipeline
    farm_state = await data_fusion_service.build_farm_state(
        field_id=field.id,
        db=db,
        fetch_weather=True,
        fetch_ndvi=False,
    )
    agent_decision = irrigation_agent.decide(farm_state)
    xai = predictor.explain_prediction(farm_state.to_ml_features())

    return {
        "status": "success",
        "current_sensor": {
            "soil_moisture": round(new_m, 1),
            "temperature": round(new_t, 1),
            "humidity": round(new_h, 1),
            "water_flow": round(new_flow, 1),
            "timestamp": now.isoformat(),
        },
        "agent_decision": agent_decision.to_dict(),
        "xai": xai,
    }
