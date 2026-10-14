from __future__ import annotations

import hmac
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import generate_otp, hash_otp
from app.models.auth import EmailOtp
from app.models.user import User
from app.services.email import send_verification_email


class InvalidCodeError(Exception):
    """Raised when a verification code is wrong, expired or exhausted."""


@dataclass(frozen=True)
class CodeStatus:
    """Timing of the code currently valid for a user."""

    #: Seconds until another code may be requested.
    resend_in: int
    #: Seconds until the current code expires.
    expires_in: int
    #: Whether this call sent a new email.
    sent: bool


def _aware(value: datetime) -> datetime:
    """Return a timezone-aware datetime, assuming UTC for naive values."""
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


def _status(otp: EmailOtp, sent: bool) -> CodeStatus:
    """Compute the timing of a stored code.

    Args:
        otp: Stored code.
        sent: Whether it was just emailed.

    Returns:
        Code timing.
    """
    now = datetime.now(timezone.utc)
    cooldown_end = _aware(otp.sent_at) + timedelta(seconds=settings.otp_resend_cooldown_seconds)
    return CodeStatus(
        resend_in=max(0, int((cooldown_end - now).total_seconds())),
        expires_in=max(0, int((_aware(otp.expires_at) - now).total_seconds())),
        sent=sent,
    )


async def send_code(db: AsyncSession, user: User) -> CodeStatus:
    """Email a fresh verification code unless one was sent too recently.

    Within the cooldown the existing code stays valid and nothing is sent, so
    repeated logins or clicks cannot be used to flood an inbox.

    Args:
        db: Database session.
        user: Account being verified.

    Returns:
        Timing of the valid code and whether an email went out.

    Raises:
        EmailDeliveryError: The email could not be sent.
    """
    result = await db.execute(select(EmailOtp).where(EmailOtp.user_id == user.id))
    existing = result.scalar_one_or_none()
    if existing is not None:
        current = _status(existing, sent=False)
        if current.resend_in > 0 and current.expires_in > 0:
            return current
        await db.delete(existing)
        await db.flush()

    code = generate_otp()
    now = datetime.now(timezone.utc)
    otp = EmailOtp(user_id=user.id, code_hash=hash_otp(user.id, code), expires_at=now + timedelta(minutes=settings.otp_expire_minutes), sent_at=now)
    db.add(otp)
    await send_verification_email(user.email, code)
    await db.commit()
    return _status(otp, sent=True)


async def consume_code(db: AsyncSession, user: User, code: str) -> None:
    """Check a verification code and mark the email as verified.

    Each code allows a limited number of attempts; after that it is discarded
    and a new one must be requested.

    Args:
        db: Database session.
        user: Account being verified.
        code: Code typed by the user.

    Raises:
        InvalidCodeError: The code is wrong, expired or out of attempts.
    """
    result = await db.execute(select(EmailOtp).where(EmailOtp.user_id == user.id))
    otp = result.scalar_one_or_none()
    if otp is None or _aware(otp.expires_at) <= datetime.now(timezone.utc):
        raise InvalidCodeError("El código ha caducado. Solicita uno nuevo.")
    if otp.attempts >= settings.otp_max_attempts:
        raise InvalidCodeError("Demasiados intentos. Solicita un código nuevo.")
    if not hmac.compare_digest(otp.code_hash, hash_otp(user.id, code.strip())):
        otp.attempts += 1
        await db.commit()
        remaining = settings.otp_max_attempts - otp.attempts
        raise InvalidCodeError(f"Código incorrecto. Te quedan {remaining} intentos." if remaining > 0 else "Demasiados intentos. Solicita un código nuevo.")
    await db.execute(delete(EmailOtp).where(EmailOtp.user_id == user.id).execution_options(synchronize_session=False))
    user.email_verified = True
    await db.commit()
