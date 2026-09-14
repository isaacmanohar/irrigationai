import sqlite3
import os

db_path = "d:/iot/iot-day2/iot/iot/backend/irrigation.db"
if not os.path.exists(db_path):
    print(f"Error: Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Checking for Farmer with ID 7 ---")
cursor.execute("SELECT id, name, phone_number, village FROM farmers WHERE id = 7")
farmer = cursor.fetchone()

if farmer:
    print(f"✅ Found Farmer: ID={farmer[0]}, Name={farmer[1]}, Phone={farmer[2]}, Village={farmer[3]}")
    
    print("\n--- Checking associated Fields ---")
    cursor.execute("SELECT id, crop_type, farm_name FROM fields WHERE farmer_id = 7")
    fields = cursor.fetchall()
    if fields:
        for f in fields:
            print(f"  - Field: ID={f[0]}, Crop={f[1]}, Name={f[2]}")
    else:
        print("  - No fields found for this farmer.")
else:
    print("❌ No farmer found with ID 7.")
    
    print("\n--- Recent Farmers (Last 5) ---")
    cursor.execute("SELECT id, name, created_at FROM farmers ORDER BY id DESC LIMIT 5")
    for row in cursor.fetchall():
        print(f"  ID={row[0]}, Name={row[1]}, Created={row[2]}")

conn.close()
