from __future__ import annotations

import json
from dataclasses import dataclass

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Literal

from pydantic import Field
from sqlalchemy import select

from app.api.deps import get_ws_user, is_trusted_ws_origin
from app.db.session import async_session_factory
from app.models.presentation import Presentation
from app.models.user import User
from app.services.assistant.agent import AssistantSession, ToolResult
from app.services.assistant.conversations import clear_messages, get_or_create_conversation, list_messages, to_client_message
from app.services.assistant.prompt import DocumentInfo
from app.ws.core import EmptyPayload, EventPayload, EventRegistry, PayloadT, WSEvent

router = APIRouter()

EDITOR_ROLE = "editor"


@dataclass
class AssistantContext:
    """Context of a message on an assistant connection.

    The channel has a single participant, the editor that opened it, so
    broadcasting and replying are the same thing.
    """

    user: User
    presentation_id: str
    websocket: WebSocket
    session: AssistantSession
    role: str = EDITOR_ROLE

    @property
    def label(self) -> str:
        """Channel identifier for logs."""
        return f"assistant {self.presentation_id}"

    async def send(self, event_type: str, payload: dict[str, object]) -> None:
        """Send an event to the editor, ignoring a closed socket.

        Args:
            event_type: Outgoing event name.
            payload: Outgoing payload.
        """
        try:
            await self.websocket.send_text(json.dumps({"type": event_type, "payload": payload}))
        except Exception:
            pass

    async def broadcast(self, event_type: str, payload: dict[str, object], *, exclude_sender: bool = False) -> None:
        """Send an event to the only participant unless it is excluded."""
        if not exclude_sender:
            await self.send(event_type, payload)

    async def send_history(self) -> None:
        """Send the stored conversation and its token totals to the editor."""
        async with async_session_factory() as db:
            conversation = await get_or_create_conversation(db, self.user.id, self.presentation_id)
            messages = await list_messages(db, conversation.id)
        await self.send(
            "CHAT_HISTORY",
            {
                "messages": [to_client_message(message) for message in messages],
                "usage": {"input_tokens": conversation.input_tokens, "output_tokens": conversation.output_tokens},
                "busy": self.session.busy,
            },
        )


class AssistantEvent(WSEvent[AssistantContext, PayloadT]):
    """Client-to-server event of the assistant channel."""


assistant_events: EventRegistry[AssistantContext] = EventRegistry()


class ChatSendPayload(EventPayload):
    """User message with the state of the open document."""

    text: str = Field(min_length=1, max_length=20_000)
    document: DocumentInfo = Field(default_factory=DocumentInfo)
    effort: Literal["low", "medium", "high", "max"] = "medium"


class ToolResultPayload(EventPayload):
    """Outcome of a tool the editor ran."""

    call_id: str = Field(min_length=1, max_length=64)
    ok: bool = False
    result: str = Field(default="", max_length=400_000)
    summary: str = Field(default="", max_length=300)
    document: DocumentInfo | None = None


@assistant_events.register
class ChatSend(AssistantEvent[ChatSendPayload]):
    """Start an assistant turn with a user message."""

    type = "CHAT_SEND"
    payload_model = ChatSendPayload

    async def handle(self, ctx: AssistantContext, payload: ChatSendPayload) -> None:
        """Run the turn in the background unless one is already running."""
        if not ctx.session.start_turn(payload.text.strip(), payload.document, payload.effort):
            await ctx.send("CHAT_ERROR", {"message": "El asistente todavía está respondiendo"})


@assistant_events.register
class ToolResultEvent(AssistantEvent[ToolResultPayload]):
    """Deliver the result of a tool call to the waiting turn."""

    type = "TOOL_RESULT"
    payload_model = ToolResultPayload

    async def handle(self, ctx: AssistantContext, payload: ToolResultPayload) -> None:
        """Hand the result to the session."""
        ctx.session.resolve_tool(payload.call_id, ToolResult(ok=payload.ok, result=payload.result, summary=payload.summary), payload.document)


@assistant_events.register
class ChatStop(AssistantEvent[EmptyPayload]):
    """Stop the response in progress."""

    type = "CHAT_STOP"

    async def handle(self, ctx: AssistantContext, payload: EmptyPayload) -> None:
        """Cancel the running turn."""
        await ctx.session.stop()


@assistant_events.register
class ChatClear(AssistantEvent[EmptyPayload]):
    """Forget the conversation and start a new one."""

    type = "CHAT_CLEAR"

    async def handle(self, ctx: AssistantContext, payload: EmptyPayload) -> None:
        """Stop any turn, delete the messages and confirm with an empty history."""
        await ctx.session.stop()
        async with async_session_factory() as db:
            await clear_messages(db, ctx.session.conversation_id)
        await ctx.send_history()


@router.websocket("/ws/assistant/{presentation_id}")
async def ws_assistant(websocket: WebSocket, presentation_id: str) -> None:
    """WebSocket between the editor and the server-side assistant.

    The server calls the model with the user's stored key, streams the reply
    (`CHAT_DELTA`), and asks the editor to apply each tool call (`TOOL_CALL`
    answered by `TOOL_RESULT`). The conversation is stored per presentation
    and replayed on connect (`CHAT_HISTORY`).
    """
    await websocket.accept()
    if not is_trusted_ws_origin(websocket):
        await websocket.close(code=4403, reason="Origen no permitido")
        return
    user = await get_ws_user(websocket)
    if user is None:
        await websocket.close(code=4401, reason="No autenticado")
        return
    async with async_session_factory() as db:
        result = await db.execute(select(Presentation).where(Presentation.id == presentation_id))
        presentation = result.scalar_one_or_none()
        if presentation is None or presentation.owner_id != user.id:
            await websocket.close(code=4404, reason="Presentación no encontrada")
            return
        conversation = await get_or_create_conversation(db, user.id, presentation_id)

    async def emit(event_type: str, payload: dict[str, object]) -> None:
        """Forward a session event to the editor."""
        await ctx.send(event_type, payload)

    session = AssistantSession(user.id, presentation_id, conversation.id, emit)
    ctx = AssistantContext(user=user, presentation_id=presentation_id, websocket=websocket, session=session)
    await ctx.send_history()

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if isinstance(msg, dict):
                await assistant_events.dispatch(ctx, msg.get("type"), msg.get("payload"))
    except WebSocketDisconnect:
        pass
    finally:
        await session.stop()
