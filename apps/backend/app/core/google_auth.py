from __future__ import annotations

import time
from dataclasses import dataclass

import httpx
from jose import JWTError, jwt

from app.core.config import settings

GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = ("https://accounts.google.com", "accounts.google.com")
_CERTS_TTL_SECONDS = 3600

_certs_cache: dict[str, object] = {"keys": [], "fetched_at": 0.0}


class GoogleAuthError(Exception):
    """Raised when a Google ID token cannot be trusted."""


@dataclass(frozen=True)
class GoogleIdentity:
    """Verified identity extracted from a Google ID token."""

    sub: str
    email: str
    name: str | None
    picture: str | None


async def _fetch_certs(force: bool = False) -> list[dict[str, object]]:
    """Return Google's public signing keys, cached for an hour.

    Args:
        force: Bypass the cache, used when a token names an unknown key id.

    Returns:
        List of JWK dictionaries.
    """
    fresh = time.monotonic() - float(_certs_cache["fetched_at"]) < _CERTS_TTL_SECONDS  # type: ignore[arg-type]
    if not force and fresh and _certs_cache["keys"]:
        return _certs_cache["keys"]  # type: ignore[return-value]
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(GOOGLE_CERTS_URL)
            response.raise_for_status()
            keys = response.json()["keys"]
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        raise GoogleAuthError("No se pudo contactar con Google") from exc
    _certs_cache["keys"] = keys
    _certs_cache["fetched_at"] = time.monotonic()
    return keys


async def verify_google_id_token(credential: str) -> GoogleIdentity:
    """Verify a Google Identity Services ID token.

    Checks the RS256 signature against Google's keys, the audience against the
    configured client id, the issuer, the expiry and that the email is verified.

    Args:
        credential: ID token returned by Google Identity Services.

    Returns:
        Verified identity.

    Raises:
        GoogleAuthError: The token is malformed, forged, expired or unverified.
    """
    try:
        key_id = jwt.get_unverified_header(credential).get("kid")
    except JWTError as exc:
        raise GoogleAuthError("Token de Google inválido") from exc

    keys = await _fetch_certs()
    key = next((k for k in keys if k.get("kid") == key_id), None)
    if key is None:
        keys = await _fetch_certs(force=True)
        key = next((k for k in keys if k.get("kid") == key_id), None)
    if key is None:
        raise GoogleAuthError("Token de Google inválido")

    try:
        claims = jwt.decode(
            credential,
            key,
            algorithms=["RS256"],
            audience=settings.google_client_id,
            issuer=GOOGLE_ISSUERS,
            options={"verify_at_hash": False},
        )
    except JWTError as exc:
        raise GoogleAuthError("Token de Google inválido o expirado") from exc

    sub = claims.get("sub")
    email = claims.get("email")
    if not sub or not email or claims.get("email_verified") is not True:
        raise GoogleAuthError("La cuenta de Google no tiene un correo verificado")
    return GoogleIdentity(sub=str(sub), email=str(email).lower(), name=claims.get("name") or None, picture=claims.get("picture") or None)
