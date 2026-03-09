import sqlite3

def find_and_delete(phone_query):
    conn = sqlite3.connect("irrigation.db")
    cursor = conn.cursor()
    
    # 1. Find the farmer ID(s)
    cursor.execute("SELECT id, name, phone_number FROM farmers WHERE phone_number LIKE ?", (f"%{phone_query}%",))
    matching_farmers = cursor.fetchall()
    
    if not matching_farmers:
        print(f"No farmers found matching query: {phone_query}")
        return

    for farmer_id, name, phone in matching_farmers:
        print(f"\nProcessing deletion for: {name} (ID: {farmer_id}, Phone: {phone})")
        
        # 2. Get the field IDs for this farmer
        cursor.execute("SELECT id FROM fields WHERE farmer_id = ?", (farmer_id,))
        field_ids = [row[0] for row in cursor.fetchall()]
        
        # 3. Delete data related to those fields
        for f_id in field_ids:
            print(f"  Cleaning up field {f_id}...")
            cursor.execute("DELETE FROM sensor_data WHERE field_id = ?", (f_id,))
            cursor.execute("DELETE FROM satellite_data WHERE field_id = ?", (f_id,))
        
        # 4. Delete the fields themselves
        cursor.execute("DELETE FROM fields WHERE farmer_id = ?", (farmer_id,))
        
        # 5. Delete irrigation logs (if table exists)
        try:
            cursor.execute("DELETE FROM irrigation_logs WHERE farmer_id = ?", (farmer_id,))
        except Exception as e:
            # Table might not exist or have different structure
            pass
            
        # 6. Finally delete the farmer profile
        cursor.execute("DELETE FROM farmers WHERE id = ?", (farmer_id,))
        print(f"✓ Successfully deleted profile and all associated data for {name}.")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    # User's exact request: 86939975947
    # Previous search showed: 8639975947
    # Using the overlapping digits to catch both/either
    target = "975947"
    find_and_delete(target)
