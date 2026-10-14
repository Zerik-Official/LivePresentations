from __future__ import annotations

import json
from collections.abc import AsyncIterator

import httpx

from app.core.config import settings
from app.services.ai.base import AIProvider, AIProviderError, ChatParams, StreamEvent


def _error_message(status_code: int, body: bytes) -> str:
    """Extract a readable message from a provider error response.

    Args:
        status_code: HTTP status returned by the provider.
        body: Raw response body.

    Returns:
        Message safe to show to the user.
    """
    detail = ""
    try:
        parsed = json.loads(body)
        if isinstance(parsed, list) and parsed:
            parsed = parsed[0]
        error = parsed.get("error", parsed) if isinstance(parsed, dict) else None
        if isinstance(error, dict):
            detail = str(error.get("message") or error.get("detail") or "")
        elif isinstance(error, str):
            detail = error
    except ValueError:
        detail = body.decode(errors="replace")
    detail = detail.strip()[:400]
    if status_code in (401, 403):
        return f"El proveedor rechazó la clave API ({status_code}). {detail}".strip()
    if status_code == 429:
        return f"El proveedor limitó las peticiones o se agotó la cuota (429). {detail}".strip()
    return f"El proveedor respondió con un error {status_code}. {detail}".strip()


class OpenAICompatibleProvider(AIProvider):
    """Provider speaking the OpenAI chat-completions protocol.

    Covers OpenAI itself and every service exposing a compatible endpoint
    (Gemini, NVIDIA NIM, Groq, OpenRouter, Mistral, DeepSeek, self-hosted).
    """

    def __init__(
        self,
        *,
        id: str,
        label: str,
        default_base_url: str,
        key_url: str = "",
        requires_base_url: bool = False,
        max_tokens_param: str = "max_tokens",
    ) -> None:
        self.id = id
        self.label = label
        self.default_base_url = default_base_url
        self.key_url = key_url
        self.requires_base_url = requires_base_url
        self._max_tokens_param = max_tokens_param

    def _headers(self, api_key: str) -> dict[str, str]:
        """Build the request headers for a key."""
        return {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    def _body(self, params: ChatParams, include_usage: bool) -> dict[str, object]:
        """Build the chat-completions request body.

        Args:
            params: Request parameters.
            include_usage: Ask for token usage in the final stream chunk.

        Returns:
            JSON body.
        """
        body: dict[str, object] = {
            "model": params.model,
            "messages": params.messages,
            "stream": True,
            self._max_tokens_param: params.max_output_tokens,
        }
        if params.tools:
            body["tools"] = params.tools
        if include_usage:
            body["stream_options"] = {"include_usage": True}
        return body

    async def stream_chat(self, params: ChatParams) -> AsyncIterator[StreamEvent]:
        """Stream a chat completion, retrying once without usage reporting.

        Some compatible servers reject `stream_options`; the retry keeps them
        working at the cost of estimated token counts.

        Args:
            params: Request parameters.

        Yields:
            Provider-agnostic stream events.
        """
        url = f"{params.base_url.rstrip('/')}/chat/completions"
        timeout = httpx.Timeout(settings.ai_request_timeout_seconds, connect=10)
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                for include_usage in (True, False):
                    async with client.stream("POST", url, headers=self._headers(params.api_key), json=self._body(params, include_usage)) as response:
                        if response.status_code == 400 and include_usage:
                            await response.aread()
                            continue
                        if response.status_code >= 400:
                            yield StreamEvent("error", {"message": _error_message(response.status_code, await response.aread())})
                            return
                        async for event in self._parse_stream(response):
                            yield event
                        return
        except httpx.TimeoutException:
            yield StreamEvent("error", {"message": "El proveedor tardó demasiado en responder"})
        except httpx.HTTPError:
            yield StreamEvent("error", {"message": "No se pudo conectar con el proveedor"})

    async def _parse_stream(self, response: httpx.Response) -> AsyncIterator[StreamEvent]:
        """Translate chat-completions SSE chunks into stream events.

        Tool call fragments are accumulated by index and emitted whole once
        the stream finishes.

        Args:
            response: Open streaming response.

        Yields:
            Provider-agnostic stream events.
        """
        tool_calls: dict[int, dict[str, str]] = {}
        finish_reason = "stop"
        async for line in response.aiter_lines():
            if not line.startswith("data:"):
                continue
            data = line[5:].strip()
            if not data or data == "[DONE]":
                continue
            try:
                chunk = json.loads(data)
            except ValueError:
                continue
            if not isinstance(chunk, dict):
                continue
            if isinstance(chunk.get("error"), (dict, str)):
                yield StreamEvent("error", {"message": _error_message(500, json.dumps(chunk).encode())})
                return
            usage = chunk.get("usage")
            if isinstance(usage, dict):
                yield StreamEvent("usage", {"input_tokens": int(usage.get("prompt_tokens") or 0), "output_tokens": int(usage.get("completion_tokens") or 0)})
            for choice in chunk.get("choices") or []:
                delta = choice.get("delta") or {}
                content = delta.get("content")
                if isinstance(content, str) and content:
                    yield StreamEvent("text", {"delta": content})
                for fragment in delta.get("tool_calls") or []:
                    index = int(fragment.get("index") or 0)
                    call = tool_calls.setdefault(index, {"id": "", "name": "", "arguments": ""})
                    function = fragment.get("function") or {}
                    if fragment.get("id"):
                        call["id"] = str(fragment["id"])
                    if function.get("name"):
                        if not call["name"]:
                            yield StreamEvent("tool_start", {"name": str(function["name"])})
                        call["name"] = str(function["name"])
                    if function.get("arguments"):
                        call["arguments"] += str(function["arguments"])
                if choice.get("finish_reason"):
                    finish_reason = str(choice["finish_reason"])
        for index in sorted(tool_calls):
            call = tool_calls[index]
            if call["name"]:
                yield StreamEvent("tool_call", {"id": call["id"] or f"call_{index}", "name": call["name"], "arguments": call["arguments"] or "{}"})
        yield StreamEvent("done", {"finish_reason": "tool_calls" if tool_calls else finish_reason})

    async def list_models(self, api_key: str, base_url: str) -> list[str]:
        """List model ids from the provider's `/models` endpoint.

        Args:
            api_key: Provider API key.
            base_url: Provider base URL.

        Returns:
            Sorted model ids.

        Raises:
            AIProviderError: The provider rejected the key or is unreachable.
        """
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.get(f"{base_url.rstrip('/')}/models", headers=self._headers(api_key))
        except httpx.HTTPError as exc:
            raise AIProviderError("No se pudo conectar con el proveedor") from exc
        if response.status_code >= 400:
            raise AIProviderError(_error_message(response.status_code, response.content))
        try:
            payload = response.json()
        except ValueError as exc:
            raise AIProviderError("El proveedor devolvió una respuesta no válida") from exc
        items = payload.get("data") if isinstance(payload, dict) else payload
        ids = {str(item["id"]).removeprefix("models/") for item in items or [] if isinstance(item, dict) and item.get("id")}
        return sorted(ids)
