import sqlite3
import os

db_path = r'd:\iot\iot-day2\iot\iot\backend\irrigation.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, phone_number FROM farmers")
    rows = cursor.fetchall()
    for row in rows:
        print(f"ID: {row[0]}, Name: {row[1]}, Phone: {row[2]}")
    conn.close()
else:
    print("Database not found.")
