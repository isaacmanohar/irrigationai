import sqlite3
import os

db_path = r'd:\iot\iot-day2\iot\iot\backend\irrigation.db'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

numbers_to_purge = [
    '8639975947', 
    '9502042442',
    '919502042442',
    '8639975947',
    '8639975947',
]

for num in numbers_to_purge:
    print(f"\nSearching for {num}...")
    cursor.execute("SELECT id, name, phone_number FROM farmers WHERE phone_number LIKE ?", (f'%{num}%',))
    farmers = cursor.fetchall()
    
    if not farmers:
        print(f"No farmer found with number containing {num}")
        continue
        
    for f_id, f_name, f_phone in farmers:
        print(f"Found Farmer ID: {f_id}, Name: {f_name}, Phone: {f_phone}")
        
        # Check fields
        cursor.execute("SELECT id FROM fields WHERE farmer_id = ?", (f_id,))
        fields = cursor.fetchall()
        field_ids = [field[0] for field in fields]
        print(f"  Associated fields: {field_ids}")
        
        for field_id in field_ids:
            # Check sensor_data
            cursor.execute("SELECT COUNT(*) FROM sensor_data WHERE field_id = ?", (field_id,))
            s_count = cursor.fetchone()[0]
            print(f"    - Field {field_id} has {s_count} sensor_data records")
            
            # Check satellite_data
            cursor.execute("SELECT COUNT(*) FROM satellite_data WHERE field_id = ?", (field_id,))
            sat_count = cursor.fetchone()[0]
            print(f"    - Field {field_id} has {sat_count} satellite_data records")
            
            # Check irrigation_history
            cursor.execute("SELECT COUNT(*) FROM irrigation_history WHERE field_id = ?", (field_id,))
            h_count = cursor.fetchone()[0]
            print(f"    - Field {field_id} has {h_count} history records")

conn.close()
