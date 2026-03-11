import sqlite3

def check_user():
    conn = sqlite3.connect('irrigation.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, phone_number, latitude, longitude FROM farmers")
    users = cursor.fetchall()
    for u in users:
        print(f"ID={u[0]}, Name={u[1]}, Phone={u[2]}, Lat={u[3]}, Lon={u[4]}")
    conn.close()

if __name__ == "__main__":
    check_user()
