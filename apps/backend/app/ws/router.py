from __future__ import annotations

import json

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rooms import room_manager
from app.core.security import decode_access_token
from app.db.session import async_session_factory
from app.models.user import User
from app.ws.manager import ws_manager

router = APIRouter()


async def _get_user_from_token(token: str | None) -> User | None:
    """Resolve user from JWT query param."""
    if not token:
        return None
    subject = decode_access_token(token)
    if subject is None:
        return None
    async with async_session_factory() as db:
        result = await db.execute(select(User).where(User.id == subject))
        return result.scalar_one_or_none()


@router.websocket("/ws/room/{code}")
async def ws_room(
    websocket: WebSocket,
    code: str,
    token: str | None = Query(default=None),
    role: str | None = Query(default=None),
) -> None:
    """WebSocket for presenter/controller to sync slide state.

    Requires `token` query param (JWT) and `role` (presenter|controller).
    Both roles must be authenticated.
    """
    user = await _get_user_from_token(token)
    if user is None:
        await websocket.close(code=4401, reason="No autenticado")
        return

    if role not in ("presenter", "controller"):
        await websocket.close(code=4400, reason="Rol inválido")
        return

    room = room_manager.get(code)
    if room is None:
        await websocket.close(code=4404, reason="Sala no encontrada")
        return

    await ws_manager.connect(code, websocket)

    # Send initial state
    await websocket.send_text(
        json.dumps(
            {
                "type": "ROOM_STATE",
                "payload": {
                    "code": room.code,
                    "presentation_id": room.presentation_id,
                    "current_slide": room.current_slide,
                    "highlighted_id": room.highlighted_id,
                },
            }
        )
    )

    # Notify others someone joined (optional)
    await ws_manager.broadcast(
        code,
        {"type": "USER_JOINED", "payload": {"role": role, "user_id": user.id}},
        exclude=websocket,
    )

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            mtype = msg.get("type")
            payload = msg.get("payload", {})

            # Only controller and presenter can drive changes; validate
            if mtype == "SLIDE_CHANGE":
                idx = int(payload.get("index", 0))
                room.current_slide = max(0, idx)
                await ws_manager.broadcast(code, {"type": "SLIDE_CHANGED", "payload": {"index": room.current_slide, "by": role}})

            elif mtype == "HIGHLIGHT":
                element_id = payload.get("elementId")
                room.highlighted_id = element_id if isinstance(element_id, str) else None
                await ws_manager.broadcast(code, {"type": "HIGHLIGHT_CHANGED", "payload": {"elementId": room.highlighted_id, "by": role}})

            elif mtype == "ANIMATION_TRIGGER":
                element_id = payload.get("elementId")
                await ws_manager.broadcast(code, {"type": "ANIMATION_TRIGGERED", "payload": {"elementId": element_id, "by": role}})

    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(code, websocket)
