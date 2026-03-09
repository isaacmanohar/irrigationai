import sqlite3
import os

db_path = r'd:\iot\iot-day2\iot\iot\backend\irrigation.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name, phone_number FROM farmers")
    rows = cursor.fetchall()
    for row in rows:
        print(f"Farmer: {row[0]}, Phone: {row[1]}")
    conn.close()
else:
    print("Database not found.")
