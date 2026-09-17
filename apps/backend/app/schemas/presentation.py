from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PresentationCreate(BaseModel):
    """Payload to create a presentation."""

    title: str = Field(min_length=1, max_length=200)
    data: dict[str, Any] = Field(default_factory=dict)


class PresentationUpdate(BaseModel):
    """Payload to update a presentation."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    data: dict[str, Any] | None = None


class PresentationRead(BaseModel):
    """Public presentation representation."""

    id: str
    owner_id: str
    title: str
    data: dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_json(cls, obj: Any) -> PresentationRead:
        """Create instance converting JSON string field."""
        raw = obj.data if isinstance(obj.data, str) else json.dumps(obj.data)
        try:
            parsed = json.loads(raw) if isinstance(raw, str) else raw
        except json.JSONDecodeError:
            parsed = {}
        return cls(
            id=obj.id,
            owner_id=obj.owner_id,
            title=obj.title,
            data=parsed if isinstance(parsed, dict) else {},
            created_at=obj.created_at,
            updated_at=obj.updated_at,
        )
