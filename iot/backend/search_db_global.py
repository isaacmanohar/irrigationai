import sqlite3

db_path = r'd:\iot\iot-day2\iot\iot\backend\irrigation.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

found = False
for (table_name,) in tables:
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [col[1] for col in cursor.fetchall()]
    
    for col in columns:
        try:
            cursor.execute(f"SELECT * FROM {table_name} WHERE CAST({col} AS TEXT) LIKE '%suresh%'")
            results = cursor.fetchall()
            if results:
                print(f"Match found in table '{table_name}', column '{col}':")
                for row in results:
                    print(row)
                found = True
        except Exception as e:
            # print(f"Error searching {table_name}.{col}: {e}")
            pass

if not found:
    print("No matches for 'suresh' found in the entire database.")

conn.close()
