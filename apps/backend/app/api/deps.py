from __future__ import annotations

from urllib.parse import urlsplit

from fastapi import Depends, HTTPException, Request, WebSocket, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import ACCESS_COOKIE, decode_access_token
from app.db.session import async_session_factory, get_db
from app.models.user import User

SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})
CSRF_HEADER = "x-requested-with"


def _bearer_token(request: Request) -> str | None:
    """Read a bearer token from the Authorization header, for API clients."""
    scheme, _, token = request.headers.get("authorization", "").partition(" ")
    return token if scheme.lower() == "bearer" and token else None


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    """Resolve the current user from the session cookie or raise 401.

    Cookie-authenticated requests that change state must carry the
    `X-Requested-With` header: browsers do not let other sites add custom
    headers, which blocks cross-site request forgery. A bearer token in the
    Authorization header is also accepted for non-browser clients.
    """
    token = _bearer_token(request)
    if token is None:
        token = request.cookies.get(ACCESS_COOKIE)
        if token and request.method not in SAFE_METHODS and CSRF_HEADER not in request.headers:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Petición no permitida")
    subject = decode_access_token(token) if token else None
    if subject is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión no válida o expirada")

    result = await db.execute(select(User).where(User.id == subject))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")
    return user


def is_trusted_ws_origin(websocket: WebSocket) -> bool:
    """Check that a WebSocket handshake comes from this app.

    Browsers attach cookies to cross-site WebSocket handshakes and do not
    apply CORS to them, so the Origin header is the only defence against
    another site opening an authenticated socket. Non-browser clients send
    no Origin and are allowed.

    Args:
        websocket: Incoming connection.

    Returns:
        True when the origin matches the host or an allowed CORS origin.
    """
    origin = websocket.headers.get("origin")
    if not origin:
        return True
    allowed = settings.parsed_cors_origins
    if "*" in allowed or origin in allowed:
        return True
    origin_host = urlsplit(origin).netloc
    forwarded = websocket.headers.get("x-forwarded-host", "")
    return origin_host in {websocket.headers.get("host", ""), forwarded}


async def get_ws_user(websocket: WebSocket) -> User | None:
    """Resolve the user of a WebSocket handshake from the session cookie.

    Args:
        websocket: Incoming connection.

    Returns:
        Authenticated user, or None when there is no valid session.
    """
    token = websocket.cookies.get(ACCESS_COOKIE)
    subject = decode_access_token(token) if token else None
    if subject is None:
        return None
    async with async_session_factory() as db:
        result = await db.execute(select(User).where(User.id == subject))
        return result.scalar_one_or_none()
