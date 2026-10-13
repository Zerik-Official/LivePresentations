from __future__ import annotations

from pydantic import Field, field_validator

from app.ws.events.base import VIEWER_ROLE, EmptyPayload, EventContext, EventPayload, RelayEvent, RoomEvent
from app.ws.events.registry import room_events


class SlideChangePayload(EventPayload):
    """Target slide index."""

    index: int = 0

    @field_validator("index")
    @classmethod
    def clamp_index(cls, value: int) -> int:
        """Keep the slide index non-negative."""
        return max(0, value)


class ElementPayload(EventPayload):
    """Reference to a slide element; null clears the selection."""

    element_id: str | None = Field(default=None, alias="elementId")

    @field_validator("element_id", mode="before")
    @classmethod
    def only_strings(cls, value: object) -> str | None:
        """Treat any non-string id as no element."""
        return value if isinstance(value, str) else None


class RoomConfigPayload(EventPayload):
    """Room configuration flags; omitted flags are left untouched."""

    show_controls: bool | None = None
    fullscreen: bool | None = None
    anti_spoiler: bool | None = None
    auto_fullscreen: bool | None = None
    is_public: bool | None = None

    @field_validator("*", mode="before")
    @classmethod
    def only_booleans(cls, value: object) -> bool | None:
        """Ignore flags that are not real booleans."""
        return value if isinstance(value, bool) else None


class CountdownPayload(EventPayload):
    """Anti-spoiler countdown length in seconds."""

    seconds: int = 3

    @field_validator("seconds", mode="before")
    @classmethod
    def clamp_seconds(cls, value: object) -> int:
        """Clamp the countdown to 1-10 seconds, defaulting to 3."""
        try:
            return max(1, min(10, int(value)))  # type: ignore[call-overload]
        except (TypeError, ValueError):
            return 3


class TogglePayload(EventPayload):
    """Strict on/off switch."""

    enabled: bool

    @field_validator("enabled", mode="before")
    @classmethod
    def require_boolean(cls, value: object) -> bool:
        """Reject values that are not real booleans."""
        if not isinstance(value, bool):
            raise ValueError("enabled must be a boolean")
        return value


@room_events.register
class SlideChange(RoomEvent[SlideChangePayload]):
    """Move the room to another slide."""

    type = "SLIDE_CHANGE"
    payload_model = SlideChangePayload

    async def handle(self, ctx: EventContext, payload: SlideChangePayload) -> None:
        """Store the new slide and notify the room."""
        ctx.room.current_slide = payload.index
        ctx.room.max_slide = max(ctx.room.max_slide, payload.index)
        await ctx.persist(current_slide=payload.index)
        await ctx.broadcast("SLIDE_CHANGED", {"index": payload.index, "by": ctx.role})


@room_events.register
class Highlight(RoomEvent[ElementPayload]):
    """Highlight an element or clear the highlight."""

    type = "HIGHLIGHT"
    payload_model = ElementPayload

    async def handle(self, ctx: EventContext, payload: ElementPayload) -> None:
        """Store the highlighted element and notify the room."""
        ctx.room.highlighted_id = payload.element_id
        await ctx.persist(highlighted_id=payload.element_id)
        await ctx.broadcast("HIGHLIGHT_CHANGED", {"elementId": payload.element_id, "by": ctx.role})


@room_events.register
class AnimationTrigger(RelayEvent[ElementPayload]):
    """Replay the entrance animation of an element."""

    type = "ANIMATION_TRIGGER"
    out_type = "ANIMATION_TRIGGERED"
    payload_model = ElementPayload


@room_events.register
class RoomConfigUpdate(RoomEvent[RoomConfigPayload]):
    """Change the room configuration flags."""

    type = "ROOM_CONFIG_UPDATE"
    payload_model = RoomConfigPayload

    async def handle(self, ctx: EventContext, payload: RoomConfigPayload) -> None:
        """Apply the provided flags and notify the room."""
        updated = payload.model_dump(exclude_none=True)
        if not updated:
            return
        for name, value in updated.items():
            setattr(ctx.room, name, value)
        await ctx.persist(**updated)
        await ctx.broadcast("ROOM_CONFIG_CHANGED", updated)
        if updated.get("is_public") is False:
            await ctx.manager.close_role(ctx.code, VIEWER_ROLE, 4404, "La sala ya no es pública")


@room_events.register
class SpoilerCountdownStart(RelayEvent[CountdownPayload]):
    """Start the anti-spoiler countdown."""

    type = "SPOILER_COUNTDOWN_START"
    out_type = "SPOILER_COUNTDOWN_STARTED"
    payload_model = CountdownPayload


@room_events.register
class SpoilerIntroDismiss(RelayEvent[EmptyPayload]):
    """Dismiss the anti-spoiler intro screen."""

    type = "SPOILER_INTRO_DISMISS"
    out_type = "SPOILER_INTRO_DISMISSED"


@room_events.register
class PresentationFullscreen(RelayEvent[TogglePayload]):
    """Ask the presenter browser to enter or leave fullscreen."""

    type = "PRESENTATION_FULLSCREEN"
    out_type = "PRESENTATION_FULLSCREEN_CHANGED"
    payload_model = TogglePayload


@room_events.register
class Blackout(RoomEvent[TogglePayload]):
    """Hide or reveal the slide behind a black screen."""

    type = "BLACKOUT"
    payload_model = TogglePayload

    async def handle(self, ctx: EventContext, payload: TogglePayload) -> None:
        """Store the blackout flag and notify the room."""
        ctx.room.blackout = payload.enabled
        await ctx.broadcast("BLACKOUT_CHANGED", {"enabled": payload.enabled, "by": ctx.role})
