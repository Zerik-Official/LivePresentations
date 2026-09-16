from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings

# Project root = LivePresentations/ (two levels above apps/backend/app/core)
_PROJECT_ROOT = Path(__file__).resolve().parents[4]
_DEFAULT_DB_PATH = _PROJECT_ROOT / "instance" / "livepresentations.db"


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    app_name: str = "LivePresentations"
    secret_key: str = "change-me-in-production-use-env"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    database_url: str = f"sqlite+aiosqlite:///{_DEFAULT_DB_PATH.as_posix()}"

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()