from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.rooms import room_manager
from app.db.session import get_db
from app.models.presentation import Presentation
from app.models.room import Room
from app.models.user import User
from app.schemas.presentation import PresentationCreate, PresentationRead, PresentationUpdate
from app.services.presentation_package import build_export_zip, import_presentation_zip

router = APIRouter(prefix="/presentations", tags=["presentations"])


def _to_read(obj: Presentation) -> PresentationRead:
    """Convert ORM object to read schema."""
    return PresentationRead.from_orm_with_json(obj)


@router.post("", response_model=PresentationRead, status_code=status.HTTP_201_CREATED)
async def create_presentation(
    payload: PresentationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PresentationRead:
    """Create a presentation for the current user."""
    pres = Presentation(owner_id=current_user.id, title=payload.title.strip(), data=json.dumps(payload.data))
    db.add(pres)
    await db.commit()
    await db.refresh(pres)
    return _to_read(pres)


@router.get("", response_model=list[PresentationRead])
async def list_presentations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PresentationRead]:
    """List presentations owned by current user."""
    result = await db.execute(select(Presentation).where(Presentation.owner_id == current_user.id).order_by(Presentation.updated_at.desc()))
    items = result.scalars().all()
    return [_to_read(p) for p in items]


@router.get("/{presentation_id}", response_model=PresentationRead)
async def get_presentation(
    presentation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PresentationRead:
    """Get a single presentation if owned."""
    result = await db.execute(select(Presentation).where(Presentation.id == presentation_id))
    pres = result.scalar_one_or_none()
    if pres is None or pres.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentación no encontrada")
    return _to_read(pres)


@router.put("/{presentation_id}", response_model=PresentationRead)
async def update_presentation(
    presentation_id: str,
    payload: PresentationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PresentationRead:
    """Update a presentation if owned."""
    result = await db.execute(select(Presentation).where(Presentation.id == presentation_id))
    pres = result.scalar_one_or_none()
    if pres is None or pres.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentación no encontrada")
    if payload.title is not None:
        pres.title = payload.title.strip()
    if payload.data is not None:
        pres.data = json.dumps(payload.data)
    await db.commit()
    await db.refresh(pres)
    return _to_read(pres)


@router.get("/{presentation_id}/export", response_class=StreamingResponse)
async def export_presentation_zip(
    presentation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Export presentation as zip package with manifest, slices, variables and assets."""
    result = await db.execute(select(Presentation).where(Presentation.id == presentation_id))
    pres = result.scalar_one_or_none()
    if pres is None or pres.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentación no encontrada")
    data, filename = await build_export_zip(pres)
    from io import BytesIO

    return StreamingResponse(BytesIO(data), media_type="application/zip", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.post("/import-zip", response_model=PresentationRead, status_code=status.HTTP_201_CREATED)
async def import_presentation_zip_endpoint(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PresentationRead:
    """Import presentation from zip package."""
    title, data = await import_presentation_zip(file, current_user.id)
    pres = Presentation(owner_id=current_user.id, title=title, data=json.dumps(data))
    db.add(pres)
    await db.commit()
    await db.refresh(pres)
    return _to_read(pres)


@router.delete("/{presentation_id}", status_code=status.HTTP_200_OK)
async def delete_presentation(
    presentation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Delete a presentation and its associated rooms if owned."""
    result = await db.execute(select(Presentation).where(Presentation.id == presentation_id))
    pres = result.scalar_one_or_none()
    if pres is None or pres.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentación no encontrada")
    rooms_res = await db.execute(select(Room).where(Room.presentation_id == presentation_id))
    for room in rooms_res.scalars().all():
        room_manager.delete(room.code)
        await db.delete(room)
    await db.delete(pres)
    await db.commit()
    return {"status": "deleted"}