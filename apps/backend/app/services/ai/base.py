from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Literal

StreamEventType = Literal["text", "tool_start", "tool_call", "usage", "done", "error"]


class AIProviderError(Exception):
    """Raised when a provider rejects a request or cannot be reached."""


@dataclass(frozen=True)
class StreamEvent:
    """Provider-agnostic event produced while a model response streams.

    `text` carries `{"delta"}`, `tool_start` carries `{"name"}` as soon as the
    model begins writing a call, `tool_call` carries `{"id", "name",
    "arguments"}` with arguments as a JSON string, `usage` carries
    `{"input_tokens", "output_tokens"}`, `done` carries `{"finish_reason"}`
    and `error` carries `{"message"}`.
    """

    type: StreamEventType
    data: dict[str, object] = field(default_factory=dict)


@dataclass(frozen=True)
class ChatParams:
    """Everything a provider needs to run one chat completion.

    Messages and tools use the OpenAI chat-completions shape, which is the
    canonical format of the API; providers with another wire format convert.
    """

    api_key: str
    base_url: str
    model: str
    messages: list[dict[str, object]]
    tools: list[dict[str, object]]
    max_output_tokens: int


class AIProvider(ABC):
    """Contract every AI provider implements.

    Subclass it and register an instance in `app.services.ai.registry` to make
    a new provider selectable from the profile.
    """

    id: str
    label: str
    default_base_url: str
    key_url: str
    requires_base_url: bool = False

    @abstractmethod
    def stream_chat(self, params: ChatParams) -> AsyncIterator[StreamEvent]:
        """Stream a chat completion as provider-agnostic events.

        Args:
            params: Request parameters.

        Returns:
            Async iterator ending with a `done` or `error` event.
        """

    @abstractmethod
    async def list_models(self, api_key: str, base_url: str) -> list[str]:
        """List the model ids the key can use.

        Args:
            api_key: Provider API key.
            base_url: Provider base URL.

        Returns:
            Sorted model ids.

        Raises:
            AIProviderError: The provider rejected the key or is unreachable.
        """
