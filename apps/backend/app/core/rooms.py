from __future__ import annotations

import secrets
import string
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

if TYPE_CHECKING:
    from app.models.room import Room

MAX_STROKES_PER_SLIDE = 200


def _generate_code(length: int = 6) -> str:
    """Generate an alphanumeric room code."""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _as_utc(value: datetime) -> datetime:
    """Return a timezone-aware UTC datetime.

    Args:
        value: Naive or aware datetime.

    Returns:
        Aware datetime, assuming UTC for naive values.
    """
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


def is_expired(expires_at: datetime | None) -> bool:
    """Check whether an expiration timestamp is already in the past.

    Args:
        expires_at: Expiration datetime or None when it never expires.

    Returns:
        True when the timestamp has passed.
    """
    if expires_at is None:
        return False
    return datetime.now(timezone.utc) > _as_utc(expires_at)


@dataclass
class RoomState:
    """In-memory presentation room state."""

    code: str
    presentation_id: str
    owner_id: str
    current_slide: int = 0
    highlighted_id: str | None = None
    code_overlay: dict[str, object] | None = None
    show_controls: bool = True
    fullscreen: bool = False
    anti_spoiler: bool = False
    auto_fullscreen: bool = True
    is_public: bool = False
    blackout: bool = False
    #: Furthest slide shown so far; public viewers never receive later slides.
    max_slide: int = 0
    annotations: dict[int, list[dict[str, object]]] = field(default_factory=dict)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=4))

    @classmethod
    def from_model(cls, room: Room) -> RoomState:
        """Build the in-memory state from a persisted room.

        Args:
            room: Persisted room row.

        Returns:
            Fresh in-memory state mirroring the row.
        """
        return cls(
            code=room.code,
            presentation_id=room.presentation_id,
            owner_id=room.owner_id,
            current_slide=room.current_slide,
            highlighted_id=room.highlighted_id,
            show_controls=room.show_controls,
            fullscreen=room.fullscreen,
            anti_spoiler=room.anti_spoiler,
            auto_fullscreen=room.auto_fullscreen,
            is_public=room.is_public,
            max_slide=room.current_slide,
            expires_at=room.expires_at,
        )

    def config_payload(self) -> dict[str, bool]:
        """Return the room configuration flags.

        Returns:
            Mapping with the presentation config flags.
        """
        return {
            "show_controls": self.show_controls,
            "fullscreen": self.fullscreen,
            "anti_spoiler": self.anti_spoiler,
            "auto_fullscreen": self.auto_fullscreen,
            "is_public": self.is_public,
        }

    def snapshot(self) -> dict[str, object]:
        """Return the full state sent to a client when it joins.

        Returns:
            Serializable room snapshot.
        """
        return {
            "code": self.code,
            "presentation_id": self.presentation_id,
            "current_slide": self.current_slide,
            "highlighted_id": self.highlighted_id,
            "code_overlay": self.code_overlay,
            "blackout": self.blackout,
            "annotations": {str(slide): strokes for slide, strokes in self.annotations.items() if strokes},
            **self.config_payload(),
        }

    def add_stroke(self, slide: int, stroke: dict[str, object]) -> None:
        """Store a finished annotation stroke, dropping the oldest when full.

        Args:
            slide: Slide index the stroke belongs to.
            stroke: Serialized stroke.
        """
        strokes = self.annotations.setdefault(slide, [])
        strokes.append(stroke)
        if len(strokes) > MAX_STROKES_PER_SLIDE:
            del strokes[: len(strokes) - MAX_STROKES_PER_SLIDE]

    def pop_stroke(self, slide: int) -> dict[str, object] | None:
        """Remove and return the most recent stroke of a slide.

        Args:
            slide: Slide index.

        Returns:
            Removed stroke or None when the slide has no strokes.
        """
        strokes = self.annotations.get(slide)
        return strokes.pop() if strokes else None


class RoomManager:
    """Manage active rooms in memory."""

    def __init__(self) -> None:
        self._rooms: dict[str, RoomState] = {}

    def create(self, presentation_id: str, owner_id: str) -> RoomState:
        """Create a room with a unique code."""
        for _ in range(10):
            code = _generate_code()
            if code not in self._rooms:
                room = RoomState(code=code, presentation_id=presentation_id, owner_id=owner_id)
                self._rooms[code] = room
                return room
        raise RuntimeError("No se pudo generar código de sala")

    def put(self, room: RoomState) -> RoomState:
        """Register or replace a room state.

        Args:
            room: State to keep in memory.

        Returns:
            The registered state.
        """
        self._rooms[room.code.upper()] = room
        return room

    def get(self, code: str) -> RoomState | None:
        """Get room by code, handling expiration."""
        room = self._rooms.get(code.upper())
        if room is None:
            return None
        if is_expired(room.expires_at):
            self._rooms.pop(code.upper(), None)
            return None
        return room

    async def resolve(self, code: str, db: AsyncSession) -> RoomState | None:
        """Get a room from memory or hydrate it from the database.

        Args:
            code: Room code.
            db: Database session used when the room is not in memory.

        Returns:
            Room state, or None when it does not exist or has expired.
        """
        from app.models.room import Room

        cached = self.get(code)
        if cached is not None:
            return cached
        result = await db.execute(select(Room).where(Room.code == code.upper()))
        db_room = result.scalar_one_or_none()
        if db_room is None:
            return None
        if is_expired(db_room.expires_at):
            await db.delete(db_room)
            await db.commit()
            return None
        return self.put(RoomState.from_model(db_room))

    def delete(self, code: str) -> None:
        """Delete a room."""
        self._rooms.pop(code.upper(), None)


room_manager = RoomManager()
