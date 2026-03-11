import sqlite3
import os

db_path = r'd:\iot\iot-day2\iot\iot\backend\irrigation.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT id, name, email, phone_number FROM farmers")
rows = cursor.fetchall()

print(f"Total users: {len(rows)}")
for row in rows:
    print(f"ID: {row[0]}, Name: {row[1]}, Email: {row[2]}, Phone: {row[3]}")

conn.close()
