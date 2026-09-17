from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    """Payload for user registration."""

    email: EmailStr
    password: str


class UserLogin(BaseModel):
    """Payload for user login."""

    email: EmailStr
    password: str


class UserRead(BaseModel):
    """Public user representation."""

    id: str
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}
