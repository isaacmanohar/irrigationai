import sqlite3
import os

db_path = r'd:\iot\iot-day2\iot\iot\backend\irrigation.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT id, name, phone_number FROM farmers WHERE name LIKE '%suresh%'")
rows = cursor.fetchall()

if rows:
    print(f"Found {len(rows)} users matching 'suresh':")
    for row in rows:
        print(f"ID: {row[0]}, Name: {row[1]}, Phone: {row[2]}")
else:
    print("No user found with name 'suresh'.")

conn.close()
