from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Payload for user registration."""

    email: EmailStr
    password: str
    turnstile_token: str | None = None


class UserLogin(BaseModel):
    """Payload for user login."""

    email: EmailStr
    password: str
    turnstile_token: str | None = None


class UserRead(BaseModel):
    """Public user representation."""

    id: str
    email: EmailStr
    display_name: str | None = None
    avatar_url: str | None = None
    last_login_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    """Payload for updating editable profile fields."""

    display_name: str | None = Field(default=None, max_length=120)


class PasswordChange(BaseModel):
    """Payload for changing the account password."""

    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


class UserStatsRead(BaseModel):
    """Aggregated profile statistics for quota and usage display."""

    presentations_count: int
    used_bytes: int
    quota_bytes: int
    remaining_bytes: int
