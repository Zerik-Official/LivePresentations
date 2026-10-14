from __future__ import annotations

import json

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.api.deps import get_ws_user, is_trusted_ws_origin
from app.core.config import settings
from app.core.rooms import room_manager
from app.db.session import async_session_factory
from app.ws.events import EventContext, room_events
from app.ws.events.base import ALL_ROLES, VIEWER_ROLE
from app.ws.manager import ws_manager

router = APIRouter()

CLOSE_BAD_REQUEST = 4400
CLOSE_UNAUTHENTICATED = 4401
CLOSE_FORBIDDEN = 4403
CLOSE_NOT_FOUND = 4404
CLOSE_ROOM_FULL = 4429


async def _reject(websocket: WebSocket, code: int, reason: str) -> None:
    """Complete the handshake and close with an application code.

    Closing before accepting surfaces in browsers as a generic 1006, so the
    client could not tell an expired session from a missing room.
    """
    await websocket.accept()
    await websocket.close(code=code, reason=reason)


@router.websocket("/ws/room/{code}")
async def ws_room(websocket: WebSocket, code: str, role: str | None = Query(default=None)) -> None:
    """WebSocket that keeps presenter, controllers and viewers in sync.

    Presenters and controllers authenticate with the session cookie. The
    `viewer` role needs no account but only works on public rooms and is
    read-only: the event registry ignores everything viewers send.
    """
    if not is_trusted_ws_origin(websocket):
        await _reject(websocket, CLOSE_FORBIDDEN, "Origen no permitido")
        return
    if role not in ALL_ROLES and role != VIEWER_ROLE:
        await _reject(websocket, CLOSE_BAD_REQUEST, "Rol inválido")
        return

    user = None
    if role != VIEWER_ROLE:
        user = await get_ws_user(websocket)
        if user is None:
            await _reject(websocket, CLOSE_UNAUTHENTICATED, "No autenticado")
            return

    async with async_session_factory() as db:
        room = await room_manager.resolve(code, db)
    if room is None or (role == VIEWER_ROLE and not room.is_public):
        await _reject(websocket, CLOSE_NOT_FOUND, "Sala no encontrada")
        return
    if role == VIEWER_ROLE and ws_manager.count(code, VIEWER_ROLE) >= settings.public_room_max_viewers:
        await _reject(websocket, CLOSE_ROOM_FULL, "Sala llena")
        return

    await ws_manager.connect(code, websocket, role)
    ctx = EventContext(code=code, role=role, user=user, websocket=websocket, room=room, manager=ws_manager)

    await ctx.reply("ROOM_STATE", {**room.snapshot(), "viewers": ws_manager.count(code, VIEWER_ROLE)})
    if role == VIEWER_ROLE:
        await ctx.broadcast("VIEWERS_CHANGED", {"count": ws_manager.count(code, VIEWER_ROLE)}, exclude_sender=True)
    else:
        await ctx.broadcast("USER_JOINED", {"role": role, "user_id": user.id if user else None}, exclude_sender=True)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if not isinstance(msg, dict):
                continue
            await room_events.dispatch(ctx, msg.get("type"), msg.get("payload"))
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(code, websocket)
        if role == VIEWER_ROLE:
            await ctx.broadcast("VIEWERS_CHANGED", {"count": ws_manager.count(code, VIEWER_ROLE)})
