from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.rooms import room_manager
from app.db.session import get_db
from app.models.presentation import Presentation
from app.models.user import User

router = APIRouter(prefix="/rooms", tags=["rooms"])


class RoomCreate(BaseModel):
    """Payload to create a room."""

    presentation_id: str


class RoomRead(BaseModel):
    """Room info returned to client."""

    code: str
    presentation_id: str
    current_slide: int
    highlighted_id: str | None


@router.post("", response_model=RoomRead, status_code=status.HTTP_201_CREATED)
async def create_room(
    payload: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoomRead:
    """Create a room for a presentation owned by the user."""
    result = await db.execute(select(Presentation).where(Presentation.id == payload.presentation_id))
    pres = result.scalar_one_or_none()
    if pres is None or pres.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentación no encontrada")

    room = room_manager.create(presentation_id=payload.presentation_id, owner_id=current_user.id)
    return RoomRead(code=room.code, presentation_id=room.presentation_id, current_slide=room.current_slide, highlighted_id=room.highlighted_id)


@router.get("/{code}", response_model=RoomRead)
async def get_room(code: str, current_user: User = Depends(get_current_user)) -> RoomRead:
    """Get room state by code (requires auth)."""
    room = room_manager.get(code)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala no encontrada o expirada")
    return RoomRead(code=room.code, presentation_id=room.presentation_id, current_slide=room.current_slide, highlighted_id=room.highlighted_id)
