from pydantic import BaseModel
from datetime import date
from typing import Optional


# Used when creating a new transaction
class TransactionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    amount: float
    type: str
    category: str
    payment_method: str
    date: date
    notes: Optional[str] = None


# Used when updating a transaction
class TransactionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None
    date: Optional[date] = None
    notes: Optional[str] = None


# Used when sending data back to the frontend
class TransactionResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    amount: float
    type: str
    category: str
    payment_method: str
    date: date
    notes: Optional[str]

    class Config:
        from_attributes = True