from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import ClassVar, Generic, Protocol, TypeVar

from pydantic import BaseModel, ConfigDict, ValidationError

logger = logging.getLogger(__name__)


class EventPayload(BaseModel):
    """Base payload for WebSocket events; unknown fields are ignored."""

    model_config = ConfigDict(extra="ignore", populate_by_name=True)


class EmptyPayload(EventPayload):
    """Payload for events that carry no data."""


class EventScope(Protocol):
    """What every event context exposes to the dispatcher."""

    #: Role of the sender within the channel, used for authorization.
    role: str
    #: Channel identifier, used in logs.
    label: str

    async def broadcast(self, event_type: str, payload: dict[str, object], *, exclude_sender: bool = False) -> None:
        """Send an event to everyone on the channel."""


ContextT = TypeVar("ContextT", bound=EventScope)
PayloadT = TypeVar("PayloadT", bound=EventPayload)


class WSEvent(ABC, Generic[ContextT, PayloadT]):
    """Generic contract for a client-to-server WebSocket event.

    Subclasses declare the incoming `type`, the pydantic `payload_model` that
    validates the message and, optionally, the roles allowed to send it, then
    implement `handle`. Each channel (rooms, assistant) specializes the
    context type and owns an `EventRegistry`.
    """

    type: ClassVar[str]
    payload_model: ClassVar[type[EventPayload]] = EmptyPayload
    #: Roles allowed to send the event; None allows every role on the channel.
    allowed_roles: ClassVar[frozenset[str] | None] = None

    @abstractmethod
    async def handle(self, ctx: ContextT, payload: PayloadT) -> None:
        """Apply the event and notify clients.

        Args:
            ctx: Context of the incoming message.
            payload: Validated payload.
        """


EventT = TypeVar("EventT", bound=type[WSEvent])


class EventRegistry(Generic[ContextT]):
    """Maps incoming message types to their event handlers for one channel.

    Message types without a dedicated event can be rebroadcast untouched when
    they start with a passthrough prefix and the sender has a passthrough
    role, so frontend-only interactions need no backend change.
    """

    def __init__(self, passthrough_prefixes: tuple[str, ...] = (), passthrough_roles: frozenset[str] = frozenset()) -> None:
        self._events: dict[str, WSEvent] = {}
        self._passthrough_prefixes = passthrough_prefixes
        self._passthrough_roles = passthrough_roles

    def register(self, event_cls: EventT) -> EventT:
        """Register an event class; usable as a decorator.

        Args:
            event_cls: Concrete event subclass.

        Returns:
            The same class, unchanged.
        """
        event_type = event_cls.type
        if event_type in self._events:
            raise ValueError(f"WebSocket event already registered: {event_type}")
        self._events[event_type] = event_cls()
        return event_cls

    def types(self) -> list[str]:
        """List the registered incoming event types.

        Returns:
            Sorted event type names.
        """
        return sorted(self._events)

    async def dispatch(self, ctx: ContextT, event_type: object, raw_payload: object) -> None:
        """Validate and run the event matching an incoming message.

        Invalid, unknown or unauthorized messages are dropped so one bad client
        cannot break the receive loop.

        Args:
            ctx: Context of the incoming message.
            event_type: Raw `type` field of the message.
            raw_payload: Raw `payload` field of the message.
        """
        if not isinstance(event_type, str):
            return
        payload_data = raw_payload if isinstance(raw_payload, dict) else {}
        event = self._events.get(event_type)
        if event is None:
            if self._passthrough_prefixes and ctx.role in self._passthrough_roles and event_type.startswith(self._passthrough_prefixes):
                await ctx.broadcast(event_type, payload_data)
            return
        if event.allowed_roles is not None and ctx.role not in event.allowed_roles:
            return
        try:
            payload = event.payload_model.model_validate(payload_data)
        except ValidationError:
            logger.debug("Dropped invalid %s payload on %s", event_type, ctx.label)
            return
        await event.handle(ctx, payload)
