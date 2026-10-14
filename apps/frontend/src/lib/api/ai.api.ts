import type { ApiClient } from "./client";
import type { AiCredential, AiProvider, AiUsageSummary } from "@/types/backend";

/**
 * Payload to store or update a provider credential.
 */
export interface AiCredentialInput {
  /** New key; omit to keep the stored one. */
  apiKey?: string;
  model: string;
  baseUrl?: string;
}

/**
 * AI assistant endpoints: provider credentials and usage.
 * The chat itself runs over the assistant WebSocket.
 */
export class AiApi {
  private readonly client: ApiClient;

  /**
   * @param client - Shared API client
   */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * List the providers that can be configured.
   * @returns Provider catalog
   */
  async listProviders(): Promise<AiProvider[]> {
    const { data } = await this.client.axios.get<AiProvider[]>("/api/ai/providers");
    return data;
  }

  /**
   * List the stored credentials of the current user.
   * @returns Credentials without their keys
   */
  async listCredentials(): Promise<AiCredential[]> {
    const { data } = await this.client.axios.get<AiCredential[]>("/api/ai/credentials");
    return data;
  }

  /**
   * Store or update the credential of a provider and make it active.
   * @param provider - Provider id
   * @param input - Key, model and optional base URL
   * @returns Stored credential
   */
  async saveCredential(provider: string, input: AiCredentialInput): Promise<AiCredential> {
    const { data } = await this.client.axios.put<AiCredential>(`/api/ai/credentials/${provider}`, {
      api_key: input.apiKey || undefined,
      model: input.model,
      base_url: input.baseUrl || undefined,
    });
    return data;
  }

  /**
   * Select which stored provider the assistant uses.
   * @param provider - Provider id
   * @returns Activated credential
   */
  async activateCredential(provider: string): Promise<AiCredential> {
    const { data } = await this.client.axios.post<AiCredential>(`/api/ai/credentials/${provider}/activate`);
    return data;
  }

  /**
   * Delete the stored key of a provider.
   * @param provider - Provider id
   */
  async deleteCredential(provider: string): Promise<void> {
    await this.client.axios.delete(`/api/ai/credentials/${provider}`);
  }

  /**
   * List the models a key can use, which also validates the key.
   * @param provider - Provider id
   * @param apiKey - New key, or undefined to use the stored one
   * @param baseUrl - Base URL for providers that need one
   * @returns Sorted model ids
   */
  async listModels(provider: string, apiKey?: string, baseUrl?: string): Promise<string[]> {
    const { data } = await this.client.axios.post<string[]>("/api/ai/models", {
      provider,
      api_key: apiKey || undefined,
      base_url: baseUrl || undefined,
    });
    return data;
  }

  /**
   * Fetch the token usage summary.
   * @param days - Period length in days
   * @returns Usage totals with breakdowns
   */
  async fetchUsage(days: number): Promise<AiUsageSummary> {
    const { data } = await this.client.axios.get<AiUsageSummary>("/api/ai/usage", { params: { days } });
    return data;
  }
}
