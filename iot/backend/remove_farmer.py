
import sqlite3
import os

db_path = r'd:\iot\iot-day2\iot\iot\backend\irrigation.db'

def remove_farmer(phone_suffix):
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Find the farmer ID first
        cursor.execute("SELECT id, name FROM farmers WHERE phone_number LIKE ?", (f"%{phone_suffix}%",))
        farmers_to_delete = cursor.fetchall()
        
        if not farmers_to_delete:
            print(f"No farmer found with phone number containing '{phone_suffix}'")
            return
            
        for farmer_id, name in farmers_to_delete:
            print(f"Removing farmer: {name} (ID: {farmer_id})")
            
            # Cascade delete related entries manually if needed (depending on schema foreign keys)
            cursor.execute("DELETE FROM sensor_data WHERE field_id IN (SELECT id FROM fields WHERE farmer_id = ?)", (farmer_id,))
            cursor.execute("DELETE FROM satellite_data WHERE field_id IN (SELECT id FROM fields WHERE farmer_id = ?)", (farmer_id,))
            cursor.execute("DELETE FROM irrigation_history WHERE field_id IN (SELECT id FROM fields WHERE farmer_id = ?)", (farmer_id,))
            cursor.execute("DELETE FROM fields WHERE farmer_id = ?", (farmer_id,))
            cursor.execute("DELETE FROM devices WHERE user_id = ?", (farmer_id,))
            cursor.execute("DELETE FROM user_settings WHERE user_id = ?", (farmer_id,))
            cursor.execute("DELETE FROM farmers WHERE id = ?", (farmer_id,))
            
        conn.commit()
        print(f"Successfully removed {len(farmers_to_delete)} farmer(s).")
    except Exception as e:
        conn.rollback()
        print(f"Error during removal: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    remove_farmer("8639975947")
