from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import SessionLocal, Base
from sqlalchemy import Column, Integer, String

router = APIRouter(tags=["primary"])  # ❌ убрал prefix

class Primary(Base):
    __tablename__ = "primary"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=list[dict])   # /api/primary
@router.get("/", response_model=list[dict])  # /api/primary/
def get_all(db: Session = Depends(get_db)):
    rows = db.query(Primary).all()
    return [{"id": r.id, "name": r.name} for r in rows]

