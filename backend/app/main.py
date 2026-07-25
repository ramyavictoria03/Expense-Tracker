from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import engine, Base
from app.models.transaction import Transaction
from app.routers.transaction_router import router as transaction_router
from app.routers.auth import router as auth_router

app = FastAPI(
    title="Expense Tracker API",
    description="Backend API for Smart Expense Tracker",
    version="1.0.0"
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:58049",
        "http://localhost:58049",
        "http://127.0.0.1:65048",
        "http://localhost:65048",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Register routers
app.include_router(transaction_router)
app.include_router(auth_router)

@app.get("/")
def home():
    return {
        "message": "Welcome to Expense Tracker API 🚀"
    }