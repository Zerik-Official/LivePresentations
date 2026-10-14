from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, ClassVar

from fastapi import WebSocket
from sqlalchemy import select

from app.core.rooms import RoomState
from app.db.session import async_session_factory
from app.models.room import Room
from app.models.user import User
from app.ws.core import EmptyPayload, EventPayload, PayloadT, WSEvent

if TYPE_CHECKING:
    from app.ws.manager import WSManager

#: Roles that drive a room. Viewers of public rooms are read-only.
ALL_ROLES: frozenset[str] = frozenset({"presenter", "controller"})
VIEWER_ROLE = "viewer"

__all__ = ["ALL_ROLES", "VIEWER_ROLE", "EmptyPayload", "EventContext", "EventPayload", "RelayEvent", "RoomEvent"]


@dataclass
class EventContext:
    """Everything a room event needs to act on a single incoming message."""

    code: str
    role: str
    #: None for anonymous viewers of a public room.
    user: User | None
    websocket: WebSocket
    room: RoomState
    manager: WSManager

    @property
    def label(self) -> str:
        """Channel identifier for logs."""
        return f"room {self.code}"

    async def broadcast(self, event_type: str, payload: dict[str, object], *, exclude_sender: bool = False) -> None:
        """Send an event to every client connected to the room.

        Args:
            event_type: Outgoing event name.
            payload: Outgoing payload.
            exclude_sender: Skip the socket that produced the event.
        """
        await self.manager.broadcast(self.code, {"type": event_type, "payload": payload}, exclude=self.websocket if exclude_sender else None)

    async def reply(self, event_type: str, payload: dict[str, object]) -> None:
        """Send an event only to the socket that produced the message.

        Args:
            event_type: Outgoing event name.
            payload: Outgoing payload.
        """
        await self.manager.send(self.websocket, {"type": event_type, "payload": payload})

    async def persist(self, **fields: object) -> None:
        """Persist room columns so the state survives a restart.

        Args:
            **fields: Column values to store on the room row.
        """
        async with async_session_factory() as db:
            result = await db.execute(select(Room).where(Room.code == self.code.upper()))
            db_room = result.scalar_one_or_none()
            if db_room is None:
                return
            for name, value in fields.items():
                setattr(db_room, name, value)
            await db.commit()


class RoomEvent(WSEvent[EventContext, PayloadT]):
    """Client-to-server room event, restricted to presenters and controllers.

    Register subclasses with `@room_events.register` to make them live.
    """

    allowed_roles: ClassVar[frozenset[str] | None] = ALL_ROLES


class RelayEvent(RoomEvent[PayloadT]):
    """Event that validates its payload and rebroadcasts it under `out_type`."""

    out_type: ClassVar[str]
    exclude_sender: ClassVar[bool] = False

    async def handle(self, ctx: EventContext, payload: PayloadT) -> None:
        """Rebroadcast the validated payload tagged with the sender role.

        Args:
            ctx: Context of the incoming message.
            payload: Validated payload.
        """
        data = payload.model_dump(by_alias=True)
        await ctx.broadcast(self.out_type, {**data, "by": ctx.role}, exclude_sender=self.exclude_sender)
