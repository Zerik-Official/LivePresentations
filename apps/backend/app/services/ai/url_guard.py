from __future__ import annotations

import asyncio
import ipaddress
import socket
from urllib.parse import urlsplit

from app.core.config import settings


class UnsafeBaseUrlError(Exception):
    """Raised when a user-supplied base URL must not be contacted."""


def _is_public(address: str) -> bool:
    """Check that an IP address is globally routable.

    Args:
        address: IPv4 or IPv6 literal.

    Returns:
        True when the address is public.
    """
    return ipaddress.ip_address(address.split("%")[0]).is_global


async def validate_base_url(url: str) -> str:
    """Validate a user-supplied provider URL before the server calls it.

    The backend sends the request, so an unchecked URL would let any user
    reach internal services. Unless `AI_ALLOW_PRIVATE_BASE_URLS` is enabled
    (for self-hosted models), the URL must be HTTPS and resolve only to
    public addresses.

    Args:
        url: Base URL entered by the user.

    Returns:
        Normalized URL without trailing slash.

    Raises:
        UnsafeBaseUrlError: The URL is malformed or points to a private host.
    """
    cleaned = url.strip().rstrip("/")
    parts = urlsplit(cleaned)
    if parts.scheme not in ("http", "https") or not parts.hostname or parts.username or parts.password:
        raise UnsafeBaseUrlError("La URL base debe ser http(s)://host/ruta, sin credenciales")
    if settings.ai_allow_private_base_urls:
        return cleaned
    if parts.scheme != "https":
        raise UnsafeBaseUrlError("La URL base debe usar HTTPS")
    try:
        infos = await asyncio.get_running_loop().getaddrinfo(parts.hostname, parts.port or 443, type=socket.SOCK_STREAM)
    except OSError as exc:
        raise UnsafeBaseUrlError("No se pudo resolver el host de la URL base") from exc
    if not infos or not all(_is_public(str(info[4][0])) for info in infos):
        raise UnsafeBaseUrlError("La URL base apunta a una red privada, lo que no está permitido")
    return cleaned
