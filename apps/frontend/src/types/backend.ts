/**
 * Backend contract types for LivePresentations API.
 * Mirrors server entities for auth, presentations and rooms.
 */

/**
 * Authenticated user profile.
 */
export interface User {
  id: string;
  email: string;
  created_at: string;
}

/**
 * Authentication response with bearer token.
 */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/**
 * Runtime feature flags and limits exposed by the server.
 */
export interface RuntimeConfig {
  turnstile_enabled: boolean;
  turnstile_site_key: string | null;
  upload_quota_bytes: number;
}

/**
 * Presentation entity persisted on the backend.
 */
export interface Presentation {
  id: string;
  owner_id: string;
  title: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Room entity linking a presentation to a live session.
 */
export interface Room {
  code: string;
  presentation_id: string;
  current_slide: number;
  highlighted_id: string | null;
  show_controls: boolean;
  fullscreen: boolean;
  anti_spoiler: boolean;
  auto_fullscreen: boolean;
}
