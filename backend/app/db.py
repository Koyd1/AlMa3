"""Database utilities and session factory placeholder."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()  # загружаем .env

DATABASE_URL = os.getenv("VITE_DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL is not set. Check your .env file.")

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()