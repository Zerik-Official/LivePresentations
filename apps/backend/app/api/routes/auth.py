from __future__ import annotations

import secrets
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.google_auth import GoogleAuthError, verify_google_id_token
from app.core.security import (
    REFRESH_COOKIE,
    clear_auth_cookies,
    create_verification_ticket,
    decode_verification_ticket,
    get_password_hash,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.token import AuthResult, CodeStatusRead, ResendCode, VerifyEmail
from app.schemas.user import GoogleLogin, UserCreate, UserLogin, UserRead
from app.services.email import EmailDeliveryError
from app.services.sessions import InvalidSessionError, revoke_session, rotate_session, start_session
from app.services.verification import CodeStatus, InvalidCodeError, consume_code, send_code

router = APIRouter(prefix="/auth", tags=["auth"])


async def _verify_turnstile(token: str | None) -> None:
    if not settings.turnstile_enabled:
        return
    if not token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Completa el captcha")
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={"secret": settings.turnstile_private_key, "response": token},
            )
            valid = response.json().get("success", False)
    except (httpx.HTTPError, ValueError):
        valid = False
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Captcha inválido")


async def _authenticated(user: User, db: AsyncSession, response: Response) -> AuthResult:
    """Record the login, open a cookie session and return the user.

    Args:
        user: Authenticated user, already attached to the session.
        db: Database session.
        response: Outgoing response that receives the session cookies.

    Returns:
        Authenticated result with the user profile.
    """
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)
    await start_session(db, user, response)
    return AuthResult(status="authenticated", user=UserRead.model_validate(user))


async def _send_code(db: AsyncSession, user: User) -> CodeStatus:
    """Email a verification code, mapping delivery failures to a 502.

    Args:
        db: Database session.
        user: Account being verified.

    Returns:
        Timing of the valid code.
    """
    try:
        return await send_code(db, user)
    except EmailDeliveryError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


async def _verification_required(user: User, db: AsyncSession) -> AuthResult:
    """Send the code and tell the client to ask for it.

    The ticket proves the caller already presented valid credentials, so only
    they can submit or request codes for this account.

    Args:
        user: Account with an unverified email.
        db: Database session.

    Returns:
        Verification-required result with the ticket and code timing.
    """
    code = await _send_code(db, user)
    return AuthResult(status="verification_required", email=user.email, ticket=create_verification_ticket(user.id), resend_in=code.resend_in, expires_in=code.expires_in)


async def _user_from_ticket(ticket: str, db: AsyncSession) -> User:
    """Resolve the unverified account a ticket was issued for.

    Args:
        ticket: Verification ticket.
        db: Database session.

    Returns:
        Account awaiting verification.
    """
    user_id = decode_verification_ticket(ticket)
    user = None
    if user_id is not None:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
    if user is None or user.email_verified:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="La verificación ha caducado. Inicia sesión de nuevo.")
    return user


