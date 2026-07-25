from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from app.database.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(String(255))
    amount = Column(Float, nullable=False)
    type = Column(String(20), nullable=False)
    category = Column(String(50), nullable=False)
    payment_method = Column(String(50), nullable=False)
    date = Column(Date, nullable=False)
    notes = Column(String(255))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)