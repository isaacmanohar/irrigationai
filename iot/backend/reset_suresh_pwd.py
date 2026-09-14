from app.db.session import SessionLocal
from app.models.database import Farmer
from app.core.auth import get_password_hash

def reset_password(phone, new_password):
    db = SessionLocal()
    try:
        farmer = db.query(Farmer).filter(Farmer.phone_number.like(f"%{phone}%")).first()
        if farmer:
            farmer.hashed_password = get_password_hash(new_password)
            db.commit()
            print(f"Password reset for {farmer.name} ({farmer.phone_number}) to: {new_password}")
        else:
            print(f"Farmer with phone ending in {phone} not found.")
    finally:
        db.close()

if __name__ == "__main__":
    reset_password("8639975947", "123456")
