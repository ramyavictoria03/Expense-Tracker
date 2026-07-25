from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.schemas.transaction_schema import TransactionCreate


def create_transaction(db: Session, transaction: TransactionCreate, current_user):
    new_transaction = Transaction(
        title=transaction.title,
        description=transaction.description,
        amount=transaction.amount,
        type=transaction.type,
        category=transaction.category,
        payment_method=transaction.payment_method,
        date=transaction.date,
        notes=transaction.notes,
        user_id=current_user["id"]
    )

    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return new_transaction
def get_all_transactions(db: Session, current_user):
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user["id"])
        .all()
    )

    return transactions

def update_transaction(db: Session, transaction_id: int, transaction: TransactionCreate):
    existing_transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id)
        .first()
    )

    if not existing_transaction:
        return None

    existing_transaction.title = transaction.title
    existing_transaction.description = transaction.description
    existing_transaction.amount = transaction.amount
    existing_transaction.type = transaction.type
    existing_transaction.category = transaction.category
    existing_transaction.payment_method = transaction.payment_method
    existing_transaction.date = transaction.date
    existing_transaction.notes = transaction.notes

    db.commit()
    db.refresh(existing_transaction)

    return existing_transaction
def delete_transaction(db: Session, transaction_id: int):
    transaction = (
        db.query(Transaction)
        .filter(Transaction.id == transaction_id)
        .first()
    )

    if not transaction:
        return False

    db.delete(transaction)
    db.commit()

    return True