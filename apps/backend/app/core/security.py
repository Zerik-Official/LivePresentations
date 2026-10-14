from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt as _bcrypt
from fastapi import Response
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Workaround for passlib + bcrypt>=4.1 incompatibility: passlib expects bcrypt.__about__.__version__
if not hasattr(_bcrypt, "__about__"):
    _bcrypt.__about__ = type("_about", (), {"__version__": getattr(_bcrypt, "__version__", "4.1.3")})()  # type: ignore[attr-defined]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"
REFRESH_COOKIE_PATH = "/api/auth"
ACCESS_PURPOSE = "access"
VERIFY_PURPOSE = "verify-email"
VERIFY_TICKET_MINUTES = 60


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a plain password."""
    return pwd_context.hash(password)


def _create_token(subject: str, purpose: str, expires_delta: timedelta) -> str:
    """Create a signed JWT bound to one purpose.

    Args:
        subject: User id.
        purpose: What the token may be used for.
        expires_delta: Lifetime.

    Returns:
        Encoded JWT.
    """
    to_encode: dict[str, object] = {"sub": subject, "purpose": purpose, "exp": datetime.now(timezone.utc) + expires_delta}
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def _decode_token(token: str, purpose: str) -> str | None:
    """Decode a JWT and return its subject when valid for the purpose.

    Args:
        token: Encoded JWT.
        purpose: Purpose the token must carry.

    Returns:
        Subject, or None when the token is invalid, expired or for another purpose.
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None
    subject = payload.get("sub")
    if not isinstance(subject, str) or payload.get("purpose") != purpose:
        return None
    return subject


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    """Create a short-lived signed JWT for the given subject."""
    return _create_token(subject, ACCESS_PURPOSE, expires_delta or timedelta(minutes=settings.access_token_expire_minutes))


def decode_access_token(token: str) -> str | None:
    """Decode an access JWT and return subject if valid."""
    return _decode_token(token, ACCESS_PURPOSE)


def create_verification_ticket(subject: str) -> str:
    """Create the ticket that lets a just-authenticated user verify their email.

    It proves the holder knew the password without granting a session.
    """
    return _create_token(subject, VERIFY_PURPOSE, timedelta(minutes=VERIFY_TICKET_MINUTES))


def decode_verification_ticket(ticket: str) -> str | None:
    """Decode an email verification ticket and return its subject if valid."""
    return _decode_token(ticket, VERIFY_PURPOSE)


def generate_refresh_token() -> str:
    """Generate an opaque, unguessable refresh token."""
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    """Hash a high-entropy token for storage.

    Args:
        token: Opaque token.

    Returns:
        Hex SHA-256 digest.
    """
    return hashlib.sha256(token.encode()).hexdigest()


def generate_otp(length: int = 6) -> str:
    """Generate a numeric one-time code."""
    return "".join(secrets.choice("0123456789") for _ in range(length))


def hash_otp(user_id: str, code: str) -> str:
    """Hash a one-time code with a server-side key.

    A plain hash of a 6-digit code could be brute-forced from a leaked
    database, so the hash is keyed with the application secret.

    Args:
        user_id: Owner of the code.
        code: One-time code.

    Returns:
        Hex HMAC-SHA256 digest.
    """
    return hmac.new(settings.secret_key.encode(), f"otp:{user_id}:{code}".encode(), hashlib.sha256).hexdigest()


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Store the session in HttpOnly cookies, unreadable from JavaScript.

    The refresh cookie is scoped to the auth routes so it is not sent with
    every request.

    Args:
        response: Outgoing response.
        access_token: Short-lived access JWT.
        refresh_token: Opaque refresh token.
    """
    common = {"httponly": True, "secure": settings.use_secure_cookies, "samesite": "lax", "domain": settings.cookie_domain or None}
    response.set_cookie(ACCESS_COOKIE, access_token, max_age=settings.access_token_expire_minutes * 60, path="/", **common)  # type: ignore[arg-type]
    response.set_cookie(REFRESH_COOKIE, refresh_token, max_age=settings.refresh_token_expire_days * 86400, path=REFRESH_COOKIE_PATH, **common)  # type: ignore[arg-type]


def clear_auth_cookies(response: Response) -> None:
    """Remove the session cookies.

    Args:
        response: Outgoing response.
    """
    domain = settings.cookie_domain or None
    response.delete_cookie(ACCESS_COOKIE, path="/", domain=domain)
    response.delete_cookie(REFRESH_COOKIE, path=REFRESH_COOKIE_PATH, domain=domain)
