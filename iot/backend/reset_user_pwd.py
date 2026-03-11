import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_password():
    conn = sqlite3.connect('irrigation.db')
    cursor = conn.cursor()
    
    password = "admin" # Setting a default searchable password
    hashed = pwd_context.hash(password)
    
    cursor.execute("UPDATE farmers SET hashed_password = ? WHERE phone_number LIKE '%8639975947%'", (hashed,))
    conn.commit()
    
    if cursor.rowcount > 0:
        print(f"Password reset to '{password}' for user with number 8639975947")
    else:
        print("No user found with that number to reset.")
    
    conn.close()

if __name__ == "__main__":
    reset_password()
