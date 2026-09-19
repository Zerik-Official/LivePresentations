import type { ApiClient } from "./client";
import type { RuntimeConfig } from "@/types/backend";

/**
 * Runtime configuration endpoints.
 */
export class ConfigApi {
  private readonly client: ApiClient;

  /**
   * @param client - Shared API client
   */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * Fetch runtime configuration (public).
   * @returns Runtime config
   */
  async fetchRuntimeConfig(): Promise<RuntimeConfig> {
    const { data } = await this.client.axios.get<RuntimeConfig>("/api/config");
    return data;
  }
}
