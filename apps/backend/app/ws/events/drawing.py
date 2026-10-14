from __future__ import annotations

from typing import Literal

from pydantic import Field, field_validator

from app.ws.events.base import EventContext, EventPayload, RelayEvent, RoomEvent
from app.ws.events.registry import room_events

MAX_POINTS_PER_STROKE = 2000
COLOR_PATTERN = r"^#[0-9a-fA-F]{6}$"


class Stroke(EventPayload):
    """Freehand stroke with points normalized to the 0-1 slide space."""

    id: str = Field(min_length=1, max_length=64)
    tool: Literal["pen", "highlighter"] = "pen"
    color: str = Field(default="#ef4444", pattern=COLOR_PATTERN)
    width: float = Field(default=4, ge=1, le=60)
    points: list[tuple[float, float]] = Field(min_length=1, max_length=MAX_POINTS_PER_STROKE)

    @field_validator("points")
    @classmethod
    def clamp_points(cls, value: list[tuple[float, float]]) -> list[tuple[float, float]]:
        """Clamp every point inside the slide and trim float noise."""
        return [(round(min(1.0, max(0.0, x)), 4), round(min(1.0, max(0.0, y)), 4)) for x, y in value]


class SlidePayload(EventPayload):
    """Reference to a slide by index."""

    slide: int = Field(ge=0)


class StrokePayload(SlidePayload):
    """Stroke drawn on a slide."""

    stroke: Stroke


class PointerPayload(EventPayload):
    """Laser pointer position normalized to the 0-1 slide space."""

    x: float = Field(default=0, ge=0, le=1)
    y: float = Field(default=0, ge=0, le=1)
    visible: bool = True


@room_events.register
class DrawProgress(RelayEvent[StrokePayload]):
    """Preview of a stroke that is still being drawn; never stored."""

    type = "DRAW_PROGRESS"
    out_type = "DRAW_PROGRESSED"
    payload_model = StrokePayload
    exclude_sender = True


@room_events.register
class DrawStroke(RoomEvent[StrokePayload]):
    """Commit a finished stroke to a slide."""

    type = "DRAW_STROKE"
    payload_model = StrokePayload

    async def handle(self, ctx: EventContext, payload: StrokePayload) -> None:
        """Store the stroke and notify the room."""
        stroke = payload.stroke.model_dump()
        ctx.room.add_stroke(payload.slide, stroke)
        await ctx.broadcast("DRAW_STROKE_ADDED", {"slide": payload.slide, "stroke": stroke, "by": ctx.role})


@room_events.register
class DrawUndo(RoomEvent[SlidePayload]):
    """Remove the most recent stroke of a slide."""

    type = "DRAW_UNDO"
    payload_model = SlidePayload

    async def handle(self, ctx: EventContext, payload: SlidePayload) -> None:
        """Drop the last stroke, if any, and notify the room."""
        removed = ctx.room.pop_stroke(payload.slide)
        if removed is None:
            return
        await ctx.broadcast("DRAW_UNDONE", {"slide": payload.slide, "strokeId": removed.get("id"), "by": ctx.role})


@room_events.register
class DrawClear(RoomEvent[SlidePayload]):
    """Erase every stroke of a slide."""

    type = "DRAW_CLEAR"
    payload_model = SlidePayload

    async def handle(self, ctx: EventContext, payload: SlidePayload) -> None:
        """Clear the slide annotations and notify the room."""
        ctx.room.annotations.pop(payload.slide, None)
        await ctx.broadcast("DRAW_CLEARED", {"slide": payload.slide, "by": ctx.role})


@room_events.register
class PointerMove(RelayEvent[PointerPayload]):
    """Move or hide the laser pointer; never stored."""

    type = "POINTER_MOVE"
    out_type = "POINTER_MOVED"
    payload_model = PointerPayload
    exclude_sender = True
