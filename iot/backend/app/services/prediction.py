import joblib
import pandas as pd
import os
import logging
import numpy as np
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Robust path resolution ─────────────────────────────────────────────────
# This file lives at: backend/app/services/prediction.py
# Models live at:     <project_root>/ml_model/saved_models/<name>.pkl
# Probe several candidate roots so the backend works regardless of where
# uvicorn/gunicorn is invoked from (project root OR backend/ directory).

_THIS_FILE = os.path.abspath(__file__)          # …/backend/app/services/prediction.py
_BACKEND_DIR = os.path.dirname(              # …/backend
    os.path.dirname(os.path.dirname(_THIS_FILE))
)
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)   # …/iot  (git root)

def _probe_model_path(rel_candidates: list) -> Optional[str]:
    """Return the first existing path from relative candidates against several roots."""
    search_roots = [_PROJECT_ROOT, _BACKEND_DIR, os.getcwd()]
    for root in search_roots:
        for candidate in rel_candidates:
            full = os.path.normpath(os.path.join(root, candidate))
            if os.path.exists(full):
                logger.info(f"Model found at: {full}")
                return full
    logger.warning(
        f"Model not found. Searched candidates {rel_candidates} "
        f"under roots {search_roots}"
    )
    return None


IRRIGATION_MODEL_PATH = _probe_model_path([
    "ml_model/saved_models/irrigation_model.pkl",
    "ml_model/saved_models/irrigation_model(1).pkl",
    "iot/ml_model/saved_models/irrigation_model.pkl",
    "iot/ml_model/saved_models/irrigation_model(1).pkl",
    "iot/ml_model/irrigation_model(1).pkl",
    "saved_models/irrigation_model.pkl",
])

WATER_REQUIREMENT_MODEL_PATH = _probe_model_path([
    "ml_model/saved_models/water_requirement_model.pkl",
    "iot/ml_model/saved_models/water_requirement_model.pkl",
    "iot/ml_model/water_requirement_model.pkl",
    "saved_models/water_requirement_model.pkl",
])

