from __future__ import annotations

from datetime import datetime, timedelta, timezone

import bcrypt as _bcrypt

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Workaround for passlib + bcrypt>=4.1 incompatibility: passlib expects bcrypt.__about__.__version__
if not hasattr(_bcrypt, "__about__"):
    _bcrypt.__about__ = type("_about", (), {"__version__": getattr(_bcrypt, "__version__", "4.1.3")})()  # type: ignore[attr-defined]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a plain password."""
    return pwd_context.hash(password)


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT for the given subject."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode: dict[str, object] = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> str | None:
    """Decode JWT and return subject if valid."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        subject: str | None = payload.get("sub")
        if subject is None:
            return None
        return subject
    except JWTError:
        return None