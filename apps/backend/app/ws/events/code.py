from __future__ import annotations

from pydantic import Field, field_validator

from app.ws.events.base import EmptyPayload, EventContext, EventPayload, RoomEvent
from app.ws.events.registry import room_events


class CodeTargetPayload(EventPayload):
    """Reference to a code element."""

    element_id: str = Field(alias="elementId")


class CodeHighlightPayload(CodeTargetPayload):
    """Lines to highlight inside an expanded code block."""

    lines: list[int] = Field(default_factory=list)

    @field_validator("lines", mode="before")
    @classmethod
    def clean_lines(cls, value: object) -> list[int]:
        """Keep only integer-like line numbers."""
        if not isinstance(value, list):
            raise ValueError("lines must be a list")
        return [int(x) for x in value if (isinstance(x, int) and not isinstance(x, bool)) or (isinstance(x, str) and x.isdigit())]


class CodeScrollPayload(CodeTargetPayload):
    """Scroll offset of an expanded code block."""

    scroll_top: int = Field(default=0, alias="scrollTop")

    @field_validator("scroll_top", mode="before")
    @classmethod
    def coerce_scroll(cls, value: object) -> int:
        """Fall back to the top when the offset is not numeric."""
        try:
            return int(value)  # type: ignore[call-overload]
        except (TypeError, ValueError):
            return 0


def _new_overlay(element_id: str, lines: list[int] | None = None) -> dict[str, object]:
    """Build the overlay state for an expanded code block.

    Args:
        element_id: Expanded code element id.
        lines: Initially highlighted lines.

    Returns:
        Overlay state stored on the room.
    """
    return {"elementId": element_id, "expanded": True, "highlightedLines": lines or [], "scrollTop": 0}


@room_events.register
class CodeExpand(RoomEvent[CodeTargetPayload]):
    """Expand a code block over the slide."""

    type = "CODE_EXPAND"
    payload_model = CodeTargetPayload

    async def handle(self, ctx: EventContext, payload: CodeTargetPayload) -> None:
        """Open the overlay and notify the room."""
        ctx.room.code_overlay = _new_overlay(payload.element_id)
        await ctx.broadcast("CODE_EXPANDED", {"elementId": payload.element_id, "by": ctx.role})


@room_events.register
class CodeCollapse(RoomEvent[EmptyPayload]):
    """Collapse the expanded code block."""

    type = "CODE_COLLAPSE"

    async def handle(self, ctx: EventContext, payload: EmptyPayload) -> None:
        """Close the overlay, if any, and notify the room."""
        if ctx.room.code_overlay is None:
            return
        element_id = ctx.room.code_overlay.get("elementId")
        ctx.room.code_overlay = None
        await ctx.broadcast("CODE_COLLAPSED", {"elementId": element_id, "by": ctx.role})


@room_events.register
class CodeHighlight(RoomEvent[CodeHighlightPayload]):
    """Highlight lines of a code block, expanding it when needed."""

    type = "CODE_HIGHLIGHT"
    payload_model = CodeHighlightPayload

    async def handle(self, ctx: EventContext, payload: CodeHighlightPayload) -> None:
        """Store the highlighted lines and notify the room."""
        overlay = ctx.room.code_overlay
        if overlay and overlay.get("elementId") == payload.element_id:
            overlay["highlightedLines"] = payload.lines
        else:
            ctx.room.code_overlay = _new_overlay(payload.element_id, payload.lines)
        await ctx.broadcast("CODE_HIGHLIGHT_CHANGED", {"elementId": payload.element_id, "lines": payload.lines, "by": ctx.role})


@room_events.register
class CodeScroll(RoomEvent[CodeScrollPayload]):
    """Sync the scroll position of the expanded code block."""

    type = "CODE_SCROLL"
    payload_model = CodeScrollPayload

    async def handle(self, ctx: EventContext, payload: CodeScrollPayload) -> None:
        """Store the scroll offset and notify the room."""
        overlay = ctx.room.code_overlay
        if overlay and overlay.get("elementId") == payload.element_id:
            overlay["scrollTop"] = payload.scroll_top
        await ctx.broadcast("CODE_SCROLL_CHANGED", {"elementId": payload.element_id, "scrollTop": payload.scroll_top, "by": ctx.role})
