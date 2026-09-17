from __future__ import annotations

import json

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.rooms import RoomState, room_manager
from app.core.security import decode_access_token
from app.db.session import async_session_factory
from app.models.room import Room
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
        async with async_session_factory() as db_check:
            r = await db_check.execute(select(Room).where(Room.code == code.upper()))
            db_room = r.scalar_one_or_none()
            if db_room is None:
                await websocket.close(code=4404, reason="Sala no encontrada")
                return
            room = RoomState(code=db_room.code, presentation_id=db_room.presentation_id, owner_id=db_room.owner_id, current_slide=db_room.current_slide, highlighted_id=db_room.highlighted_id, show_controls=db_room.show_controls, fullscreen=db_room.fullscreen, anti_spoiler=db_room.anti_spoiler, auto_fullscreen=db_room.auto_fullscreen, expires_at=db_room.expires_at)
            room_manager._rooms[code.upper()] = room

    await ws_manager.connect(code, websocket)

    await websocket.send_text(
        json.dumps(
            {
                "type": "ROOM_STATE",
                "payload": {
                    "code": room.code,
                    "presentation_id": room.presentation_id,
                    "current_slide": room.current_slide,
                    "highlighted_id": room.highlighted_id,
                    "code_overlay": room.code_overlay,
                    "show_controls": room.show_controls,
                    "fullscreen": room.fullscreen,
                    "anti_spoiler": room.anti_spoiler,
                    "auto_fullscreen": room.auto_fullscreen,
                },
            }
        )
    )

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

            if mtype == "SLIDE_CHANGE":
                idx = int(payload.get("index", 0))
                room.current_slide = max(0, idx)
                async with async_session_factory() as _db:
                    res = await _db.execute(select(Room).where(Room.code == code.upper()))
                    db_r = res.scalar_one_or_none()
                    if db_r:
                        db_r.current_slide = room.current_slide
                        await _db.commit()
                await ws_manager.broadcast(code, {"type": "SLIDE_CHANGED", "payload": {"index": room.current_slide, "by": role}})

            elif mtype == "HIGHLIGHT":
                element_id = payload.get("elementId")
                room.highlighted_id = element_id if isinstance(element_id, str) else None
                async with async_session_factory() as _db:
                    res = await _db.execute(select(Room).where(Room.code == code.upper()))
                    db_r = res.scalar_one_or_none()
                    if db_r:
                        db_r.highlighted_id = room.highlighted_id
                        await _db.commit()
                await ws_manager.broadcast(code, {"type": "HIGHLIGHT_CHANGED", "payload": {"elementId": room.highlighted_id, "by": role}})

            elif mtype == "ANIMATION_TRIGGER":
                element_id = payload.get("elementId")
                await ws_manager.broadcast(code, {"type": "ANIMATION_TRIGGERED", "payload": {"elementId": element_id, "by": role}})

            elif mtype == "CODE_EXPAND":
                element_id = payload.get("elementId")
                if isinstance(element_id, str):
                    room.code_overlay = {"elementId": element_id, "expanded": True, "highlightedLines": [], "scrollTop": 0}
                    await ws_manager.broadcast(code, {"type": "CODE_EXPANDED", "payload": {"elementId": element_id, "by": role}})

            elif mtype == "CODE_COLLAPSE":
                if room.code_overlay is not None:
                    element_id = room.code_overlay.get("elementId")
                    room.code_overlay = None
                    await ws_manager.broadcast(code, {"type": "CODE_COLLAPSED", "payload": {"elementId": element_id, "by": role}})

            elif mtype == "CODE_HIGHLIGHT":
                element_id = payload.get("elementId")
                lines = payload.get("lines", [])
                if isinstance(element_id, str) and isinstance(lines, list):
                    clean = [int(x) for x in lines if isinstance(x, int) or (isinstance(x, str) and str(x).isdigit())]
                    if room.code_overlay and room.code_overlay.get("elementId") == element_id:
                        room.code_overlay["highlightedLines"] = clean
                    else:
                        room.code_overlay = {"elementId": element_id, "expanded": True, "highlightedLines": clean, "scrollTop": 0}
                    await ws_manager.broadcast(code, {"type": "CODE_HIGHLIGHT_CHANGED", "payload": {"elementId": element_id, "lines": clean, "by": role}})

            elif mtype == "CODE_SCROLL":
                element_id = payload.get("elementId")
                scroll_top = payload.get("scrollTop", 0)
                try:
                    top = int(scroll_top)
                except Exception:
                    top = 0
                if isinstance(element_id, str):
                    if room.code_overlay and room.code_overlay.get("elementId") == element_id:
                        room.code_overlay["scrollTop"] = top
                    await ws_manager.broadcast(code, {"type": "CODE_SCROLL_CHANGED", "payload": {"elementId": element_id, "scrollTop": top, "by": role}})

            elif mtype == "ROOM_CONFIG_UPDATE":
                show = payload.get("show_controls")
                fs = payload.get("fullscreen")
                anti = payload.get("anti_spoiler")
                auto_fs = payload.get("auto_fullscreen")
                updated: dict[str, object] = {}
                if isinstance(show, bool):
                    room.show_controls = show
                    updated["show_controls"] = show
                if isinstance(fs, bool):
                    room.fullscreen = fs
                    updated["fullscreen"] = fs
                if isinstance(anti, bool):
                    room.anti_spoiler = anti
                    updated["anti_spoiler"] = anti
                if isinstance(auto_fs, bool):
                    room.auto_fullscreen = auto_fs
                    updated["auto_fullscreen"] = auto_fs
                if updated:
                    async with async_session_factory() as _db:
                        res = await _db.execute(select(Room).where(Room.code == code.upper()))
                        db_r = res.scalar_one_or_none()
                        if db_r:
                            if "show_controls" in updated:
                                db_r.show_controls = updated["show_controls"]  # type: ignore[assignment]
                            if "fullscreen" in updated:
                                db_r.fullscreen = updated["fullscreen"]  # type: ignore[assignment]
                            if "anti_spoiler" in updated:
                                db_r.anti_spoiler = updated["anti_spoiler"]  # type: ignore[assignment]
                            if "auto_fullscreen" in updated:
                                db_r.auto_fullscreen = updated["auto_fullscreen"]  # type: ignore[assignment]
                            await _db.commit()
                    await ws_manager.broadcast(code, {"type": "ROOM_CONFIG_CHANGED", "payload": updated})

            elif mtype == "SPOILER_COUNTDOWN_START":
                seconds = payload.get("seconds", 3)
                try:
                    sec = int(seconds)
                    sec = max(1, min(10, sec))
                except Exception:
                    sec = 3
                await ws_manager.broadcast(code, {"type": "SPOILER_COUNTDOWN_STARTED", "payload": {"seconds": sec, "by": role}})

            elif mtype == "SPOILER_INTRO_DISMISS":
                await ws_manager.broadcast(code, {"type": "SPOILER_INTRO_DISMISSED", "payload": {"by": role}})

            elif mtype == "PRESENTATION_FULLSCREEN":
                enabled = payload.get("enabled")
                if isinstance(enabled, bool):
                    await ws_manager.broadcast(code, {"type": "PRESENTATION_FULLSCREEN_CHANGED", "payload": {"enabled": enabled, "by": role}})

    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(code, websocket)
