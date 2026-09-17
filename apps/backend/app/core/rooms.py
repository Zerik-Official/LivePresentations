from __future__ import annotations

import secrets
import string
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone


def _generate_code(length: int = 6) -> str:
    """Generate an alphanumeric room code."""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


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
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=4))


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

    def get(self, code: str) -> RoomState | None:
        """Get room by code, handling expiration."""
        room = self._rooms.get(code.upper())
        if room is None:
            return None
        expires = room.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            self._rooms.pop(code.upper(), None)
            return None
        return room

    def delete(self, code: str) -> None:
        """Delete a room."""
        self._rooms.pop(code.upper(), None)


room_manager = RoomManager()