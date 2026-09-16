from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.presentations import router as presentations_router
from app.api.routes.rooms import router as rooms_router
from app.api.routes.users import router as users_router
from app.core.config import settings
from app.db.session import init_db
from app.ws.router import router as ws_router


@asynccontextmanager
async def lifespan(_app: FastAPI):  # type: ignore[no-untyped-def]
    """Initialize database on startup."""
    await init_db()
    yield


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
app.include_router(ws_router)


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/api/health")
async def api_health() -> dict[str, str]:
    """API health check."""
    return {"status": "ok"}
