from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ProviderRead(BaseModel):
    """AI provider the user can configure."""

    id: str
    label: str
    default_base_url: str
    key_url: str
    requires_base_url: bool


class CredentialUpsert(BaseModel):
    """Payload to create or update the credential of a provider.

    `api_key` may be omitted when updating to keep the stored key.
    """

    api_key: str | None = Field(default=None, min_length=8, max_length=512)
    model: str = Field(min_length=1, max_length=200)
    base_url: str | None = Field(default=None, max_length=512)
    activate: bool = True


class CredentialRead(BaseModel):
    """Stored credential without the key itself."""

    provider: str
    label: str
    key_hint: str
    model: str
    base_url: str | None
    is_active: bool
    updated_at: datetime


class ModelsRequest(BaseModel):
    """Payload to list the models a key can use.

    Omit `api_key` to use the key already stored for the provider.
    """

    provider: str
    api_key: str | None = Field(default=None, min_length=8, max_length=512)
    base_url: str | None = Field(default=None, max_length=512)


class UsageDay(BaseModel):
    """Token usage aggregated for one calendar day."""

    date: str
    input_tokens: int
    output_tokens: int
    requests: int


class UsageModel(BaseModel):
    """Token usage aggregated for one provider model."""

    provider: str
    model: str
    input_tokens: int
    output_tokens: int
    requests: int


class UsageSummary(BaseModel):
    """Token usage over a period, with daily and per-model breakdowns."""

    days: int
    input_tokens: int
    output_tokens: int
    requests: int
    has_estimates: bool
    by_day: list[UsageDay]
    by_model: list[UsageModel]
