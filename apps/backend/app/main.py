from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from sqlalchemy import delete
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes.ai import router as ai_router
from app.api.routes.auth import router as auth_router
from app.api.routes.presentations import router as presentations_router
from app.api.routes.rooms import router as rooms_router
from app.api.routes.uploads import router as uploads_router
from app.api.routes.users import router as users_router
from app.core.config import settings
from app.db.session import init_db
from app.ws.assistant import router as assistant_ws_router
from app.ws.router import router as ws_router


@asynccontextmanager
async def lifespan(_app: FastAPI):  # type: ignore[no-untyped-def]
    """Initialize database and start periodic cleanup for expired rooms."""
    await init_db()

    async def cleanup_expired_rooms() -> None:
        """Delete expired rooms, sessions, codes and old uploads every hour."""
        from app.db.session import async_session_factory
        from app.models.auth import EmailOtp, RefreshToken
        from app.models.room import Room

        while True:
            try:
                async with async_session_factory() as db:
                    now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
                    await db.execute(delete(Room).where(Room.expires_at < now_naive))
                    await db.execute(delete(RefreshToken).where(RefreshToken.expires_at < now_naive))
                    await db.execute(delete(EmailOtp).where(EmailOtp.expires_at < now_naive))
                    await db.commit()
                if settings.upload_dir.exists():
                    cutoff = datetime.now(timezone.utc).timestamp() - 7 * 24 * 3600
                    for f in settings.upload_dir.rglob("*"):
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


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)


_allow_all = "*" in settings.parsed_cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_cors_origins if not _allow_all else ["*"],
    allow_credentials=False if _allow_all else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(presentations_router, prefix="/api")
app.include_router(rooms_router, prefix="/api")
app.include_router(uploads_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(ws_router)
app.include_router(assistant_ws_router)

settings.instance_dir.mkdir(parents=True, exist_ok=True)
settings.upload_dir.mkdir(parents=True, exist_ok=True)
settings.avatar_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(settings.instance_dir)), name="static")


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/api/health")
async def api_health() -> dict[str, str]:
    """API health check."""
    return {"status": "ok"}


@app.get("/api/config")
async def public_config() -> dict[str, object]:
    """Return public runtime configuration needed by the frontend."""
    return {
        "turnstile_enabled": settings.turnstile_enabled,
        "turnstile_site_key": settings.turnstile_public_key if settings.turnstile_enabled else None,
        "upload_quota_bytes": settings.upload_quota_bytes,
        "google_client_id": settings.google_client_id.strip() or None,
        "email_verification_enabled": settings.email_verification_enabled,
    }