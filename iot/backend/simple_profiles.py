import sqlite3

def simple_profiles():
    conn = sqlite3.connect("irrigation.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, phone_number, village FROM farmers")
    farmers = cursor.fetchall()
    for f in farmers:
        print(f"Farmer: {f}")
        cursor.execute("SELECT crop_type, field_area FROM fields WHERE farmer_id = ?", (f[0],))
        field = cursor.fetchone()
        print(f"  Field: {field}")
    conn.close()

simple_profiles()
