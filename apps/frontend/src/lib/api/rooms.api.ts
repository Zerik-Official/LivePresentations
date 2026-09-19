import type { ApiClient } from "./client";
import type { Room } from "@/types/backend";

/**
 * Room management endpoints.
 */
export class RoomsApi {
  private readonly client: ApiClient;

  /**
   * @param client - Shared API client
   */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * Create a room for a presentation.
   * @param presentationId - Presentation id
   * @returns Room
   */
  async create(presentationId: string): Promise<Room> {
    const { data } = await this.client.axios.post<Room>("/api/rooms", { presentation_id: presentationId });
    return data;
  }

  /**
   * Fetch room by code.
   * @param code - Room code
   * @returns Room
   */
  async get(code: string): Promise<Room> {
    const { data } = await this.client.axios.get<Room>(`/api/rooms/${code}`);
    return data;
  }

  /**
   * List active rooms for current user.
   * @returns Rooms
   */
  async list(): Promise<Room[]> {
    try {
      const { data } = await this.client.axios.get<Room[]>("/api/rooms");
      return data;
    } catch {
      return [];
    }
  }

  /**
   * Update room config.
   * @param code - Room code
   * @param config - Config patch
   * @returns Updated room
   */
  async updateConfig(code: string, config: { show_controls?: boolean; fullscreen?: boolean; anti_spoiler?: boolean; auto_fullscreen?: boolean }): Promise<Room> {
    const { data } = await this.client.axios.patch<Room>(`/api/rooms/${code}/config`, config);
    return data;
  }

  /**
   * Delete a room by code.
   * @param code - Room code
   */
  async delete(code: string): Promise<void> {
    await this.client.axios.delete(`/api/rooms/${code}`);
  }
}
