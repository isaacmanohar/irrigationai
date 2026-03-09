import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

def generate_synthetic_data(samples=1000):
    np.random.seed(42)
    
    # Soil Moisture (0-100)
    soil_moisture = np.random.uniform(10, 80, samples)
    # Temp (15-45)
    temp = np.random.uniform(15, 45, samples)
    # Humidity (20-90)
    humidity = np.random.uniform(20, 90, samples)
    # Rainfall (0-20)
    rainfall = np.random.uniform(0, 20, samples)
    # Sunlight hours (4-12)
    sunlight = np.random.uniform(4, 12, samples)
    # Wind speed (5-30)
    wind_speed = np.random.uniform(5, 30, samples)
    # Crop Type (encoded)
    crop_type = np.random.randint(0, 5, samples) # 0: Rice, 1: Wheat, 2: Maize, 3: Cotton, 4: Pulse
    # Growth Stage (encoded)
    growth_stage = np.random.randint(0, 3, samples) # 0: Initial, 1: Development, 2: Mid/Late
    # Field Area (0.5 - 5 hectares)
    area = np.random.uniform(0.5, 5, samples)
    # Previous Irrigation (0-50mm)
    prev_irrigation = np.random.uniform(0, 50, samples)
    
    data = pd.DataFrame({
        'soil_moisture': soil_moisture,
        'temperature': temp,
        'humidity': humidity,
        'rainfall_mm': rainfall,
        'sunlight_hours': sunlight,
        'wind_speed_kmh': wind_speed,
        'crop_type': crop_type,
        'growth_stage': growth_stage,
        'field_area_hectare': area,
        'prev_irrigation_mm': prev_irrigation
    })
    
    # Simple logic for target
    # Higher soil moisture -> Lower irrigation
    # Higher temp/sunlight/wind -> Higher irrigation
    # Higher rainfall -> Lower irrigation
    score = (100 - soil_moisture) * 0.4 + temp * 0.2 + sunlight * 0.1 + wind_speed * 0.05 - rainfall * 0.5 - prev_irrigation * 0.1
    
    def classify(s):
        if s < 25: return 'Low'
        elif s < 45: return 'Medium'
        else: return 'High'
        
    data['irrigation_need'] = [classify(s) for s in score]
    return data

def train_and_save():
    df = generate_synthetic_data(2000)
    X = df.drop('irrigation_need', axis=1)
    y = df['irrigation_need']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Ensure the model directory exists
    os.makedirs('d:/iot/ml_model/saved_models', exist_ok=True)
    joblib.dump(model, 'd:/iot/ml_model/saved_models/irrigation_model.pkl')
    print("Model trained and saved successfully.")

if __name__ == "__main__":
    train_and_save()
