from fastapi import APIRouter, Depends,HTTPException
from sqlalchemy.orm import Session

from app.database.dependencies import get_db, get_current_user
from app.schemas.transaction_schema import (
    TransactionCreate,
    TransactionResponse
    
)
from app.services.transaction_service import (
    create_transaction,
    get_all_transactions,
    update_transaction,
    delete_transaction
)

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"]
)


@router.post("/", response_model=TransactionResponse)
def add_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return create_transaction(db, transaction, current_user)

@router.get("/", response_model=list[TransactionResponse])
def read_transactions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return get_all_transactions(db, current_user)
@router.put("/{transaction_id}", response_model=TransactionResponse)
def edit_transaction(
    transaction_id: int,
    transaction: TransactionCreate,
    db: Session = Depends(get_db)
):
    updated_transaction = update_transaction(
        db,
        transaction_id,
        transaction
    )

    if updated_transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    return updated_transaction
@router.delete("/{transaction_id}")
def remove_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    deleted = delete_transaction(db, transaction_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    return {
        "message": "Transaction deleted successfully"
    }