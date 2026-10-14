import { apiClient } from "./client";
import type { ApiClient } from "./client";
import type { User, UserStats } from "@/types/backend";

/**
 * Resolve a backend-relative file URL to an absolute URL.
 * @param url - Relative or absolute URL from the API
 * @returns Absolute URL usable as image source
 */
export function resolveFileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = apiClient.baseURL.replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

/**
 * Current user profile endpoints.
 */
export class UsersApi {
  private readonly client: ApiClient;

  /**
   * @param client - Shared API client
   */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * Fetch current authenticated user.
   * @returns User profile
   */
  async fetchMe(): Promise<User> {
    const { data } = await this.client.axios.get<User>("/api/users/me");
    return data;
  }

  /**
   * Fetch aggregated profile statistics.
   * @returns Presentation count and quota usage
   */
  async fetchStats(): Promise<UserStats> {
    const { data } = await this.client.axios.get<UserStats>("/api/users/me/stats");
    return data;
  }

  /**
   * Update editable profile fields.
   * @param displayName - Display name or null to clear
   * @returns Updated user profile
   */
  async updateProfile(displayName: string | null): Promise<User> {
    const { data } = await this.client.axios.patch<User>("/api/users/me", {
      display_name: displayName,
    });
    return data;
  }

  /**
   * Change the account password, or create one for Google-only accounts.
   * @param currentPassword - Current password, or null when the account has none
   * @param newPassword - New password with at least 8 characters
   * @returns Confirmation status
   */
  async changePassword(currentPassword: string | null, newPassword: string): Promise<{ status: string }> {
    const { data } = await this.client.axios.post<{ status: string }>("/api/users/me/password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return data;
  }

  /**
   * Upload or replace the profile picture.
   * @param file - Image file (JPG, PNG, GIF or WebP up to 5MB)
   * @returns Updated user profile
   */
  async uploadAvatar(file: File): Promise<User> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await this.client.axios.post<User>("/api/users/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }

  /**
   * Remove the profile picture.
   * @returns Updated user profile
   */
  async deleteAvatar(): Promise<User> {
    const { data } = await this.client.axios.delete<User>("/api/users/me/avatar");
    return data;
  }
}
