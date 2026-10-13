from __future__ import annotations

import asyncio
import json
import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from sqlalchemy import select

from app.core.config import settings
from app.core.crypto import SecretDecryptionError, decrypt_secret
from app.db.session import async_session_factory
from app.models.ai import AIConversation, AICredential, AIUsage
from app.services.ai import ChatParams, UnsafeBaseUrlError, ai_providers, validate_base_url
from app.services.assistant.conversations import append_message, list_messages, to_model_messages
from app.services.assistant.prompt import DocumentInfo, build_system_prompt
from app.services.assistant.tools import ASSISTANT_TOOLS

MAX_STEPS_PER_TURN = 16
TOOL_TIMEOUT_SECONDS = 60
MAX_TOOL_RESULT_CHARS = 60_000

#: Sends one event to the editor: `(event_type, payload)`.
Emit = Callable[[str, dict[str, object]], Awaitable[None]]


class AssistantError(Exception):
    """Raised with a message that is safe to show to the user."""


@dataclass
class ToolResult:
    """Result the editor reports for one tool call."""

    ok: bool
    #: Text returned to the model.
    result: str
    #: Short label for the chat UI.
    summary: str


def _estimate_tokens(chars: int) -> int:
    """Roughly estimate tokens when a provider reports no usage."""
    return max(1, chars // 4)


class AssistantSession:
    """Runs assistant turns for one editor connection.

    The model is called from the server, where the user's key lives. Tools
    are executed by the editor against the live document: each call is sent
    over the socket and the turn waits for the matching result.
    """

    def __init__(self, user_id: str, presentation_id: str, conversation_id: str, emit: Emit) -> None:
        self.user_id = user_id
        self.presentation_id = presentation_id
        self.conversation_id = conversation_id
        self._emit = emit
        self._task: asyncio.Task[None] | None = None
        self._pending: dict[str, asyncio.Future[ToolResult]] = {}
        self.document = DocumentInfo()

    @property
    def busy(self) -> bool:
        """Whether a turn is in progress."""
        return self._task is not None and not self._task.done()

    def start_turn(self, text: str, document: DocumentInfo) -> bool:
        """Start a turn in the background.

        Args:
            text: User message.
            document: State of the open document.

        Returns:
            False when another turn is still running.
        """
        if self.busy:
            return False
        self.document = document
        self._task = asyncio.create_task(self._run_turn(text))
        return True

    def resolve_tool(self, call_id: str, result: ToolResult, document: DocumentInfo | None) -> None:
        """Deliver the editor's result to the turn waiting for it.

        Args:
            call_id: Identifier sent with the tool call.
            result: Outcome reported by the editor.
            document: Document state after the tool ran.
        """
        if document is not None:
            self.document = document
        future = self._pending.pop(call_id, None)
        if future is not None and not future.done():
            future.set_result(result)

    async def stop(self) -> None:
        """Cancel the turn in progress, if any, and wait for it to unwind."""
        task = self._task
        if task is None or task.done():
            return
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

    async def _load_provider_params(self) -> tuple[AICredential, ChatParams]:
        """Resolve the active credential into request parameters.

        Returns:
            Tuple with the credential and parameters lacking only the messages.

        Raises:
            AssistantError: No usable key is configured.
        """
        async with async_session_factory() as db:
            result = await db.execute(select(AICredential).where(AICredential.user_id == self.user_id, AICredential.is_active.is_(True)))
            credential = result.scalar_one_or_none()
        if credential is None:
            raise AssistantError("Configura una clave API en tu perfil para usar el asistente")
        provider = ai_providers.get(credential.provider)
        if provider is None:
            raise AssistantError("El proveedor configurado ya no está disponible")
        base_url = provider.default_base_url
        if provider.requires_base_url:
            try:
                base_url = await validate_base_url(credential.base_url or "")
            except UnsafeBaseUrlError as exc:
                raise AssistantError(str(exc)) from exc
        try:
            api_key = decrypt_secret(credential.encrypted_key)
        except SecretDecryptionError as exc:
            raise AssistantError("La clave guardada ya no se puede leer. Vuelve a introducirla en tu perfil.") from exc
        return credential, ChatParams(api_key=api_key, base_url=base_url, model=credential.model, messages=[], tools=ASSISTANT_TOOLS, max_output_tokens=settings.ai_max_output_tokens)

    async def _record_usage(self, credential: AICredential, input_tokens: int, output_tokens: int, estimated: bool) -> None:
        """Persist the usage of one model request and report the chat totals.

        Args:
            credential: Credential used for the request.
            input_tokens: Prompt tokens.
            output_tokens: Completion tokens.
            estimated: True when the provider did not report usage.
        """
        async with async_session_factory() as db:
            db.add(AIUsage(user_id=self.user_id, provider=credential.provider, model=credential.model, presentation_id=self.presentation_id, input_tokens=input_tokens, output_tokens=output_tokens, estimated=estimated))
            conversation = await db.get(AIConversation, self.conversation_id)
            totals = {"input_tokens": input_tokens, "output_tokens": output_tokens}
            if conversation is not None:
                conversation.input_tokens += input_tokens
                conversation.output_tokens += output_tokens
                totals = {"input_tokens": conversation.input_tokens, "output_tokens": conversation.output_tokens}
            await db.commit()
        await self._emit("CHAT_USAGE", totals)

    async def _call_tool(self, name: str, arguments: str) -> ToolResult:
        """Ask the editor to run a tool and wait for its result.

        Args:
            name: Tool name.
            arguments: Arguments as the JSON string produced by the model.

        Returns:
            Result reported by the editor, or a failure when it does not answer.
        """
        call_id = uuid.uuid4().hex
        future: asyncio.Future[ToolResult] = asyncio.get_running_loop().create_future()
        self._pending[call_id] = future
        await self._emit("TOOL_CALL", {"call_id": call_id, "name": name, "arguments": arguments})
        try:
            return await asyncio.wait_for(future, TOOL_TIMEOUT_SECONDS)
        except asyncio.TimeoutError:
            return ToolResult(ok=False, result="Error: the editor did not respond in time", summary=f"El editor no respondió a {name}")
        finally:
            self._pending.pop(call_id, None)

    async def _run_turn(self, text: str) -> None:
        """Run one user turn: call the model and its tools until it answers.

        Every message is stored as soon as it is complete, so a dropped
        connection or a stop keeps the conversation consistent.

        Args:
            text: User message.
        """
        finish_reason = "stop"
        try:
            credential, base_params = await self._load_provider_params()
            provider = ai_providers.get(credential.provider)
            assert provider is not None
            async with async_session_factory() as db:
                await append_message(db, self.conversation_id, "user", text)
            await self._emit("CHAT_STARTED", {})

            for step in range(MAX_STEPS_PER_TURN):
                async with async_session_factory() as db:
                    history = to_model_messages(await list_messages(db, self.conversation_id))
                messages = [{"role": "system", "content": build_system_prompt(self.document)}, *history]
                params = ChatParams(**{**base_params.__dict__, "messages": messages})

                step_text = ""
                calls: list[dict[str, str]] = []
                usage: tuple[int, int] | None = None
                output_chars = 0
                rejected = False
                try:
                    async for event in provider.stream_chat(params):
                        if event.type == "text":
                            delta = str(event.data.get("delta", ""))
                            step_text += delta
                            output_chars += len(delta)
                            await self._emit("CHAT_DELTA", {"text": delta})
                        elif event.type == "tool_start":
                            await self._emit("TOOL_PREPARING", {"name": event.data.get("name", "")})
                        elif event.type == "tool_call":
                            calls.append({"id": str(event.data["id"]), "name": str(event.data["name"]), "arguments": str(event.data["arguments"])})
                            output_chars += len(calls[-1]["arguments"])
                        elif event.type == "usage":
                            usage = (int(event.data["input_tokens"]), int(event.data["output_tokens"]))  # type: ignore[call-overload]
                        elif event.type == "done":
                            finish_reason = str(event.data.get("finish_reason", "stop"))
                        elif event.type == "error":
                            rejected = True
                            raise AssistantError(str(event.data.get("message", "El proveedor devolvió un error")))
                finally:
                    # A stopped response was still generated and billed; a rejected request was not.
                    if usage is not None:
                        await asyncio.shield(self._record_usage(credential, *usage, estimated=False))
                    elif not rejected:
                        estimate = (_estimate_tokens(sum(len(json.dumps(m)) for m in messages)), _estimate_tokens(output_chars))
                        await asyncio.shield(self._record_usage(credential, *estimate, estimated=True))

                async with async_session_factory() as db:
                    await append_message(db, self.conversation_id, "assistant", step_text, tool_calls=calls or None)
                if not calls:
                    break
                await self._emit("CHAT_STEP", {})
                for call in calls:
                    result = await self._call_tool(call["name"], call["arguments"])
                    async with async_session_factory() as db:
                        await append_message(db, self.conversation_id, "tool", result.result[:MAX_TOOL_RESULT_CHARS], tool_call_id=call["id"], summary=result.summary, ok=result.ok)
                if step == MAX_STEPS_PER_TURN - 1:
                    finish_reason = "max_steps"
            await self._emit("CHAT_DONE", {"finish_reason": finish_reason})
        except asyncio.CancelledError:
            await asyncio.shield(self._emit("CHAT_DONE", {"finish_reason": "stopped"}))
            raise
        except AssistantError as exc:
            await self._emit("CHAT_ERROR", {"message": str(exc)})
        except Exception:
            await self._emit("CHAT_ERROR", {"message": "El asistente falló de forma inesperada"})
            raise
        finally:
            for future in self._pending.values():
                future.cancel()
            self._pending.clear()
