from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os


# Database URL - fallback to sqlite for local dev
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./irrigation.db")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from ..models.database import Base
    Base.metadata.create_all(bind=engine)
