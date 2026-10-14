import type { ApiClient } from "./client";
import type { Presentation } from "@/types/backend";

/** Largest body a keepalive request may carry, below the browser's 64 KiB quota. */
const KEEPALIVE_MAX_BYTES = 60_000;

/**
 * Presentation CRUD and import/export.
 */
export class PresentationsApi {
  private readonly client: ApiClient;

  /**
   * @param client - Shared API client
   */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * List presentations owned by current user.
   * @returns Presentations
   */
  async list(): Promise<Presentation[]> {
    const { data } = await this.client.axios.get<Presentation[]>("/api/presentations");
    return data;
  }

  /**
   * Fetch a presentation by id.
   * @param id - Presentation id
   * @returns Presentation
   */
  async get(id: string): Promise<Presentation> {
    const { data } = await this.client.axios.get<Presentation>(`/api/presentations/${id}`);
    return data;
  }

  /**
   * Update a presentation.
   * @param id - Presentation id
   * @param payload - Update payload
   * @returns Updated presentation
   */
  async update(id: string, payload: { title?: string; data?: Record<string, unknown> }): Promise<Presentation> {
    const { data } = await this.client.axios.put<Presentation>(`/api/presentations/${id}`, payload);
    return data;
  }

  /**
   * Update a presentation while the page is closing. Small documents use a
   * keepalive request, which the browser finishes after the page is gone;
   * larger ones exceed the keepalive quota and go through the regular client.
   * @param id - Presentation id
   * @param payload - Update payload
   */
  saveOnExit(id: string, payload: { title?: string; data?: Record<string, unknown> }): void {
    const body = JSON.stringify(payload);
    if (new TextEncoder().encode(body).length > KEEPALIVE_MAX_BYTES) {
      void this.update(id, payload).catch(() => null);
      return;
    }
    void fetch(`${this.client.baseURL}/api/presentations/${id}`, {
      method: "PUT",
      body,
      keepalive: true,
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    }).catch(() => null);
  }

  /**
   * Create a presentation.
   * @param title - Presentation title
   * @param pdata - Optional initial data
   * @returns Created presentation
   */
  async create(title: string, pdata?: Record<string, unknown>): Promise<Presentation> {
    const { data } = await this.client.axios.post<Presentation>("/api/presentations", {
      title,
      data: pdata ?? { slides: [], width: 1280, height: 720 },
    });
    return data;
  }

  /**
   * Delete a presentation.
   * @param id - Presentation id
   */
  async delete(id: string): Promise<void> {
    await this.client.axios.delete(`/api/presentations/${id}`);
  }

  /**
   * Export presentation as zip package.
   * @param id - Presentation id
   * @returns Blob
   */
  async exportZip(id: string): Promise<Blob> {
    const { data } = await this.client.axios.get<Blob>(`/api/presentations/${id}/export`, { responseType: "blob" as unknown as "json" });
    return data as Blob;
  }

  /**
   * Import presentation from zip file.
   * @param file - Zip file
   * @returns Imported presentation
   */
  async importZip(file: File): Promise<Presentation> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await this.client.axios.post<Presentation>("/api/presentations/import-zip", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }
}
