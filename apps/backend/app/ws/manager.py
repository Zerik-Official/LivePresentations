from __future__ import annotations

import json
from collections import defaultdict

from fastapi import WebSocket


class WSManager:
    """Track websocket connections per room code."""

    def __init__(self) -> None:
        self._rooms: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, code: str, ws: WebSocket) -> None:
        """Register connection."""
        await ws.accept()
        self._rooms[code.upper()].add(ws)

    def disconnect(self, code: str, ws: WebSocket) -> None:
        """Remove connection."""
        conns = self._rooms.get(code.upper())
        if conns and ws in conns:
            conns.remove(ws)
            if not conns:
                self._rooms.pop(code.upper(), None)

    async def broadcast(self, code: str, message: dict[str, object], exclude: WebSocket | None = None) -> None:
        """Broadcast JSON to all sockets in room."""
        data = json.dumps(message)
        for ws in list(self._rooms.get(code.upper(), set())):
            if ws is exclude:
                continue
            try:
                await ws.send_text(data)
            except Exception:
                pass


ws_manager = WSManager()
