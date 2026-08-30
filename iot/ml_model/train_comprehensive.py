import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib
import os

def generate_synthetic_data(samples=2000):
    np.random.seed(42)
    
    # Generate data using the feature names expected by prediction.py
    soil_type = np.random.randint(0, 3, samples) # 0: Sandy, 1: Loamy, 2: Clay
    soil_moisture = np.random.uniform(10, 80, samples)
    temp = np.random.uniform(15, 45, samples)
    humidity = np.random.uniform(20, 90, samples)
    rainfall = np.random.uniform(0, 20, samples)
    wind_speed = np.random.uniform(5, 30, samples)
    sunlight = np.random.uniform(4, 12, samples)
    crop_type = np.random.randint(0, 5, samples) # 0: Rice, 1: Wheat, 2: Maize, 3: Cotton, 4: Pulse
    growth_stage = np.random.randint(0, 3, samples) # 0: Initial, 1: Development, 2: Mid/Late
    season = np.random.randint(0, 2, samples) # 0: Kharif, 1: Rabi
    ndvi = np.random.uniform(0.1, 0.9, samples)
    prev_irrigation = np.random.uniform(0, 50, samples)
    
    data = pd.DataFrame({
        'Soil_Type': soil_type,
        'Soil_Moisture': soil_moisture,
        'Temperature_C': temp,
        'Humidity': humidity,
        'Rainfall_mm': rainfall,
        'Wind_Speed_kmh': wind_speed,
        'Sunlight_Hours': sunlight,
        'Crop_Type': crop_type,
        'Crop_Growth_Stage': growth_stage,
        'Season': season,
        'NDVI': ndvi,
        'Previous_Irrigation_mm': prev_irrigation
    })
    
    # Target 1: Irrigation Need (0/1)
    # Higher score means more need
    score = (100 - soil_moisture) * 0.4 + temp * 0.2 + sunlight * 0.1 + wind_speed * 0.05 - rainfall * 0.5 - ndvi * 10 - prev_irrigation * 0.1
    data['Irrigation_Needed'] = (score > 35).astype(int)
    
    # Target 2: Water Requirement (mm)
    # Proportional to need but clipped
    data['Water_Requirement'] = np.where(data['Irrigation_Needed'] == 1, 
                                        np.clip(score * 0.5, 5, 50), 
                                        0)
    
    return data

def train_and_save():
    df = generate_synthetic_data(5000)
    
    X = df.drop(['Irrigation_Needed', 'Water_Requirement'], axis=1)
    y_class = df['Irrigation_Needed']
    y_reg = df['Water_Requirement']
    
    # Train Classifier
    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(X, y_class, test_size=0.2, random_state=42)
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train_c, y_train_c)
    
    # Train Regressor
    X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(X, y_reg, test_size=0.2, random_state=42)
    reg = RandomForestRegressor(n_estimators=100, random_state=42)
    reg.fit(X_train_r, y_train_r)
    
    # Save models
    save_dir = 'd:/iot/iot-day2/iot/iot/ml_model/saved_models'
    os.makedirs(save_dir, exist_ok=True)
    
    joblib.dump(clf, os.path.join(save_dir, 'irrigation_model.pkl'))
    joblib.dump(reg, os.path.join(save_dir, 'water_requirement_model.pkl'))
    
    print(f"Models trained and saved in {save_dir}")
    print(f"Classifier accuracy: {clf.score(X_test_c, y_test_c):.2f}")
    print(f"Regressor R2: {reg.score(X_test_r, y_test_r):.2f}")

if __name__ == "__main__":
    train_and_save()
