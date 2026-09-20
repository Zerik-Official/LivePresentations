from __future__ import annotations

import json
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_INSTANCE_DIR = _BACKEND_ROOT / "instance"
_DEFAULT_DB_PATH = _INSTANCE_DIR / "livepresentations.db"


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    app_name: str = "LivePresentations"
    secret_key: str = "change-me-in-production-use-env"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    database_url: str = f"sqlite+aiosqlite:///{_DEFAULT_DB_PATH.as_posix()}"

    cors_origins: str = "*"
    enable_turnstille_captcha: bool = True
    turnstile_public_key: str = ""
    turnstile_private_key: str = ""
    upload_quota_mb: int = 20

    model_config = SettingsConfigDict(
        env_file=_BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def resolve_sqlite_path(cls, value: object) -> str:
        database_url = str(value)
        prefix = "sqlite+aiosqlite:///"
        if not database_url.startswith(prefix):
            return database_url
        database_path = database_url[len(prefix):]
        if database_path in {":memory:", ""}:
            return database_url
        path = Path(database_path)
        if not path.is_absolute():
            path = _BACKEND_ROOT / path if path.parts and path.parts[0] == "instance" else _INSTANCE_DIR / path
        return f"{prefix}{path.resolve().as_posix()}"

    @property
    def turnstile_enabled(self) -> bool:
        return self.enable_turnstille_captcha and bool(self.turnstile_public_key and self.turnstile_private_key)

    @property
    def parsed_cors_origins(self) -> list[str]:
        """Parse comma-separated or JSON CORS origins from the environment."""
        try:
            parsed = json.loads(self.cors_origins)
            if isinstance(parsed, list):
                return [str(origin).strip() for origin in parsed if str(origin).strip()] or ["*"]
        except json.JSONDecodeError:
            pass
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()] or ["*"]

    @property
    def upload_quota_bytes(self) -> int:
        return max(1, self.upload_quota_mb) * 1024 * 1024

    @property
    def instance_dir(self) -> Path:
        return _INSTANCE_DIR

    @property
    def upload_dir(self) -> Path:
        return _INSTANCE_DIR / "uploads"


settings = Settings()