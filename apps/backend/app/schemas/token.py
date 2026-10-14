from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.user import UserRead


class AuthResult(BaseModel):
    """Outcome of an authentication step.

    `authenticated` means the session cookies were set and `user` is filled.
    `verification_required` means the credentials were right but the email
    still has to be confirmed with the emailed code, using `ticket`.
    """

    status: Literal["authenticated", "verification_required"]
    user: UserRead | None = None
    email: str | None = None
    ticket: str | None = None
    resend_in: int | None = None
    expires_in: int | None = None


class VerifyEmail(BaseModel):
    """Payload to confirm an email with its one-time code."""

    ticket: str = Field(min_length=1, max_length=2048)
    code: str = Field(min_length=4, max_length=12)


class ResendCode(BaseModel):
    """Payload to request another verification code."""

    ticket: str = Field(min_length=1, max_length=2048)


class CodeStatusRead(BaseModel):
    """Timing of the verification code currently valid."""

    resend_in: int
    expires_in: int
    sent: bool
