from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI
from sqlalchemy import delete
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes.auth import router as auth_router
from app.api.routes.presentations import router as presentations_router
from app.api.routes.rooms import router as rooms_router
from app.api.routes.uploads import router as uploads_router
from app.api.routes.users import router as users_router
from app.core.config import settings
from app.db.session import init_db
from app.ws.router import router as ws_router


@asynccontextmanager
async def lifespan(_app: FastAPI):  # type: ignore[no-untyped-def]
    """Initialize database and start periodic cleanup for expired rooms."""
    await init_db()

    async def cleanup_expired_rooms() -> None:
        """Delete expired rooms every hour and old uploads."""
        from app.db.session import async_session_factory
        from app.models.room import Room

        while True:
            try:
                async with async_session_factory() as db:
                    now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
                    await db.execute(delete(Room).where(Room.expires_at < now_naive))
                    await db.commit()
                if _upload_dir.exists():
                    cutoff = datetime.now(timezone.utc).timestamp() - 7 * 24 * 3600
                    for f in _upload_dir.iterdir():
                        try:
                            if f.is_file() and f.stat().st_mtime < cutoff:
                                f.unlink()
                        except Exception:
                            pass
            except Exception:
                pass
            await asyncio.sleep(3600)

    task = asyncio.create_task(cleanup_expired_rooms())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(presentations_router, prefix="/api")
app.include_router(rooms_router, prefix="/api")
app.include_router(uploads_router, prefix="/api")
app.include_router(ws_router)

_db_path = settings.database_url.replace("sqlite+aiosqlite:///", "")
_instance = Path(_db_path).parent if _db_path else Path("instance")
_upload_dir = _instance / "uploads"
_upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(_instance)), name="static")


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/api/health")
async def api_health() -> dict[str, str]:
    """API health check."""
    return {"status": "ok"}
