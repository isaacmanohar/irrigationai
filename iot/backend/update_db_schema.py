import sqlite3

db_path = "d:/iot/iot-day2/iot/iot/backend/irrigation.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

columns_to_add = [
    ("water_consumed", "FLOAT DEFAULT 0.0"),
    ("is_pump_on", "BOOLEAN"),
    ("battery_voltage", "FLOAT"),
    ("nitrogen", "FLOAT"),
    ("phosphorus", "FLOAT"),
    ("potassium", "FLOAT"),
    ("water_level", "FLOAT"),
    ("extra_data", "TEXT")
]

for col_name, col_type in columns_to_add:
    try:
        cursor.execute(f"ALTER TABLE sensor_data ADD COLUMN {col_name} {col_type}")
        print(f"Added column {col_name}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print(f"Column {col_name} already exists")
        else:
            print(f"Error adding column {col_name}: {e}")

conn.commit()
conn.close()
print("Database schema update complete.")
