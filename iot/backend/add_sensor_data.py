import sqlite3
import datetime

# Connect to the database
conn = sqlite3.connect('irrigation.db')
cursor = conn.cursor()

# Add sensor data for field_id 1 (assuming it exists)
cursor.execute("""
    INSERT INTO sensor_data (field_id, soil_moisture, temperature, humidity, flow_rate, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
""", (1, 42.0, 31.0, 65.0, 12.5, datetime.datetime.now()))

conn.commit()
conn.close()

print("Sensor data added successfully!")
