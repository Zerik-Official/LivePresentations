import type { ApiClient } from "./client";

/**
 * File upload endpoints.
 */
export class UploadsApi {
  private readonly client: ApiClient;

  /**
   * @param client - Shared API client
   */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * Upload an image or video within the configured user quota.
   * @param file - File to upload
   * @returns URL of uploaded file
   */
  async uploadFile(file: File): Promise<{ url: string }> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await this.client.axios.post<{ url: string }>("/api/uploads", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }
}
