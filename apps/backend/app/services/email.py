from __future__ import annotations

import base64
import html
import logging
from functools import lru_cache
from pathlib import Path

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

RESEND_URL = "https://api.resend.com/emails"
LOGO_PATH = Path(__file__).resolve().parents[1] / "assets" / "email-logo.png"
LOGO_CONTENT_ID = "app-logo"


class EmailDeliveryError(Exception):
    """Raised when an email could not be handed to the delivery service."""


@lru_cache(maxsize=1)
def _logo_attachment() -> dict[str, str] | None:
    """Build the inline attachment for the app icon, read once from disk.

    Returns:
        Resend attachment referenced from the HTML as `cid:app-logo`, or None
        when the asset is missing.
    """
    if not LOGO_PATH.exists():
        return None
    return {"content": base64.b64encode(LOGO_PATH.read_bytes()).decode(), "filename": "logo.png", "content_id": LOGO_CONTENT_ID}


def render_verification_email(code: str, minutes: int) -> tuple[str, str]:
    """Render the email that carries a verification code.

    The layout uses nested tables and inline styles only, the subset every
    mail client renders consistently, with all content centered.

    Args:
        code: One-time code.
        minutes: Minutes until the code expires.

    Returns:
        Tuple with the HTML body and its plain-text alternative.
    """
    app = html.escape(settings.app_name)
    safe_code = html.escape(code)
    font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    logo = f'<img src="cid:{LOGO_CONTENT_ID}" width="64" alt="{app}" style="display:block;margin:0 auto;border:0;outline:none;height:auto;border-radius:12px;">' if _logo_attachment() else ""
    body = f"""<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Tu código de verificación</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tu código de {app} es {safe_code}. Caduca en {minutes} minutos.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:16px;">
            <tr>
              <td align="center" style="padding:40px 32px 8px 32px;">{logo}</td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 32px 0 32px;font-family:{font};font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">{app}</td>
            </tr>
            <tr>
              <td align="center" style="padding:12px 32px 0 32px;font-family:{font};font-size:24px;line-height:32px;font-weight:700;color:#18181b;">Verifica tu correo</td>
            </tr>
            <tr>
              <td align="center" style="padding:12px 32px 0 32px;font-family:{font};font-size:15px;line-height:24px;color:#52525b;">Introduce este código para terminar de acceder a tu cuenta.</td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 32px 0 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding:16px 18px 16px 28px;background-color:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;font-family:'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;font-size:34px;line-height:40px;font-weight:700;letter-spacing:0.3em;color:#18181b;">{safe_code}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 32px 0 32px;font-family:{font};font-size:14px;line-height:22px;color:#52525b;">El código caduca en <strong style="color:#18181b;">{minutes} minutos</strong> y solo puede usarse una vez.</td>
            </tr>
            <tr>
              <td style="padding:32px 32px 0 32px;"><div style="border-top:1px solid #e4e4e7;font-size:0;line-height:0;">&nbsp;</div></td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 32px 36px 32px;font-family:{font};font-size:12px;line-height:20px;color:#a1a1aa;">Si no has intentado acceder a {app}, puedes ignorar este mensaje: nadie podrá entrar sin este código.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""
    text = f"{settings.app_name}\n\nTu código de verificación es: {code}\n\nCaduca en {minutes} minutos y solo puede usarse una vez.\n\nSi no has intentado acceder, ignora este mensaje."
    return body, text


async def send_verification_email(to: str, code: str) -> None:
    """Send a verification code through Resend.

    Without `RESEND_API_KEY` outside production, the code is written to the
    server log instead so local development works without an email account.

    Args:
        to: Recipient address.
        code: One-time code.

    Raises:
        EmailDeliveryError: Resend rejected the message or is unreachable.
    """
    if not settings.resend_api_key.strip():
        logger.warning("RESEND_API_KEY is not set; verification code for %s: %s", to, code)
        return
    body, text = render_verification_email(code, settings.otp_expire_minutes)
    payload: dict[str, object] = {
        "from": settings.email_from,
        "to": [to],
        "subject": f"{code} es tu código de {settings.app_name}",
        "html": body,
        "text": text,
    }
    logo = _logo_attachment()
    if logo:
        payload["attachments"] = [logo]
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(RESEND_URL, headers={"Authorization": f"Bearer {settings.resend_api_key.strip()}"}, json=payload)
    except httpx.HTTPError as exc:
        raise EmailDeliveryError("No se pudo contactar con el servicio de correo") from exc
    if response.status_code >= 400:
        logger.error("Resend rejected the verification email (%s): %s", response.status_code, response.text[:300])
        raise EmailDeliveryError("No se pudo enviar el correo de verificación")
