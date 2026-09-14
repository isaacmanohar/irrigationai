from sqlalchemy import create_engine, text
DB_URL = "sqlite:///d:/iot/iot-day2/iot/iot/backend/irrigation.db"
engine = create_engine(DB_URL)
with engine.connect() as conn:
    result = conn.execute(text("SELECT name FROM farmers LIMIT 1"))
    print(result.fetchone())
