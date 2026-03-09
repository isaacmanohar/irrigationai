import sqlite3
import os

db_path = r'd:\iot\iot-day2\iot\iot\backend\irrigation.db'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name, phone FROM farmers LIMIT 10")
        rows = cursor.fetchall()
        for row in rows:
            print(f"Farmer: {row[0]}, Phone: {row[1]}")
    except Exception as e:
        print(f"Error querying table: {e}")
    finally:
        conn.close()
