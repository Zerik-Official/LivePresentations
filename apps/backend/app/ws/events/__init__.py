"""Room event system.

Importing this package registers every event module. To add a new event,
subclass `RoomEvent` (or `RelayEvent`) in a module here, decorate it with
`@room_events.register` and import the module below.
"""

from app.ws.events import code, drawing, navigation  # noqa: F401
from app.ws.core import EventPayload, EventRegistry
from app.ws.events.base import EventContext, RelayEvent, RoomEvent
from app.ws.events.registry import room_events

__all__ = ["EventContext", "EventPayload", "EventRegistry", "RelayEvent", "RoomEvent", "room_events"]
