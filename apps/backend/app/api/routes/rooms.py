from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.rooms import RoomState, _generate_code, is_expired, room_manager
from app.db.session import get_db
from app.models.presentation import Presentation
from app.models.room import Room
from app.models.user import User
from app.ws.events.base import VIEWER_ROLE
from app.ws.manager import ws_manager

router = APIRouter(prefix="/rooms", tags=["rooms"])

CONFIG_FIELDS = ("show_controls", "fullscreen", "anti_spoiler", "auto_fullscreen", "is_public")


class RoomCreate(BaseModel):
    """Payload to create a room."""

    presentation_id: str


class RoomRead(BaseModel):
    """Room info returned to client."""

    model_config = ConfigDict(from_attributes=True)

    code: str
    presentation_id: str
    current_slide: int
    highlighted_id: str | None
    show_controls: bool = True
    fullscreen: bool = False
    anti_spoiler: bool = False
    auto_fullscreen: bool = True
    is_public: bool = False


class RoomConfigUpdate(BaseModel):
    """Payload to update room config."""

    show_controls: bool | None = None
    fullscreen: bool | None = None
    anti_spoiler: bool | None = None
    auto_fullscreen: bool | None = None
    is_public: bool | None = None


class PublicRoomRead(BaseModel):
    """What an anonymous viewer of a public room may load."""

    code: str
    title: str
    total_slides: int
    data: dict[str, object]


def _public_presentation_data(raw: str, max_slide: int) -> tuple[dict[str, object], int]:
    """Reduce a presentation to what viewers are allowed to see.

    Viewers get the slides already shown, without speaker notes, so reading
    the response cannot reveal what comes next.

    Args:
        raw: Stored presentation JSON.
        max_slide: Furthest slide index shown so far.

    Returns:
        Tuple with the reduced data and the total number of slides.
    """
    try:
        data = json.loads(raw)
    except ValueError:
        data = {}
    if not isinstance(data, dict):
        data = {}
    slides = data.get("slides") if isinstance(data.get("slides"), list) else []
    visible = [{key: value for key, value in slide.items() if key != "notes"} for slide in slides[: max_slide + 1] if isinstance(slide, dict)]
    return {**data, "slides": visible}, len(slides)


async def _get_owned_room(code: str, user: User, db: AsyncSession) -> Room:
    """Load a persisted room owned by the user or raise 404.

    Args:
        code: Room code.
        user: Authenticated user.
        db: Database session.

    Returns:
        Persisted room owned by the user.
    """
    result = await db.execute(select(Room).where(Room.code == code.upper()))
    room = result.scalar_one_or_none()
    if room is None or room.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala no encontrada")
    return room


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
            room_manager.put(RoomState.from_model(room))
            return RoomRead.model_validate(room)
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo generar código")


@router.get("/{code}/public", response_model=PublicRoomRead)
async def get_public_room(code: str, db: AsyncSession = Depends(get_db)) -> PublicRoomRead:
    """Load a public room for an anonymous viewer.

    Private rooms answer exactly like missing ones, so codes cannot be probed.

    Args:
        code: Room code.
        db: Database session.

    Returns:
        Room code, title and the slides shown so far.
    """
    room = await room_manager.resolve(code, db)
    if room is None or not room.is_public:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala no encontrada")
    result = await db.execute(select(Presentation).where(Presentation.id == room.presentation_id))
    presentation = result.scalar_one_or_none()
    if presentation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala no encontrada")
    data, total = _public_presentation_data(presentation.data, room.max_slide)
    return PublicRoomRead(code=room.code, title=presentation.title, total_slides=total, data=data)


@router.get("/{code}", response_model=RoomRead)
async def get_room(code: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> RoomRead:
    """Get room state by code (requires auth)."""
    room = await room_manager.resolve(code, db)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala no encontrada o expirada")
    return RoomRead.model_validate(room)


@router.get("", response_model=list[RoomRead])
async def list_rooms(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[RoomRead]:
    """List active rooms for current user."""
    result = await db.execute(select(Room).where(Room.owner_id == current_user.id).order_by(Room.created_at.desc()))
    return [RoomRead.model_validate(r) for r in result.scalars().all() if not is_expired(r.expires_at)]


@router.patch("/{code}/config", response_model=RoomRead)
async def update_room_config(code: str, payload: RoomConfigUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> RoomRead:
    """Update room config flags and notify connected clients."""
    room = await _get_owned_room(code, current_user, db)
    changes = payload.model_dump(exclude_none=True)
    for name, value in changes.items():
        setattr(room, name, value)
    await db.commit()
    await db.refresh(room)

    state = room_manager.get(room.code)
    if state is None:
        state = room_manager.put(RoomState.from_model(room))
    else:
        for name, value in changes.items():
            setattr(state, name, value)
    await ws_manager.broadcast(room.code, {"type": "ROOM_CONFIG_CHANGED", "payload": {name: getattr(room, name) for name in CONFIG_FIELDS}})
    if changes.get("is_public") is False:
        await ws_manager.close_role(room.code, VIEWER_ROLE, 4404, "La sala ya no es pública")
    return RoomRead.model_validate(room)


@router.delete("/{code}", status_code=status.HTTP_200_OK)
async def delete_room(code: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """Delete a room if owned."""
    room = await _get_owned_room(code, current_user, db)
    room_manager.delete(room.code)
    await db.delete(room)
    await db.commit()
    return {"status": "deleted"}
