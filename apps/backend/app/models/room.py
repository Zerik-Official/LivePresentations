from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Room(Base):
    """Persisted room for presentation live session."""

    __tablename__ = "rooms"

    code: Mapped[str] = mapped_column(String(12), primary_key=True)
    presentation_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    owner_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    current_slide: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    highlighted_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc) + timedelta(hours=4), nullable=False)
