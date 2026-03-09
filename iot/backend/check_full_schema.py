import sqlite3

def check_schema():
    conn = sqlite3.connect("irrigation.db")
    cursor = conn.cursor()
    
    tables = ["farmers", "fields", "sensor_data", "satellite_data", "irrigation_logs"]
    
    for table in tables:
        print(f"\nTable: {table}")
        try:
            cursor.execute(f"PRAGMA table_info({table})")
            for col in cursor.fetchall():
                print(f"  {col[1]} ({col[2]})")
        except:
            print("  Table does not exist")
            
    conn.close()

if __name__ == "__main__":
    check_schema()
