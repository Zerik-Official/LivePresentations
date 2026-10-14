import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

const REFRESH_PATH = "/api/auth/refresh";

/** Request config flagged once it has been retried after a session refresh. */
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/**
 * Central axios client with cookie sessions and normalized error handling.
 * The session lives in HttpOnly cookies that JavaScript cannot read, so no
 * token is stored or attached here: the browser sends the cookies itself.
 */
export class ApiClient {
  /** Underlying axios instance */
  readonly axios: AxiosInstance;
  private refreshing: Promise<boolean> | null = null;
  private onSessionExpired: (() => void) | null = null;

  /**
   * @param baseURL - Backend base URL (empty for relative)
   */
  constructor(baseURL: string) {
    this.axios = axios.create({
      baseURL,
      timeout: 20000,
      withCredentials: true,
      // The backend refuses cookie-authenticated writes without this header,
      // which other sites cannot add to their requests (CSRF protection).
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
    });

    this.axios.interceptors.response.use(
      (res) => res,
      async (error: AxiosError<{ detail?: string }>) => {
        const config = error.config as RetriableConfig | undefined;
        const isAuthCall = config?.url?.startsWith("/api/auth/") ?? false;
        if (error.response?.status === 401 && config && !config._retried && !isAuthCall) {
          config._retried = true;
          if (await this.refreshSession()) return this.axios.request(config);
          this.onSessionExpired?.();
        }
        const detail = error.response?.data?.detail;
        const message = (typeof detail === "string" ? detail : null) ?? error.message ?? "Error inesperado";
        return Promise.reject(new Error(message));
      },
    );
  }

  /**
   * Renew the short-lived access token with the refresh cookie.
   * Concurrent callers share one request, since each refresh token works once.
   * @returns True when the session was renewed
   */
  refreshSession(): Promise<boolean> {
    this.refreshing ??= this.axios
      .post(REFRESH_PATH)
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        this.refreshing = null;
      });
    return this.refreshing;
  }

  /**
   * Register what to do when the session can no longer be renewed.
   * @param handler - Called once per failed renewal
   */
  setSessionExpiredHandler(handler: () => void): void {
    this.onSessionExpired = handler;
  }

  /**
   * Raw base URL for debugging.
   */
  get baseURL(): string {
    return (this.axios.defaults.baseURL as string) ?? "";
  }
}

const API_BASE = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, "") ?? "";

/** Public Turnstile key from env */
export const TURNSTILE_PUBLIC_KEY = import.meta.env.VITE_TURNSTILE_PUBLIC_KEY as string | undefined;

/** Singleton client */
export const apiClient = new ApiClient(API_BASE);
