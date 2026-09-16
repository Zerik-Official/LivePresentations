from __future__ import annotations

from pydantic import BaseModel

from app.schemas.user import UserRead


class Token(BaseModel):
    """JWT access token response."""

    access_token: str
    token_type: str = "bearer"


class TokenWithUser(Token):
    """Token response that also returns the authenticated user."""

    user: UserRead
