import joblib
import pandas as pd
import os
import logging

logger = logging.getLogger(__name__)

MODEL_PATH = 'd:/iot/ml_model/saved_models/irrigation_model.pkl'

class IrrigationPredictor:
    def __init__(self):
        self.model = None
        try:
            if os.path.exists(MODEL_PATH):
                self.model = joblib.load(MODEL_PATH)
            else:
                logger.warning(f"Predictor: Model file not found at {MODEL_PATH}")
        except Exception as e:
            logger.error(f"Predictor: Error loading model: {str(e)}")

    def predict_irrigation_need(self, features: dict):
        if not self.model:
            # Fallback for now if model is not loaded
            return "Medium"
        
        try:
            # Prepare data with proper feature names (matching training script)
            X = pd.DataFrame([features])
            prediction = self.model.predict(X)[0]
            confidence = self.model.predict_proba(X)
            return prediction
        except Exception as e:
            logger.error(f"Predictor: Error during prediction: {str(e)}")
            return "Medium"
    
    def predict_with_satellite(self, sensor_features: dict, ndvi_value: float = None, health_status: str = None):
        """
        Enhanced prediction incorporating satellite data
        
        Args:
            sensor_features: Dictionary with soil_moisture, temperature, humidity
            ndvi_value: NDVI value from satellite (0-1)
            health_status: Crop health status (Poor, Moderate, Healthy)
            
        Returns:
            Irrigation recommendation with confidence
        """
        # Base prediction from sensors
        base_prediction = self.predict_irrigation_need(sensor_features)
        
        # Adjust based on satellite data
        if ndvi_value is not None:
            # If NDVI is very low, increase irrigation urgency
            if ndvi_value < 0.3:
                # Crop stress detected
                if base_prediction == "Low":
                    base_prediction = "Medium"
                elif base_prediction == "Medium":
                    base_prediction = "High"
            elif ndvi_value > 0.75:
                # Healthy crop, may reduce irrigation
                if base_prediction == "High":
                    base_prediction = "Medium"
        
        # Combine with soil moisture for final decision
        soil_moisture = sensor_features.get("soil_moisture", 40)
        
        if ndvi_value and ndvi_value < 0.4 and soil_moisture < 30:
            final_recommendation = "Critical - Immediate irrigation needed"
        elif ndvi_value and ndvi_value < 0.5 and soil_moisture < 40:
            final_recommendation = "High - Irrigation recommended"
        elif ndvi_value and ndvi_value >= 0.7 and soil_moisture >= 50:
            final_recommendation = "Low - No irrigation needed"
        else:
            final_recommendation = base_prediction
        
        return {
            "recommendation": final_recommendation,
            "base_prediction": base_prediction,
            "ndvi_factor": "Considered" if ndvi_value else "Not available",
            "confidence": "High" if ndvi_value else "Medium"
        }

predictor = IrrigationPredictor()
