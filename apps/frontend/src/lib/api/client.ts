import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

/**
 * Central axios client with auth interceptor and normalized error handling.
 */
export class ApiClient {
  /** Underlying axios instance */
  readonly axios: AxiosInstance;

  /**
   * @param baseURL - Backend base URL (empty for relative)
   */
  constructor(baseURL: string) {
    this.axios = axios.create({
      baseURL,
      timeout: 20000,
      headers: { "Content-Type": "application/json" },
    });

    this.axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem("access_token");
      if (token && config.headers) {
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.axios.interceptors.response.use(
      (res) => res,
      (error: AxiosError<{ detail?: string }>) => {
        const detail = error.response?.data?.detail;
        const message = detail ?? error.message ?? "Error inesperado";
        return Promise.reject(new Error(message));
      },
    );
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
