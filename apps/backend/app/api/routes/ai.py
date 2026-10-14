from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.crypto import SecretDecryptionError, decrypt_secret, encrypt_secret, mask_secret
from app.db.session import get_db
from app.models.ai import AICredential, AIUsage
from app.models.user import User
from app.schemas.ai import (
    CredentialRead,
    CredentialUpsert,
    ModelsRequest,
    ProviderRead,
    UsageDay,
    UsageModel,
    UsageSummary,
)
from app.services.ai import AIProvider, AIProviderError, UnsafeBaseUrlError, ai_providers, validate_base_url

router = APIRouter(prefix="/ai", tags=["ai"])


def _get_provider(provider_id: str) -> AIProvider:
    """Resolve a provider from the catalog or raise 404.

    Args:
        provider_id: Provider identifier.

    Returns:
        Registered provider.
    """
    provider = ai_providers.get(provider_id)
    if provider is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor de IA desconocido")
    return provider


async def _resolve_base_url(provider: AIProvider, base_url: str | None) -> tuple[str, str | None]:
    """Decide which base URL a provider request must use.

    Only providers that require a custom URL accept one from the user, and it
    is validated on every use because the backend performs the request.

    Args:
        provider: Target provider.
        base_url: URL supplied by the user, if any.

    Returns:
        Tuple with the URL to call and the value to store (None for presets).
    """
    if not provider.requires_base_url:
        return provider.default_base_url, None
    if not base_url or not base_url.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este proveedor necesita una URL base")
    try:
        validated = await validate_base_url(base_url)
    except UnsafeBaseUrlError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return validated, validated


def _decrypt_key(credential: AICredential) -> str:
    """Decrypt a stored key or ask the user to enter it again.

    Args:
        credential: Stored credential.

    Returns:
        API key in plain text.
    """
    try:
        return decrypt_secret(credential.encrypted_key)
    except SecretDecryptionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La clave guardada ya no se puede leer. Vuelve a introducirla en tu perfil.") from exc


def _to_read(credential: AICredential) -> CredentialRead:
    """Convert a credential row to its public representation.

    Args:
        credential: Stored credential.

    Returns:
        Credential without the key.
    """
    provider = ai_providers.get(credential.provider)
    return CredentialRead(
        provider=credential.provider,
        label=provider.label if provider else credential.provider,
        key_hint=credential.key_hint,
        model=credential.model,
        base_url=credential.base_url,
        is_active=credential.is_active,
        updated_at=credential.updated_at,
    )


async def _get_credential(db: AsyncSession, user_id: str, provider_id: str) -> AICredential | None:
    """Load the credential a user stored for a provider.

    Args:
        db: Database session.
        user_id: Owner identifier.
        provider_id: Provider identifier.

    Returns:
        Credential or None when the user has not configured the provider.
    """
    result = await db.execute(select(AICredential).where(AICredential.user_id == user_id, AICredential.provider == provider_id))
    return result.scalar_one_or_none()


async def _activate(db: AsyncSession, user_id: str, provider_id: str) -> None:
    """Make one provider the active one for a user.

    Args:
        db: Database session.
        user_id: Owner identifier.
        provider_id: Provider to activate.
    """
    await db.execute(update(AICredential).where(AICredential.user_id == user_id).values(is_active=AICredential.provider == provider_id))


@router.get("/providers", response_model=list[ProviderRead])
async def list_providers(_user: User = Depends(get_current_user)) -> list[ProviderRead]:
    """List the AI providers that can be configured."""
    return [ProviderRead(id=p.id, label=p.label, default_base_url=p.default_base_url, key_url=p.key_url, requires_base_url=p.requires_base_url) for p in ai_providers.all()]


