from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from datetime import datetime, timezone

from app.api.deps import get_current_user
from app.core.rooms import RoomState, _generate_code, room_manager
from app.db.session import get_db
from app.models.presentation import Presentation
from app.models.room import Room
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

    for _ in range(10):
        code = _generate_code()
        exists = await db.execute(select(Room).where(Room.code == code))
        if exists.scalar_one_or_none() is None:
            room = Room(code=code, presentation_id=payload.presentation_id, owner_id=current_user.id)
            db.add(room)
            await db.commit()
            await db.refresh(room)
            room_manager._rooms[code] = RoomState(code=code, presentation_id=payload.presentation_id, owner_id=current_user.id, current_slide=room.current_slide, highlighted_id=room.highlighted_id, expires_at=room.expires_at)
            return RoomRead(code=room.code, presentation_id=room.presentation_id, current_slide=room.current_slide, highlighted_id=room.highlighted_id)
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo generar código")


@router.get("/{code}", response_model=RoomRead)
async def get_room(code: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> RoomRead:
    """Get room state by code (requires auth)."""
    room_mem = room_manager.get(code)
    if room_mem:
        return RoomRead(code=room_mem.code, presentation_id=room_mem.presentation_id, current_slide=room_mem.current_slide, highlighted_id=room_mem.highlighted_id)
    result = await db.execute(select(Room).where(Room.code == code.upper()))
    room = result.scalar_one_or_none()
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala no encontrada o expirada")
    if room.expires_at:
        exp = room.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > exp:
            await db.delete(room)
            await db.commit()
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala expirada")
    room_manager._rooms[room.code] = RoomState(code=room.code, presentation_id=room.presentation_id, owner_id=room.owner_id, current_slide=room.current_slide, highlighted_id=room.highlighted_id, expires_at=room.expires_at)
    return RoomRead(code=room.code, presentation_id=room.presentation_id, current_slide=room.current_slide, highlighted_id=room.highlighted_id)


@router.get("", response_model=list[RoomRead])
async def list_rooms(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[RoomRead]:
    """List active rooms for current user."""
    result = await db.execute(select(Room).where(Room.owner_id == current_user.id).order_by(Room.created_at.desc()))
    rooms = result.scalars().all()
    now = datetime.now(timezone.utc)
    def _is_active(r: Room) -> bool:
        if r.expires_at is None:
            return True
        exp = r.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        return exp > now
    active = [r for r in rooms if _is_active(r)]
    return [RoomRead(code=r.code, presentation_id=r.presentation_id, current_slide=r.current_slide, highlighted_id=r.highlighted_id) for r in active]


@router.delete("/{code}", status_code=status.HTTP_200_OK)
async def delete_room(code: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """Delete a room if owned."""
    result = await db.execute(select(Room).where(Room.code == code.upper()))
    room = result.scalar_one_or_none()
    if room is None or room.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala no encontrada")
    room_manager.delete(room.code)
    await db.delete(room)
    await db.commit()
    return {"status": "deleted"}
