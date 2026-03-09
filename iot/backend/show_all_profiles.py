import sqlite3

def show_detailed_profiles():
    conn = sqlite3.connect("irrigation.db")
    cursor = conn.cursor()
    
    # 1. Get all farmers
    cursor.execute("SELECT id, name, email, phone_number, village, preferred_language, created_at FROM farmers")
    farmers = cursor.fetchall()
    
    if not farmers:
        print("No registered farmers found.")
        return

    print("\n" + "="*80)
    print(f"{'ID':<4} | {'NAME':<15} | {'PHONE':<15} | {'VILLAGE':<10} | {'LANGUAGE':<10}")
    print("-" * 80)

    for f in farmers:
        f_id, name, email, phone, village, lang, created = f
        print(f"{f_id:<4} | {name:<15} | {phone:<15} | {village:<10} | {lang:<10}")
        
        # 2. Get associated field data
        cursor.execute("SELECT crop_type, field_area, growth_stage, season FROM fields WHERE farmer_id = ?", (f_id,))
        field = cursor.fetchone()
        if field:
            print(f"      ↳ [Field] Crop: {field[0]} | Area: {field[1]}ha | Stage: {field[2]} | Season: {field[3]}")
        else:
            print("      ↳ [Field] No field data found.")
        print("-" * 80)

    conn.close()

if __name__ == "__main__":
    show_detailed_profiles()
