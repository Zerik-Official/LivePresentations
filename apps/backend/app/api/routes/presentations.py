from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.presentation import Presentation
from app.models.user import User
from app.schemas.presentation import PresentationCreate, PresentationRead, PresentationUpdate

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


@router.delete("/{presentation_id}", status_code=status.HTTP_200_OK)
async def delete_presentation(
    presentation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Delete a presentation if owned."""
    result = await db.execute(select(Presentation).where(Presentation.id == presentation_id))
    pres = result.scalar_one_or_none()
    if pres is None or pres.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentación no encontrada")
    await db.delete(pres)
    await db.commit()
    return {"status": "deleted"}
