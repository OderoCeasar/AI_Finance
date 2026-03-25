"""Forecasting engine for next-month expense predictions."""

import json
from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum

from ai.openai_client import (
    extract_json_payload,
    get_openai_client,
    get_openai_model,
    log_ai_error,
)
from predictions.models import Prediction
from transactions.models import Transaction, TransactionType


WEIGHTS = [Decimal("0.50"), Decimal("0.30"), Decimal("0.20")]
GROWTH_BUFFER = Decimal("1.05")


def _month_start(value):
    """Return the first day of the value's month."""
    return value.replace(day=1)


def _add_months(month_start, offset):
    """Add or subtract months from a month-start date."""
    year = month_start.year + ((month_start.month - 1 + offset) // 12)
    month = ((month_start.month - 1 + offset) % 12) + 1
    return date(year, month, 1)


def _expense_total_for_month(user, month_start):
    """Return total expense amount for a user/month."""
    next_month = _add_months(month_start, 1)
    return (
        Transaction.objects.filter(
            user=user,
            type=TransactionType.EXPENSE,
            date__gte=month_start,
            date__lt=next_month,
        ).aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )


def _build_forecast_prompt(context):
    """Build a prompt for AI forecasting."""
    return (
        "You are a financial analyst. Using the expense history, "
        "return a JSON object with keys: predicted_expense (number) and month (YYYY-MM). "
        "Use only the provided data and keep the forecast conservative. "
        f"Context JSON:\n{json.dumps(context, default=str)}"
    )


def _ai_forecast(context):
    """Generate a forecast using OpenAI if configured."""
    client = get_openai_client()
    if not client:
        return None
    try:
        response = client.responses.create(
            model=get_openai_model(),
            input=_build_forecast_prompt(context),
            temperature=0.2,
        )
        payload = extract_json_payload(getattr(response, "output_text", "") or "")
        if not isinstance(payload, dict):
            return None
        raw_value = payload.get("predicted_expense")
        if raw_value is None:
            return None
        return Decimal(str(raw_value))
    except Exception as error:  # noqa: BLE001
        log_ai_error("OpenAI forecast failed", error)
        return None


def predict_next_month_expense(user):
    """Predict next-month expense from last 3 months and persist the result."""
    current_month = _month_start(date.today())
    months = [_add_months(current_month, -1), _add_months(current_month, -2), _add_months(current_month, -3)]

    monthly_expenses = [_expense_total_for_month(user, month_start) for month_start in months]
    non_zero_months = [value for value in monthly_expenses if value > 0]
    if not non_zero_months:
        raise ValueError("At least one month of expense data is required for forecasting.")

    history_months = [_add_months(current_month, -offset) for offset in range(1, 7)]
    history = [
        {"month": month.isoformat()[:7], "expense": str(_expense_total_for_month(user, month))}
        for month in history_months
    ]
    prediction_month = _add_months(current_month, 1)
    ai_context = {
        "next_month": prediction_month.isoformat()[:7],
        "expense_history": history,
    }
    ai_predicted = _ai_forecast(ai_context)
    if ai_predicted is not None:
        predicted_expense = ai_predicted.quantize(Decimal("0.01"))
    else:
        weighted_sum = Decimal("0.00")
        total_weight = Decimal("0.00")
        for index, amount in enumerate(monthly_expenses):
            if amount > 0:
                weight = WEIGHTS[index]
                weighted_sum += amount * weight
                total_weight += weight

        normalized_average = weighted_sum / total_weight
        predicted_expense = (normalized_average * GROWTH_BUFFER).quantize(Decimal("0.01"))

    with transaction.atomic():
        prediction = Prediction.objects.create(
            user=user,
            predicted_expense=predicted_expense,
            month=prediction_month,
        )

    return prediction
