from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings
from pathlib import Path

settings = get_settings()

database_url = settings.database_url
if database_url.startswith("sqlite:///./"):
    db_name = database_url.replace("sqlite:///./", "", 1)
    database_url = f"sqlite:///{Path(__file__).resolve().parents[1] / db_name}"

connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
engine = create_engine(database_url, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
