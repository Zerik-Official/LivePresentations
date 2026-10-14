from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.db.session import get_db
from app.models.presentation import Presentation
from app.models.user import User
from app.schemas.user import PasswordChange, UserProfileUpdate, UserRead, UserStatsRead
from app.services.sessions import revoke_all_sessions, start_session

router = APIRouter(prefix="/users", tags=["users"])

AVATAR_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
AVATAR_MAX_BYTES = 5 * 1024 * 1024
AVATAR_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
}


def _utcnow() -> datetime:
    """Return the current UTC datetime.

    Returns:
        Current timezone-aware UTC datetime.
    """
    return datetime.now(timezone.utc)


def _disk_usage_bytes(directory: Path) -> int:
    """Compute total size of files inside a directory.

    Args:
        directory: Directory to measure.

    Returns:
        Total size in bytes, zero when the directory does not exist.
    """
    if not directory.exists():
        return 0
    return sum(path.stat().st_size for path in directory.rglob("*") if path.is_file())


def _avatar_path_for(user_id: str, content_type: str) -> tuple[Path, str]:
    """Resolve avatar storage path and public URL for a user.

    Args:
        user_id: Owner identifier used as folder name.
        content_type: Validated image content type.

    Returns:
        Tuple with destination path and public static URL.
    """
    extension = AVATAR_EXTENSIONS[content_type]
    filename = f"avatar{extension}"
    user_dir = settings.avatar_dir / user_id
    dest = user_dir / filename
    url = f"/static/avatars/{user_id}/{filename}"
    return dest, url


def _remove_previous_avatars(user_dir: Path, keep: Path | None = None) -> None:
    """Remove stale avatar files for a user.

    Args:
        user_dir: User avatar directory.
        keep: Optional path that must be preserved.
    """
    if not user_dir.exists():
        return
    for path in user_dir.iterdir():
        if path.is_file() and path.name.startswith("avatar") and (keep is None or path != keep):
            path.unlink(missing_ok=True)


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    """Return the authenticated user."""
    return UserRead.model_validate(current_user)


@router.get("/me/stats", response_model=UserStatsRead)
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserStatsRead:
    """Return presentation count and storage quota usage.

    Args:
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Aggregated usage statistics with quota derived from settings.
    """
    count_result = await db.execute(
        select(func.count()).select_from(Presentation).where(Presentation.owner_id == current_user.id)
    )
    presentations_count = int(count_result.scalar_one())
    quota_bytes = settings.upload_quota_bytes
    used_bytes = _disk_usage_bytes(settings.upload_dir / current_user.id)
    return UserStatsRead(
        presentations_count=presentations_count,
        used_bytes=used_bytes,
        quota_bytes=quota_bytes,
        remaining_bytes=max(0, quota_bytes - used_bytes),
    )


@router.patch("/me", response_model=UserRead)
async def update_me(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    """Update editable profile fields.

    Args:
        payload: Profile fields to update.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Updated user representation.
    """
    display_name = (payload.display_name or "").strip()
    current_user.display_name = display_name or None
    await db.commit()
    await db.refresh(current_user)
    return UserRead.model_validate(current_user)


@router.post("/me/password", status_code=status.HTTP_200_OK)
async def change_my_password(
    payload: PasswordChange,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Change the account password after verifying the current one.

    Accounts created with Google have no password yet, so they can set one
    without providing the current password.

    Args:
        payload: Current and new passwords.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Confirmation status.
    """
    if current_user.has_password:
        if not payload.current_password or not verify_password(payload.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña actual no es correcta",
            )
        if payload.current_password == payload.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La nueva contraseña debe ser diferente a la actual",
            )
    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.has_password = True
    await db.commit()
    # A new password closes every other session; this one continues with fresh tokens.
    await revoke_all_sessions(db, current_user.id)
    await start_session(db, current_user, response)
    return {"status": "updated"}


@router.post("/me/avatar", response_model=UserRead)
async def upload_my_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    """Upload or replace the profile picture.

    Args:
        file: Image file up to 5MB.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Updated user representation with avatar URL.
    """
    content_type = file.content_type or ""
    if content_type not in AVATAR_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de archivo no permitido. Usa JPG, PNG, GIF o WebP.",
        )
    dest, url = _avatar_path_for(current_user.id, content_type)
    dest.parent.mkdir(parents=True, exist_ok=True)

    size = 0
    cache_suffix = uuid.uuid4().hex[:8]
    tmp_dest = dest.parent / f"avatar-{cache_suffix}.tmp"
    with tmp_dest.open("wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > AVATAR_MAX_BYTES:
                out.close()
                tmp_dest.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="La imagen supera los 5MB permitidos",
                )
            out.write(chunk)
    if size == 0:
        tmp_dest.unlink(missing_ok=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo está vacío")
    _remove_previous_avatars(dest.parent, keep=tmp_dest)
    tmp_dest.rename(dest)

    current_user.avatar_url = f"{url}?v={cache_suffix}"
    await db.commit()
    await db.refresh(current_user)
    return UserRead.model_validate(current_user)


@router.delete("/me/avatar", response_model=UserRead)
async def delete_my_avatar(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    """Remove the profile picture.

    Args:
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Updated user representation without avatar URL.
    """
    user_dir = settings.avatar_dir / current_user.id
    _remove_previous_avatars(user_dir)
    current_user.avatar_url = None
    await db.commit()
    await db.refresh(current_user)
    return UserRead.model_validate(current_user)
