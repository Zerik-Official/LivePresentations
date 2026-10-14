from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


class SecretDecryptionError(Exception):
    """Raised when a stored secret cannot be decrypted with the current key."""


def _build_fernet() -> Fernet:
    """Build the cipher used for secrets at rest.

    The key comes from `AI_ENCRYPTION_KEY` when set, otherwise it is derived
    from `SECRET_KEY`. Changing either one makes stored secrets unreadable.

    Returns:
        Fernet cipher (AES-128-CBC with HMAC-SHA256 authentication).
    """
    source = settings.ai_encryption_key.strip() or settings.secret_key
    digest = hashlib.sha256(f"livepresentations:secrets:{source}".encode()).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


_fernet = _build_fernet()


def encrypt_secret(plain: str) -> str:
    """Encrypt a secret for storage.

    Args:
        plain: Secret in plain text.

    Returns:
        Authenticated ciphertext safe to store in the database.
    """
    return _fernet.encrypt(plain.encode()).decode()


def decrypt_secret(token: str) -> str:
    """Decrypt a stored secret.

    Args:
        token: Ciphertext produced by `encrypt_secret`.

    Returns:
        Secret in plain text.

    Raises:
        SecretDecryptionError: The ciphertext is corrupt or the key changed.
    """
    try:
        return _fernet.decrypt(token.encode()).decode()
    except InvalidToken as exc:
        raise SecretDecryptionError("Stored secret cannot be decrypted") from exc


def mask_secret(plain: str) -> str:
    """Build a display hint that reveals only the last characters.

    Args:
        plain: Secret in plain text.

    Returns:
        Masked hint such as `••••a1b2`.
    """
    tail = plain[-4:] if len(plain) >= 12 else ""
    return f"••••{tail}"
