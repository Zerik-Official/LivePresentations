from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.deps import get_current_user
from app.core.config import settings
from app.models.user import User

router = APIRouter(prefix="/uploads", tags=["uploads"])

_DB_PATH = settings.database_url.replace("sqlite+aiosqlite:///", "")
_INSTANCE_DIR = Path(_DB_PATH).parent if _DB_PATH else Path("instance")
UPLOAD_DIR = _INSTANCE_DIR / "uploads"
MAX_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"}
ALLOWED_VIDEO = {"video/mp4", "video/webm", "video/ogg", "video/quicktime"}
ALLOWED = ALLOWED_IMAGE | ALLOWED_VIDEO


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user)) -> dict[str, str]:
    """Upload an image or video up to 100MB.

    Returns a static URL that can be used as element src.
    """
    if file.content_type not in ALLOWED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tipo de archivo no permitido. Usa imagen o video.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Archivo excede 100MB")

    ext = Path(file.filename or "file").suffix or ""
    if not ext:
        ext = ".bin"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / filename
    dest.write_bytes(data)

    # URL served via static mount /static/uploads/{filename}
    url = f"/static/uploads/{filename}"
    return {"url": url, "filename": filename, "content_type": file.content_type or "application/octet-stream"}
