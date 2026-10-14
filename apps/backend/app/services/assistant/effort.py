from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

#: How hard the assistant works on a request, chosen by the user per message.
EffortLevel = Literal["low", "medium", "high", "max"]


@dataclass(frozen=True)
class EffortProfile:
    """Budget and working style of one effort level."""

    #: Maximum model calls in one turn; each tool round trip uses one.
    max_steps: int
    #: Instructions appended to the system prompt.
    guidance: str


EFFORT_PROFILES: dict[EffortLevel, EffortProfile] = {
    "low": EffortProfile(
        max_steps=12,
        guidance=(
            "Effort: low. Work fast and spend as few tokens as possible. Do exactly what was asked with simple, clean layouts. "
            "Skip get_presentation unless you must edit existing elements, do not review your work afterwards, and reply in one or two sentences."
        ),
    ),
    "medium": EffortProfile(
        max_steps=28,
        guidance=(
            "Effort: medium. Balance quality and cost. Give each slide a clear hierarchy and a consistent style. "
            "Reply with a short summary."
        ),
    ),
    "high": EffortProfile(
        max_steps=48,
        guidance=(
            "Effort: high. Before building, decide the structure, palette and typography of the whole deck. Vary layouts between slides, "
            "write substantive content and speaker notes, and add entrance animations where they help the story. "
            "When you finish, call get_presentation once and fix any overlap, overflow or misalignment you find."
        ),
    ),
    "max": EffortProfile(
        max_steps=80,
        guidance=(
            "Effort: maximum. Produce the best possible result regardless of cost. Plan the narrative first, then build polished, varied "
            "slides with rich but readable content, speaker notes on every slide, and purposeful animations (entrances, emphasis triggered "
            "from the controller, or custom keyframes when a preset is not enough). After building, review every slide with "
            "get_presentation, fix every layout problem, and review again until nothing is left to improve."
        ),
    ),
}


def get_effort_profile(level: str) -> EffortProfile:
    """Resolve an effort level, defaulting to medium for unknown values.

    Args:
        level: Requested effort level.

    Returns:
        Matching profile.
    """
    return EFFORT_PROFILES.get(level, EFFORT_PROFILES["medium"])  # type: ignore[call-overload]
