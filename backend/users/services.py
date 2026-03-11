"""Services for third-party authentication providers."""

import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from django.conf import settings


GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


class GoogleTokenVerificationError(Exception):
    """Raised when a Google ID token cannot be verified."""


def verify_google_id_token(id_token):
    """Validate a Google ID token and return token claims."""
    client_id = getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "").strip()
    if not client_id:
        raise GoogleTokenVerificationError("Google OAuth is not configured on the server.")

    query = urlencode({"id_token": id_token})
    url = f"{GOOGLE_TOKENINFO_URL}?{query}"

    try:
        with urlopen(url, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError) as exc:
        raise GoogleTokenVerificationError("Unable to verify Google token.") from exc
    except json.JSONDecodeError as exc:
        raise GoogleTokenVerificationError("Unexpected response from Google token service.") from exc

    token_audience = payload.get("aud")
    if token_audience != client_id:
        raise GoogleTokenVerificationError("Google token audience is invalid.")

    if payload.get("email_verified") != "true":
        raise GoogleTokenVerificationError("Google account email is not verified.")

    email = payload.get("email")
    if not email:
        raise GoogleTokenVerificationError("Google token does not contain an email.")

    return payload
