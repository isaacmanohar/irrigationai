import sqlite3

def cleanup():
    conn = sqlite3.connect("irrigation.db")
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    print(f"Found tables: {tables}")
    
    for table in tables:
        if table != "sqlite_sequence":
            print(f"Clearing table: {table}")
            try:
                cursor.execute(f"DELETE FROM {table}")
            except Exception as e:
                print(f"Error clearing {table}: {e}")
                
    conn.commit()
    conn.close()
    print("Cleanup complete.")

if __name__ == "__main__":
    cleanup()
