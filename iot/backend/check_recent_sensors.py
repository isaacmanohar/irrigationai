import sqlite3
import datetime

db_path = "d:/iot/iot-day2/iot/iot/backend/irrigation.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Checking Recent Sensor Data ---")
cursor.execute("""
    SELECT s.id, s.field_id, s.soil_moisture, s.temperature, s.timestamp, f.farm_name 
    FROM sensor_data s 
    LEFT JOIN fields f ON s.field_id = f.id 
    ORDER BY s.timestamp DESC LIMIT 10
""")
rows = cursor.fetchall()

if rows:
    for row in rows:
        print(f"ID={row[0]}, Field={row[1]} ({row[5]}), Moisture={row[2]}, Temp={row[3]}, Time={row[4]}")
else:
    print("No sensor data found in database.")

conn.close()
