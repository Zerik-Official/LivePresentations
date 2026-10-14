from __future__ import annotations

from app.ws.core import EventRegistry
from app.ws.events.base import ALL_ROLES, EventContext

__all__ = ["EventRegistry", "room_events"]

#: Registry of room events. Element interactions prefixed below are relayed as-is.
room_events: EventRegistry[EventContext] = EventRegistry(passthrough_prefixes=("SPECIALS_", "ELEMENT_", "CUSTOM_"), passthrough_roles=ALL_ROLES)
