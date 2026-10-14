from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import Response
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, generate_refresh_token, hash_token, set_auth_cookies
from app.models.auth import RefreshToken
from app.models.user import User

# Two tabs refreshing at once both present the same token; the loser of the
# race must not be mistaken for a thief.
ROTATION_GRACE_SECONDS = 20


class InvalidSessionError(Exception):
    """Raised when a refresh token cannot be exchanged for a new session."""


def _aware(value: datetime) -> datetime:
    """Return a timezone-aware datetime, assuming UTC for naive values."""
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


async def start_session(db: AsyncSession, user: User, response: Response) -> None:
    """Open a session: issue both tokens and store them in cookies.

    Args:
        db: Database session.
        user: Authenticated user.
        response: Outgoing response that receives the cookies.
    """
    raw = generate_refresh_token()
    now = datetime.now(timezone.utc)
    db.add(RefreshToken(user_id=user.id, token_hash=hash_token(raw), expires_at=now + timedelta(days=settings.refresh_token_expire_days)))
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id, RefreshToken.expires_at < now).execution_options(synchronize_session=False))
    await db.commit()
    set_auth_cookies(response, create_access_token(subject=user.id), raw)


async def rotate_session(db: AsyncSession, raw_token: str | None, response: Response) -> User:
    """Exchange a refresh token for a new access token and a new refresh token.

    Every refresh token works once. Presenting one that was already rotated
    (outside a short grace window for concurrent tabs) means it leaked, so
    every session of that user is closed.

    Args:
        db: Database session.
        raw_token: Refresh token from the cookie.
        response: Outgoing response that receives the new cookies.

    Returns:
        User the session belongs to.

    Raises:
        InvalidSessionError: The token is missing, unknown, expired or reused.
    """
    if not raw_token:
        raise InvalidSessionError("missing")
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == hash_token(raw_token)))
    stored = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if stored is None or _aware(stored.expires_at) <= now:
        raise InvalidSessionError("expired")
    if stored.revoked_at is not None and (now - _aware(stored.revoked_at)).total_seconds() > ROTATION_GRACE_SECONDS:
        await revoke_all_sessions(db, stored.user_id)
        raise InvalidSessionError("reused")

    user_result = await db.execute(select(User).where(User.id == stored.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise InvalidSessionError("unknown user")
    if stored.revoked_at is None:
        stored.revoked_at = now
    await start_session(db, user, response)
    return user


async def revoke_session(db: AsyncSession, raw_token: str | None) -> None:
    """Close the session a refresh token belongs to.

    Args:
        db: Database session.
        raw_token: Refresh token from the cookie, if any.
    """
    if not raw_token:
        return
    await db.execute(update(RefreshToken).where(RefreshToken.token_hash == hash_token(raw_token), RefreshToken.revoked_at.is_(None)).values(revoked_at=datetime.now(timezone.utc)).execution_options(synchronize_session=False))
    await db.commit()


async def revoke_all_sessions(db: AsyncSession, user_id: str) -> None:
    """Close every session of a user, e.g. after a password change.

    Args:
        db: Database session.
        user_id: Owner of the sessions.
    """
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user_id).execution_options(synchronize_session=False))
    await db.commit()
