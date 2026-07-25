from pydantic import BaseModel, EmailStr
from datetime import datetime


# Used when a new user signs up
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


# Used when a user logs in
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Used when sending user details back
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True