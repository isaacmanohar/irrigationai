import sqlite3
import os

db_path = r'd:\iot\iot-day2\iot\iot\backend\irrigation.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, farmer_id, crop_type FROM fields WHERE farmer_id = 5")
    row = cursor.fetchone()
    if row:
        print(f"Field ID: {row[0]}, Farmer ID: {row[1]}, Crop: {row[2]}")
        # Get sensor data
        cursor.execute("SELECT soil_moisture, temperature FROM sensor_data WHERE field_id = ? ORDER BY timestamp DESC LIMIT 1", (row[0],))
        sensor = cursor.fetchone()
        if sensor:
            print(f"Soil Moisture: {sensor[0]}%, Temp: {sensor[1]}C")
        else:
            print("No sensor data found.")
    else:
        print("No field found for farmer 5.")
    conn.close()
