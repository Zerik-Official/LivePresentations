from __future__ import annotations

from collections.abc import AsyncGenerator

from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.db.base import Base

# Ensure instance directory exists before creating engine
_db_path = settings.database_url.replace("sqlite+aiosqlite:///", "")
if _db_path and not _db_path.startswith(":memory:"):
    Path(_db_path).parent.mkdir(parents=True, exist_ok=True)

engine = create_async_engine(settings.database_url, echo=False, future=True)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session."""
    async with async_session_factory() as session:
        yield session


async def init_db() -> None:
    """Create all tables."""
    import app.models.presentation  # noqa: F401
    import app.models.user  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