class IrrigationPredictor:
    def __init__(self):
        self.irrigation_model = None
        self.water_requirement_model = None
        
        # Load irrigation model
        try:
            if IRRIGATION_MODEL_PATH and os.path.exists(IRRIGATION_MODEL_PATH):
                self.irrigation_model = joblib.load(IRRIGATION_MODEL_PATH)
                logger.info(f"Irrigation model loaded successfully from {IRRIGATION_MODEL_PATH}")
            else:
                logger.warning("Irrigation model not loaded — falling back to rule-based decisions")
        except Exception as e:
            logger.error(f"Error loading irrigation model: {str(e)}")
        
        # Load water requirement model
        try:
            if WATER_REQUIREMENT_MODEL_PATH and os.path.exists(WATER_REQUIREMENT_MODEL_PATH):
                self.water_requirement_model = joblib.load(WATER_REQUIREMENT_MODEL_PATH)
                logger.info(f"Water requirement model loaded successfully from {WATER_REQUIREMENT_MODEL_PATH}")
            else:
                logger.warning("Water requirement model not loaded — will return zero estimates")
        except Exception as e:
            logger.error(f"Error loading water requirement model: {str(e)}")

    def _prepare_features(self, features: dict):
        """Map input features to model feature names"""
        expected_features = ['Soil_Type', 'Soil_Moisture', 'Temperature_C', 'Humidity', 
                           'Rainfall_mm', 'Wind_Speed_kmh', 'Sunlight_Hours', 'Crop_Type', 
                           'Crop_Growth_Stage', 'Season', 'NDVI', 'Previous_Irrigation_mm']
        
        mapped_features = {
            'Soil_Type': features.get('Soil_Type', features.get('soil_type', 1)),
            'Soil_Moisture': features.get('Soil_Moisture', features.get('soil_moisture', 40)),
            'Temperature_C': features.get('Temperature_C', features.get('temperature', 25)),
            'Humidity': features.get('Humidity', features.get('humidity', 60)),
            'Rainfall_mm': features.get('Rainfall_mm', features.get('rainfall_mm', 0)),
            'Wind_Speed_kmh': features.get('Wind_Speed_kmh', features.get('wind_speed_kmh', 10)),
            'Sunlight_Hours': features.get('Sunlight_Hours', features.get('sunlight_hours', 8)),
            'Crop_Type': features.get('Crop_Type', features.get('crop_type', 1)),
            'Crop_Growth_Stage': features.get('Crop_Growth_Stage', features.get('growth_stage', 1)),
            'Season': features.get('Season', features.get('season', 1)),
            'NDVI': features.get('NDVI', features.get('ndvi', 0.5)),
            'Previous_Irrigation_mm': features.get('Previous_Irrigation_mm', features.get('prev_irrigation_mm', 10))
        }
        
        return pd.DataFrame([mapped_features])[expected_features], mapped_features
    
    def _get_feature_analysis(self, mapped_features: dict) -> dict:
        """Analyze features to explain irrigation decision"""
        analysis = {
            "soil_moisture": {
                "value": mapped_features.get('Soil_Moisture', 40),
                "status": self._get_moisture_status(mapped_features.get('Soil_Moisture', 40)),
                "impact": "Critical factor - directly affects irrigation need"
            },
            "ndvi": {
                "value": mapped_features.get('NDVI', 0.5),
                "status": self._get_ndvi_status(mapped_features.get('NDVI', 0.5)),
                "impact": "Indicates crop health and water stress"
            },
            "temperature": {
                "value": mapped_features.get('Temperature_C', 25),
                "status": "High" if mapped_features.get('Temperature_C', 25) > 30 else "Moderate" if mapped_features.get('Temperature_C', 25) > 20 else "Low",
                "impact": "Affects evapotranspiration rate"
            },
            "rainfall": {
                "value": mapped_features.get('Rainfall_mm', 0),
                "status": "Significant" if mapped_features.get('Rainfall_mm', 0) > 5 else "Moderate" if mapped_features.get('Rainfall_mm', 0) > 2 else "Low",
                "impact": "Reduces irrigation requirement"
            },
            "humidity": {
                "value": mapped_features.get('Humidity', 60),
                "status": "High" if mapped_features.get('Humidity', 60) > 70 else "Moderate" if mapped_features.get('Humidity', 60) > 50 else "Low",
                "impact": "Affects evaporation rate"
            }
        }
        return analysis
    
    def _get_moisture_status(self, moisture: float) -> str:
        """Get status of soil moisture"""
        if moisture < 25:
            return "Critical - Immediate irrigation needed"
        elif moisture < 40:
            return "Low - Irrigation recommended"
        elif moisture < 60:
            return "Adequate - Monitor"
        else:
            return "High - No irrigation needed"
    
    def _get_ndvi_status(self, ndvi: float) -> str:
        """Get status of NDVI"""
        if ndvi < 0.3:
            return "Severe stress - Urgent attention needed"
        elif ndvi < 0.5:
            return "Moderate stress - Needs irrigation"
        elif ndvi < 0.7:
            return "Healthy - Normal management"
        else:
            return "Very healthy - Minimal stress"
    
    def predict_irrigation_need(self, features: dict):
        """Predict if irrigation is needed (0=No, 1=Yes)"""
        if not self.irrigation_model:
            logger.warning("Irrigation model not loaded, returning default")
            return {"prediction": "Unknown", "confidence": 0.0, "needs_irrigation": False}
        
        try:
            X, mapped_features = self._prepare_features(features)
            prediction = self.irrigation_model.predict(X)[0]
            probabilities = self.irrigation_model.predict_proba(X)[0]
            confidence = max(probabilities)
            
            # Map numeric prediction to human-readable format
            irrigation_label = "Yes" if prediction == 1 else "No"
            
            # Get feature analysis for explanation
            feature_analysis = self._get_feature_analysis(mapped_features)
            
            return {
                "prediction": irrigation_label,
                "needs_irrigation": bool(prediction),
                "confidence": float(confidence),
                "raw_prediction": int(prediction),
                "feature_analysis": feature_analysis
            }
        except Exception as e:
            logger.error(f"Error during irrigation prediction: {str(e)}")
            return {"prediction": "Unknown", "confidence": 0.0, "needs_irrigation": False}
    
    def predict_water_requirement(self, features: dict):
        """Predict water requirement in mm"""
        if not self.water_requirement_model:
            logger.warning("Water requirement model not loaded, returning default")
            return 0
        
        try:
            X, _ = self._prepare_features(features)
            water_requirement = self.water_requirement_model.predict(X)[0]
            return float(water_requirement)
        except Exception as e:
            logger.error(f"Error during water requirement prediction: {str(e)}")
            return 0
    
    def predict_with_satellite(self, sensor_features: dict, ndvi_value: float = None, health_status: str = None):
        """
        Enhanced prediction incorporating satellite data
        """
        # Get irrigation need prediction
        irrigation_result = self.predict_irrigation_need(sensor_features)
        needs_irrigation = irrigation_result.get("needs_irrigation", False)
        
        # Get water requirement prediction
        water_requirement = self.predict_water_requirement(sensor_features)
        
        # Adjust based on satellite data
        if ndvi_value is not None:
            if ndvi_value < 0.3:
                needs_irrigation = True
                water_requirement *= 1.2
            elif ndvi_value > 0.75:
                needs_irrigation = False
                water_requirement *= 0.8
        
        soil_moisture = sensor_features.get("soil_moisture", 40)
        
        if ndvi_value and ndvi_value < 0.4 and soil_moisture < 30:
            final_recommendation = "Critical - Immediate irrigation needed"
        elif ndvi_value and ndvi_value < 0.5 and soil_moisture < 40:
            final_recommendation = "High - Irrigation recommended"
        elif ndvi_value and ndvi_value >= 0.7 and soil_moisture >= 50:
            final_recommendation = "Low - No irrigation needed"
        else:
            final_recommendation = "Yes - Irrigation needed" if needs_irrigation else "No - No irrigation needed"
        
        return {
            "needs_irrigation": needs_irrigation,
            "water_requirement_mm": round(water_requirement, 2),
            "recommendation": final_recommendation,
            "ndvi_factor": "Considered" if ndvi_value else "Not available",
            "ndvi_value": ndvi_value,
            "soil_moisture": soil_moisture,
            "confidence": irrigation_result.get("confidence", 0)
        }

    def predict_from_farm_state(self, farm_state) -> dict:
        """
        Phase 5 — Multi-source fused prediction.
        Takes a fully assembled FarmState and applies the Decision Engine:
          1. ML model prediction on fused features
          2. Rain-delay override (high probability in near-term forecast)
          3. NDVI stress override (severe stress → force irrigate)
          4. Over-saturation safety check
        Returns a structured decision dict.
        """
        features = farm_state.to_ml_features()

        irrigation_result = self.predict_irrigation_need(features)
        water_mm = self.predict_water_requirement(features)
        needs_irrigation: bool = irrigation_result.get("needs_irrigation", False)
        confidence: float = irrigation_result.get("confidence", 0.5)

        # ── Rain-delay override ──────────────────────────────────────────────
        # If rain probability is high OR significant rain expected within 2 days,
        # delay irrigation to avoid waste.
        rain_delay = False
        rain_reason = ""
        if farm_state.rain_probability >= 65:
            rain_delay = True
            rain_reason = f"Rain probability is high ({farm_state.rain_probability:.0f}%) — delaying."
        elif any(r >= 8.0 for r in farm_state.forecast_rain_7d[:2]):
            rain_delay = True
            rain_reason = "Significant rain expected within 48 hours — delaying."

        # ── NDVI stress override ─────────────────────────────────────────────
        # Severe crop stress always overrides rain delay if soil is also dry.
        ndvi_force = False
        if farm_state.ndvi < 0.25 and farm_state.soil_moisture < farm_state.optimal_moisture:
            ndvi_force = True
            rain_delay = False          # critical stress outweighs rain delay

        # ── Over-saturation safety ───────────────────────────────────────────
        if farm_state.soil_moisture >= farm_state.optimal_moisture + 20:
            needs_irrigation = False
            water_mm = 0.0
            rain_delay = False

        # ── Apply overrides ──────────────────────────────────────────────────
        if rain_delay:
            final_decision = "delay"
            final_water_mm = 0.0
            recommendation = "Delay — " + rain_reason
        elif ndvi_force:
            final_decision = "irrigate"
            final_water_mm = round(water_mm * 1.2, 1)   # extra 20% for stress
            recommendation = f"Critical NDVI stress ({farm_state.ndvi:.2f}) — irrigate immediately."
        elif needs_irrigation:
            final_decision = "irrigate"
            final_water_mm = round(water_mm, 1)
            recommendation = f"Irrigation needed — apply {water_mm:.1f}mm."
        else:
            final_decision = "skip"
            final_water_mm = 0.0
            recommendation = "No irrigation needed — conditions adequate."

        logger.info(
            f"FusedPrediction: field={farm_state.field_id} "
            f"decision={final_decision} water={final_water_mm}mm "
            f"rain_delay={rain_delay} ndvi_force={ndvi_force}"
        )

        return {
            "decision": final_decision,
            "needs_irrigation": final_decision == "irrigate",
            "recommended_water_mm": final_water_mm,
            "recommendation": recommendation,
            "confidence": round(confidence, 3),
            "rain_delay": rain_delay,
            "ndvi_force_irrigate": ndvi_force,
            "ml_prediction": irrigation_result.get("prediction", "Unknown"),
            "ml_confidence": confidence,
            "water_stress_index": farm_state.water_stress_index,
            "sources_used": farm_state.sources_used,
        }

    def explain_prediction(self, features: dict) -> dict:
        """
        Phase 7 — XAI: Return feature importances ranked by contribution.
        Uses the RandomForest's feature_importances_ (model-global, not per-sample).
        Returns both machine-readable scores and a human-readable explanation.
        """
        FEATURE_LABELS = {
            "Soil_Moisture": "Soil moisture",
            "NDVI": "Crop health (NDVI)",
            "Temperature_C": "Temperature",
            "Rainfall_mm": "Rainfall",
            "Humidity": "Humidity",
            "Wind_Speed_kmh": "Wind speed",
            "Previous_Irrigation_mm": "Previous irrigation",
            "Crop_Growth_Stage": "Crop growth stage",
            "Crop_Type": "Crop type",
            "Soil_Type": "Soil type",
            "Sunlight_Hours": "Sunlight hours",
            "Season": "Season",
        }

        if not self.irrigation_model:
            # Rule-based fallback when model isn't loaded
            moisture = features.get("soil_moisture", 40)
            ndvi = features.get("ndvi", 0.5)
            temp = features.get("temperature", 25)
            rain = features.get("rainfall_mm", 0)

            contributions = [
                {"feature": "Soil moisture", "importance": 0.40, "value": f"{moisture}%",
                 "direction": "increases" if moisture < 40 else "reduces"},
                {"feature": "Crop health (NDVI)", "importance": 0.26, "value": str(ndvi),
                 "direction": "increases" if ndvi < 0.5 else "reduces"},
                {"feature": "Temperature", "importance": 0.18, "value": f"{temp}°C",
                 "direction": "increases" if temp > 30 else "neutral"},
                {"feature": "Rainfall", "importance": 0.11, "value": f"{rain}mm",
                 "direction": "reduces" if rain > 2 else "neutral"},
                {"feature": "Humidity", "importance": 0.05, "value": f"{features.get('humidity', 60)}%",
                 "direction": "neutral"},
            ]
            top2 = contributions[:2]
            human = (
                f"Irrigation need driven mainly by {top2[0]['feature'].lower()} "
                f"({top2[0]['value']}) and {top2[1]['feature'].lower()} ({top2[1]['value']})."
            )
            return {
                "method": "rule_based_fallback",
                "contributions": contributions,
                "human_explanation": human,
            }

        try:
            X, mapped = self._prepare_features(features)
            importances = self.irrigation_model.feature_importances_
            feature_names = list(X.columns)

            # Pair names with importances, sort descending
            pairs = sorted(
                zip(feature_names, importances), key=lambda x: x[1], reverse=True
            )

            # Map current feature values for readable output
            value_map = {k: mapped.get(k, "N/A") for k in feature_names}

            contributions = []
            for fname, imp in pairs:
                val = value_map.get(fname, "N/A")
                label = FEATURE_LABELS.get(fname, fname)
                # Determine direction heuristic
                if fname == "Soil_Moisture":
                    direction = "increases need" if val < 40 else "reduces need"
                elif fname == "NDVI":
                    direction = "increases need" if val < 0.5 else "reduces need"
                elif fname == "Rainfall_mm":
                    direction = "reduces need" if val > 2 else "neutral"
                elif fname == "Temperature_C":
                    direction = "increases need" if val > 30 else "neutral"
                else:
                    direction = "contributing factor"

                contributions.append({
                    "feature": label,
                    "importance": round(float(imp), 4),
                    "value": val if isinstance(val, str) else round(float(val), 2),
                    "direction": direction,
                })

            # Human-readable summary from top 2 factors
            top = contributions[:2]
            human = (
                f"The main drivers were {top[0]['feature'].lower()} "
                f"({top[0]['value']}, {top[0]['direction']}) and "
                f"{top[1]['feature'].lower()} ({top[1]['value']}, {top[1]['direction']})."
            )

            return {
                "method": "random_forest_feature_importance",
                "contributions": contributions,
                "human_explanation": human,
            }

        except Exception as e:
            logger.error(f"Error in explain_prediction: {e}")
            return {
                "method": "error",
                "contributions": [],
                "human_explanation": "Explanation unavailable.",
            }

predictor = IrrigationPredictor()
