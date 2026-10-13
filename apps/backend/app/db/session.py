from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy import Connection, inspect, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.db.base import Base

settings.instance_dir.mkdir(parents=True, exist_ok=True)

engine = create_async_engine(settings.database_url, echo=False, future=True)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

# Columns added after the first release: table -> column -> DDL type and default.
# `create_all` never alters existing tables, so they are added on startup.
_ADDED_COLUMNS: dict[str, dict[str, str]] = {
    "users": {
        "has_password": "BOOLEAN NOT NULL DEFAULT '1'",
        "google_sub": "VARCHAR(255)",
        # Accounts that predate email verification keep working without a code.
        "email_verified": "BOOLEAN NOT NULL DEFAULT '1'",
        "email_verified_at": "TIMESTAMP",
    },
    "rooms": {
        "is_public": "BOOLEAN NOT NULL DEFAULT '0'",
    },
}
_ADDED_INDEXES: tuple[str, ...] = ("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_sub ON users (google_sub)",)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session."""
    async with async_session_factory() as session:
        yield session


def _add_missing_columns(conn: Connection) -> None:
    """Add columns introduced after a database was first created.

    Args:
        conn: Synchronous connection provided by `run_sync`.
    """
    inspector = inspect(conn)
    for table, columns in _ADDED_COLUMNS.items():
        if not inspector.has_table(table):
            continue
        existing = {column["name"] for column in inspector.get_columns(table)}
        for name, ddl in columns.items():
            if name not in existing:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))
    for statement in _ADDED_INDEXES:
        conn.execute(text(statement))


async def init_db() -> None:
    """Create all tables and apply additive column upgrades."""
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_add_missing_columns)
