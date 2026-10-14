from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    """User account authenticated by password, Google or both."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    has_password: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, server_default="1")
    google_sub: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True, default=None)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default="0")
    # Set only when ownership was proved (emailed code or Google); accounts
    # created before verification existed are verified without a timestamp.
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)
    display_name: Mapped[str | None] = mapped_column(String(120), nullable=True, default=None)
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True, default=None)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    @property
    def google_linked(self) -> bool:
        """Whether the account can sign in with Google."""
        return self.google_sub is not None