@router.get("/credentials", response_model=list[CredentialRead])
async def list_credentials(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[CredentialRead]:
    """List the user's stored credentials; keys are never returned."""
    result = await db.execute(select(AICredential).where(AICredential.user_id == current_user.id).order_by(AICredential.created_at))
    return [_to_read(c) for c in result.scalars().all()]


@router.put("/credentials/{provider_id}", response_model=CredentialRead)
async def upsert_credential(
    provider_id: str,
    payload: CredentialUpsert,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CredentialRead:
    """Store or update the API key and model for a provider.

    The key is encrypted before it reaches the database and only a masked
    hint is ever sent back.

    Args:
        provider_id: Provider identifier.
        payload: Key, model and optional base URL.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Stored credential without the key.
    """
    provider = _get_provider(provider_id)
    _, stored_url = await _resolve_base_url(provider, payload.base_url)
    credential = await _get_credential(db, current_user.id, provider_id)
    api_key = payload.api_key.strip() if payload.api_key else None

    if credential is None:
        if not api_key:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Introduce la clave API")
        credential = AICredential(user_id=current_user.id, provider=provider_id, encrypted_key=encrypt_secret(api_key), key_hint=mask_secret(api_key), model=payload.model.strip(), base_url=stored_url)
        db.add(credential)
    else:
        if api_key:
            credential.encrypted_key = encrypt_secret(api_key)
            credential.key_hint = mask_secret(api_key)
        credential.model = payload.model.strip()
        credential.base_url = stored_url
    await db.flush()

    active = await db.execute(select(func.count()).select_from(AICredential).where(AICredential.user_id == current_user.id, AICredential.is_active.is_(True)))
    if payload.activate or int(active.scalar_one()) == 0:
        await _activate(db, current_user.id, provider_id)
    await db.commit()
    await db.refresh(credential)
    return _to_read(credential)


@router.post("/credentials/{provider_id}/activate", response_model=CredentialRead)
async def activate_credential(provider_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> CredentialRead:
    """Select which stored provider the assistant uses."""
    credential = await _get_credential(db, current_user.id, provider_id)
    if credential is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No hay una clave guardada para este proveedor")
    await _activate(db, current_user.id, provider_id)
    await db.commit()
    await db.refresh(credential)
    return _to_read(credential)


@router.delete("/credentials/{provider_id}", status_code=status.HTTP_200_OK)
async def delete_credential(provider_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """Delete a stored key, activating another provider when one remains."""
    credential = await _get_credential(db, current_user.id, provider_id)
    if credential is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No hay una clave guardada para este proveedor")
    was_active = credential.is_active
    await db.delete(credential)
    await db.flush()
    if was_active:
        remaining = await db.execute(select(AICredential).where(AICredential.user_id == current_user.id).order_by(AICredential.updated_at.desc()).limit(1))
        fallback = remaining.scalar_one_or_none()
        if fallback is not None:
            fallback.is_active = True
    await db.commit()
    return {"status": "deleted"}


@router.post("/models", response_model=list[str])
async def list_models(payload: ModelsRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[str]:
    """List the models available to a key, which also validates the key.

    Args:
        payload: Provider plus an optional new key and base URL.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Sorted model ids.
    """
    provider = _get_provider(payload.provider)
    credential = await _get_credential(db, current_user.id, payload.provider)
    base_url, _ = await _resolve_base_url(provider, payload.base_url or (credential.base_url if credential else None))
    if payload.api_key:
        api_key = payload.api_key.strip()
    elif credential is not None:
        api_key = _decrypt_key(credential)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Introduce la clave API")
    try:
        return await provider.list_models(api_key, base_url)
    except AIProviderError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/usage", response_model=UsageSummary)
async def get_usage(
    days: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UsageSummary:
    """Summarize the user's token usage over the last days.

    Args:
        days: Size of the period, counting today.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Totals with one entry per day (zero-filled) and per model.
    """
    today = datetime.now(timezone.utc).date()
    start_day = today - timedelta(days=days - 1)
    start = datetime(start_day.year, start_day.month, start_day.day, tzinfo=timezone.utc)
    scope = (AIUsage.user_id == current_user.id, AIUsage.created_at >= start)
    sums = (func.coalesce(func.sum(AIUsage.input_tokens), 0), func.coalesce(func.sum(AIUsage.output_tokens), 0), func.count())

    day_column = func.date(AIUsage.created_at)
    day_rows = await db.execute(select(day_column, *sums).where(*scope).group_by(day_column))
    per_day = {str(row[0]): (int(row[1]), int(row[2]), int(row[3])) for row in day_rows.all()}
    by_day = []
    for offset in range(days):
        key = (start_day + timedelta(days=offset)).isoformat()
        input_tokens, output_tokens, requests = per_day.get(key, (0, 0, 0))
        by_day.append(UsageDay(date=key, input_tokens=input_tokens, output_tokens=output_tokens, requests=requests))

    model_rows = await db.execute(select(AIUsage.provider, AIUsage.model, *sums).where(*scope).group_by(AIUsage.provider, AIUsage.model))
    by_model = [UsageModel(provider=row[0], model=row[1], input_tokens=int(row[2]), output_tokens=int(row[3]), requests=int(row[4])) for row in model_rows.all()]
    by_model.sort(key=lambda item: item.input_tokens + item.output_tokens, reverse=True)

    estimates = await db.execute(select(func.count()).select_from(AIUsage).where(*scope, AIUsage.estimated.is_(True)))
    return UsageSummary(
        days=days,
        input_tokens=sum(d.input_tokens for d in by_day),
        output_tokens=sum(d.output_tokens for d in by_day),
        requests=sum(d.requests for d in by_day),
        has_estimates=int(estimates.scalar_one()) > 0,
        by_day=by_day,
        by_model=by_model,
    )
