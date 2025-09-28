from sqlalchemy import Column, Integer, String
from ..db import Base

class Primary(Base):
    __tablename__ = "primary"   # имя таблицы

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
