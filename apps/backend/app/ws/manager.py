from __future__ import annotations

import json
from collections import defaultdict

from fastapi import WebSocket


class WSManager:
    """Track websocket connections and their roles per room code."""

    def __init__(self) -> None:
        self._rooms: dict[str, dict[WebSocket, str]] = defaultdict(dict)

    async def connect(self, code: str, ws: WebSocket, role: str = "") -> None:
        """Accept and register a connection with its role."""
        await ws.accept()
        self._rooms[code.upper()][ws] = role

    def disconnect(self, code: str, ws: WebSocket) -> None:
        """Remove connection."""
        conns = self._rooms.get(code.upper())
        if conns and ws in conns:
            del conns[ws]
            if not conns:
                self._rooms.pop(code.upper(), None)

    def count(self, code: str, role: str) -> int:
        """Count the connections of a room that hold a role."""
        return sum(1 for value in self._rooms.get(code.upper(), {}).values() if value == role)

    async def close_role(self, code: str, role: str, close_code: int, reason: str) -> None:
        """Close every connection of a room that holds a role.

        Args:
            code: Room code.
            role: Role to disconnect.
            close_code: WebSocket close code sent to those clients.
            reason: Human-readable close reason.
        """
        for ws, value in list(self._rooms.get(code.upper(), {}).items()):
            if value != role:
                continue
            try:
                await ws.close(code=close_code, reason=reason)
            except Exception:
                pass

    async def send(self, ws: WebSocket, message: dict[str, object]) -> None:
        """Send JSON to a single socket, ignoring closed connections."""
        try:
            await ws.send_text(json.dumps(message))
        except Exception:
            pass

    async def broadcast(self, code: str, message: dict[str, object], exclude: WebSocket | None = None) -> None:
        """Broadcast JSON to all sockets in room."""
        data = json.dumps(message)
        for ws in list(self._rooms.get(code.upper(), {})):
            if ws is exclude:
                continue
            try:
                await ws.send_text(data)
            except Exception:
                pass


ws_manager = WSManager()
