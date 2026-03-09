import sqlite3
import os

db_path = r'd:\iot\iot-day2\iot\iot\backend\irrigation.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name, preferred_language FROM farmers WHERE id = 5")
    row = cursor.fetchone()
    if row:
        print(f"Name: {row[0]}, Lang: {row[1]}")
    conn.close()
