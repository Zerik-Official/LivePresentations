from __future__ import annotations

from app.services.ai.base import AIProvider
from app.services.ai.openai_compatible import OpenAICompatibleProvider


class ProviderRegistry:
    """Catalog of the AI providers users can configure."""

    def __init__(self) -> None:
        self._providers: dict[str, AIProvider] = {}

    def register(self, provider: AIProvider) -> AIProvider:
        """Add a provider to the catalog.

        Args:
            provider: Provider instance with a unique id.

        Returns:
            The registered provider.
        """
        if provider.id in self._providers:
            raise ValueError(f"AI provider already registered: {provider.id}")
        self._providers[provider.id] = provider
        return provider

    def get(self, provider_id: str) -> AIProvider | None:
        """Look up a provider by id.

        Args:
            provider_id: Provider identifier.

        Returns:
            Provider or None when unknown.
        """
        return self._providers.get(provider_id)

    def all(self) -> list[AIProvider]:
        """List providers in registration order.

        Returns:
            Registered providers.
        """
        return list(self._providers.values())


ai_providers = ProviderRegistry()

ai_providers.register(OpenAICompatibleProvider(id="gemini", label="Google Gemini", default_base_url="https://generativelanguage.googleapis.com/v1beta/openai", key_url="https://aistudio.google.com/apikey"))
ai_providers.register(OpenAICompatibleProvider(id="nvidia", label="NVIDIA NIM", default_base_url="https://integrate.api.nvidia.com/v1", key_url="https://build.nvidia.com/settings/api-keys"))
ai_providers.register(OpenAICompatibleProvider(id="openai", label="OpenAI", default_base_url="https://api.openai.com/v1", key_url="https://platform.openai.com/api-keys", max_tokens_param="max_completion_tokens"))
ai_providers.register(OpenAICompatibleProvider(id="groq", label="Groq", default_base_url="https://api.groq.com/openai/v1", key_url="https://console.groq.com/keys"))
ai_providers.register(OpenAICompatibleProvider(id="openrouter", label="OpenRouter", default_base_url="https://openrouter.ai/api/v1", key_url="https://openrouter.ai/keys"))
ai_providers.register(OpenAICompatibleProvider(id="mistral", label="Mistral", default_base_url="https://api.mistral.ai/v1", key_url="https://console.mistral.ai/api-keys"))
ai_providers.register(OpenAICompatibleProvider(id="deepseek", label="DeepSeek", default_base_url="https://api.deepseek.com/v1", key_url="https://platform.deepseek.com/api_keys"))
ai_providers.register(OpenAICompatibleProvider(id="custom", label="Compatible con OpenAI (URL propia)", default_base_url="", requires_base_url=True))
