import sqlite3
import os

db_path = r'd:\iot\iot-day2\iot\iot\backend\irrigation.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT id, name, phone_number FROM farmers")
farmers = cursor.fetchall()
for f in farmers:
    print(f)

conn.close()
