import type { ApiClient } from "./client";
import type { AuthResponse, User } from "@/types/backend";

/**
 * Authentication related endpoints.
 */
export class AuthApi {
  private readonly client: ApiClient;

  /**
   * @param client - Shared API client
   */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * Register a new user.
   * @param email - User email
   * @param password - User password (min 8 chars)
   * @param turnstileToken - Optional captcha token
   * @returns Auth response with token and user
   */
  async register(email: string, password: string, turnstileToken?: string): Promise<AuthResponse> {
    const { data } = await this.client.axios.post<AuthResponse>("/api/auth/register", {
      email,
      password,
      turnstile_token: turnstileToken,
    });
    return data;
  }

  /**
   * Login with email and password.
   * @param email - User email
   * @param password - User password
   * @param turnstileToken - Optional captcha token
   * @returns Auth response with token and user
   */
  async login(email: string, password: string, turnstileToken?: string): Promise<AuthResponse> {
    const { data } = await this.client.axios.post<AuthResponse>("/api/auth/login", {
      email,
      password,
      turnstile_token: turnstileToken,
    });
    return data;
  }

  /**
   * Fetch current authenticated user.
   * @returns User profile
   */
  async fetchMe(): Promise<User> {
    const { data } = await this.client.axios.get<User>("/api/users/me");
    return data;
  }
}
