import type { ApiClient } from "./client";
import type { AuthResult, CodeStatus, User } from "@/types/backend";

/**
 * Authentication related endpoints.
 * Sessions are carried by HttpOnly cookies set by the server; these calls
 * never see or store a token.
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
   * @returns Authenticated user, or a request to verify the email
   */
  async register(email: string, password: string, turnstileToken?: string): Promise<AuthResult> {
    const { data } = await this.client.axios.post<AuthResult>("/api/auth/register", {
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
   * @returns Authenticated user, or a request to verify the email
   */
  async login(email: string, password: string, turnstileToken?: string): Promise<AuthResult> {
    const { data } = await this.client.axios.post<AuthResult>("/api/auth/login", {
      email,
      password,
      turnstile_token: turnstileToken,
    });
    return data;
  }

  /**
   * Sign in or sign up with a Google ID token.
   * @param credential - ID token returned by Google Identity Services
   * @param turnstileToken - Captcha token, required when the captcha is enabled
   * @returns Authenticated user
   */
  async loginWithGoogle(credential: string, turnstileToken?: string): Promise<AuthResult> {
    const { data } = await this.client.axios.post<AuthResult>("/api/auth/google", { credential, turnstile_token: turnstileToken });
    return data;
  }

  /**
   * Confirm the emailed one-time code and open the session.
   * @param ticket - Verification ticket from register or login
   * @param code - Code typed by the user
   * @returns Authenticated user
   */
  async verifyEmail(ticket: string, code: string): Promise<AuthResult> {
    const { data } = await this.client.axios.post<AuthResult>("/api/auth/verify-email", { ticket, code });
    return data;
  }

  /**
   * Ask for another verification code.
   * @param ticket - Verification ticket from register or login
   * @returns Code timing; `sent` is false while the cooldown is running
   */
  async resendCode(ticket: string): Promise<CodeStatus> {
    const { data } = await this.client.axios.post<CodeStatus>("/api/auth/resend-code", { ticket });
    return data;
  }

  /**
   * Close the session on the server and clear its cookies.
   */
  async logout(): Promise<void> {
    await this.client.axios.post("/api/auth/logout");
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