@router.post("/register", response_model=AuthResult, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, response: Response, db: AsyncSession = Depends(get_db)) -> AuthResult:
    """Register with email and password.

    With email verification enabled the account stays locked until the
    emailed code is confirmed. Registering again with an address that was
    never verified replaces its password, so nobody can reserve someone
    else's email.
    """
    await _verify_turnstile(payload.turnstile_token)
    if len(payload.password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La contraseña debe tener al menos 8 caracteres")

    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()
    if user is not None and (user.email_verified or not settings.email_verification_enabled):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El correo ya está registrado")

    if user is None:
        user = User(email=payload.email.lower(), hashed_password=get_password_hash(payload.password), email_verified=False)
        db.add(user)
    else:
        user.hashed_password = get_password_hash(payload.password)
        user.has_password = True
    await db.commit()
    await db.refresh(user)

    if settings.email_verification_enabled:
        return await _verification_required(user, db)
    return await _authenticated(user, db, response)


@router.post("/login", response_model=AuthResult)
async def login(payload: UserLogin, response: Response, db: AsyncSession = Depends(get_db)) -> AuthResult:
    """Authenticate with email and password.

    An account whose email is not verified yet does not get a session: a
    code is emailed and the client must confirm it first.
    """
    await _verify_turnstile(payload.turnstile_token)
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()
    if user is None or not user.has_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")
    if settings.email_verification_enabled and not user.email_verified:
        return await _verification_required(user, db)
    return await _authenticated(user, db, response)


@router.post("/verify-email", response_model=AuthResult)
async def verify_email(payload: VerifyEmail, response: Response, db: AsyncSession = Depends(get_db)) -> AuthResult:
    """Confirm the emailed code and open the session.

    Args:
        payload: Verification ticket and code.
        response: Outgoing response that receives the session cookies.
        db: Database session.

    Returns:
        Authenticated result with the user profile.
    """
    user = await _user_from_ticket(payload.ticket, db)
    try:
        await consume_code(db, user, payload.code)
    except InvalidCodeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    user.email_verified_at = datetime.now(timezone.utc)
    return await _authenticated(user, db, response)


@router.post("/resend-code", response_model=CodeStatusRead)
async def resend_code(payload: ResendCode, db: AsyncSession = Depends(get_db)) -> CodeStatusRead:
    """Email another code once the cooldown has passed.

    Inside the cooldown nothing is sent and `resend_in` tells how long to wait.
    """
    user = await _user_from_ticket(payload.ticket, db)
    code = await _send_code(db, user)
    return CodeStatusRead(resend_in=code.resend_in, expires_in=code.expires_in, sent=code.sent)


@router.post("/google", response_model=AuthResult)
async def login_with_google(payload: GoogleLogin, response: Response, db: AsyncSession = Depends(get_db)) -> AuthResult:
    """Sign in or sign up with a Google account.

    A new account takes its display name and picture from the Google profile.
    An existing account with the same email is linked to Google and keeps the
    name and picture the user already chose. Its password survives only when
    the owner had proved the address with an emailed code; otherwise it may
    have been set by someone else and is disabled.

    Args:
        payload: Google ID token and captcha token.
        response: Outgoing response that receives the session cookies.
        db: Database session.

    Returns:
        Authenticated result with the user profile.
    """
    if not settings.google_auth_enabled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El acceso con Google no está habilitado")
    await _verify_turnstile(payload.turnstile_token)
    try:
        identity = await verify_google_id_token(payload.credential)
    except GoogleAuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    result = await db.execute(select(User).where(User.google_sub == identity.sub))
    user = result.scalar_one_or_none()
    if user is None:
        result = await db.execute(select(User).where(User.email == identity.email))
        user = result.scalar_one_or_none()
        if user is not None:
            user.google_sub = identity.sub
            if user.email_verified_at is None:
                user.hashed_password = get_password_hash(secrets.token_urlsafe(32))
                user.has_password = False
    if user is None:
        user = User(email=identity.email, hashed_password=get_password_hash(secrets.token_urlsafe(32)), has_password=False, google_sub=identity.sub)
        db.add(user)
    if user.email_verified_at is None:
        user.email_verified_at = datetime.now(timezone.utc)
    user.email_verified = True
    if not user.display_name and identity.name:
        user.display_name = identity.name[:120]
    if not user.avatar_url and identity.picture:
        user.avatar_url = identity.picture[:1024]
    return await _authenticated(user, db, response)


@router.post("/refresh", response_model=AuthResult)
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)) -> AuthResult | JSONResponse:
    """Exchange the refresh cookie for a new access token.

    The refresh token is rotated on every use. When it is no longer valid the
    stale cookies are removed along with the 401.
    """
    try:
        user = await rotate_session(db, request.cookies.get(REFRESH_COOKIE), response)
    except InvalidSessionError:
        failure = JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"detail": "Sesión expirada"})
        clear_auth_cookies(failure)
        return failure
    return AuthResult(status="authenticated", user=UserRead.model_validate(user))


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    """Close the current session and remove its cookies."""
    await revoke_session(db, request.cookies.get(REFRESH_COOKIE))
    clear_auth_cookies(response)
    return {"status": "logged_out"}
