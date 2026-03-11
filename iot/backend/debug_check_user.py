import sqlite3

def check_users():
    conn = sqlite3.connect('irrigation.db')
    cursor = conn.cursor()
    
    # Check for any variation of the number
    cursor.execute("SELECT id, name, phone_number FROM farmers WHERE phone_number LIKE '%8639975947%'")
    rows = cursor.fetchall()
    
    if not rows:
        print("No users found with number 8639975947")
    else:
        for row in rows:
            print(f"Found user: ID={row[0]}, Name={row[1]}, Phone={row[2]}")
    
    conn.close()

if __name__ == "__main__":
    check_users()
