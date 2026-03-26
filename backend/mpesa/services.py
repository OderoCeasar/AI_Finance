"""Business logic for importing M-Pesa transactions."""

from __future__ import annotations

import csv
import io
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Iterable

from django.db import transaction as db_transaction

from django.utils import timezone

from mpesa.models import MpesaConnection, MpesaTransaction
from transactions.models import Transaction, TransactionType
from transactions.services import categorize_transaction, initialize_global_categories, update_or_create_monthly_summary


def _parse_csv_rows(csv_text: str) -> Iterable[dict]:
    if not csv_text:
        return []
    reader = csv.DictReader(io.StringIO(csv_text))
    return list(reader)


def _normalize_direction(value: str) -> str:
    lowered = (value or "").strip().lower()
    if lowered in {"in", "credit", "income"}:
        return "income"
    return "expense"


def _normalize_amount(value: str) -> Decimal:
    cleaned = str(value).replace(",", "").strip()
    if not cleaned:
        return Decimal("0.00")
    return Decimal(cleaned)


def _parse_date(value: str) -> datetime.date:
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return timezone.now().date()


def import_transactions(connection: MpesaConnection, rows: Iterable[dict]) -> int:
    """Persist M-Pesa transactions and mirror them into the core ledger."""
    initialize_global_categories()
    imported = 0

    with db_transaction.atomic():
        for row in rows:
            description = str(row.get("description", "")).strip()
            direction = _normalize_direction(str(row.get("direction", row.get("type", ""))))
            amount = _normalize_amount(row.get("amount", "0"))
            if amount <= 0:
                continue

            transaction_id = str(row.get("transaction_id") or row.get("receipt") or uuid.uuid4().hex)
            date_value = _parse_date(str(row.get("date", row.get("transaction_date", ""))))
            account_reference = str(row.get("account_reference", "")).strip()

            mpesa_txn, created = MpesaTransaction.objects.get_or_create(
                connection=connection,
                transaction_id=transaction_id,
                defaults={
                    "amount": amount,
                    "direction": direction,
                    "description": description or "M-Pesa transaction",
                    "transaction_date": date_value,
                    "account_reference": account_reference,
                    "raw_payload": row,
                },
            )
            if not created:
                continue

            category = categorize_transaction(description or "M-Pesa", user=connection.user)
            Transaction.objects.create(
                user=connection.user,
                amount=amount,
                category=category,
                type=TransactionType.INCOME if direction == "income" else TransactionType.EXPENSE,
                description=description or "M-Pesa transaction",
                date=date_value,
            )

            update_or_create_monthly_summary(connection.user, date_value)
            imported += 1

        connection.last_sync = timezone.now()
        connection.save(update_fields=["last_sync"])

    return imported


def parse_import_payload(csv_text: str | None, transactions: list | None) -> list[dict]:
    if transactions:
        return transactions
    if csv_text:
        return list(_parse_csv_rows(csv_text))
    return []
