"""OpenAI client helpers with safe fallbacks."""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

from django.conf import settings

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - optional dependency
    OpenAI = None

logger = logging.getLogger(__name__)


def get_openai_client() -> Optional["OpenAI"]:
    """Return an OpenAI client if configured, else None."""
    api_key = getattr(settings, "OPENAI_API_KEY", "") or ""
    if not api_key or OpenAI is None:
        return None
    return OpenAI(api_key=api_key)


def get_openai_model() -> str:
    """Return the configured model name."""
    return getattr(settings, "OPENAI_MODEL", "") or "gpt-5"


def extract_json_payload(text: str) -> Optional[Any]:
    """Extract JSON from a model response text."""
    if not text:
        return None
    stripped = text.strip()
    if stripped.startswith("{") or stripped.startswith("["):
        try:
            return json.loads(stripped)
        except json.JSONDecodeError:
            return None

    start = min(
        [idx for idx in (stripped.find("{"), stripped.find("[")) if idx != -1],
        default=-1,
    )
    end = max(stripped.rfind("}"), stripped.rfind("]"))
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        return json.loads(stripped[start : end + 1])
    except json.JSONDecodeError:
        return None


def log_ai_error(message: str, error: Exception) -> None:
    """Log AI failures without interrupting the primary flow."""
    logger.warning("%s: %s", message, error)
