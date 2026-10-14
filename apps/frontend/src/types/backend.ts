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
  display_name: string | null;
  avatar_url: string | null;
  has_password: boolean;
  google_linked: boolean;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
}

/**
 * Aggregated profile statistics with quota usage.
 */
export interface UserStats {
  presentations_count: number;
  used_bytes: number;
  quota_bytes: number;
  remaining_bytes: number;
}

/**
 * Outcome of an authentication step. The session travels in HttpOnly cookies,
 * so no token is ever part of a response.
 */
export interface AuthResult {
  /** `verification_required` means the emailed code must be confirmed first */
  status: "authenticated" | "verification_required";
  user: User | null;
  email: string | null;
  /** Ticket that authorizes verifying or resending the code */
  ticket: string | null;
  /** Seconds until another code may be requested */
  resend_in: number | null;
  /** Seconds until the current code expires */
  expires_in: number | null;
}

/**
 * Timing of the verification code currently valid.
 */
export interface CodeStatus {
  resend_in: number;
  expires_in: number;
  /** Whether the request sent a new email */
  sent: boolean;
}

/**
 * Runtime feature flags and limits exposed by the server.
 */
export interface RuntimeConfig {
  turnstile_enabled: boolean;
  turnstile_site_key: string | null;
  upload_quota_bytes: number;
  google_client_id?: string | null;
  email_verification_enabled?: boolean;
  /** Address shown in the legal pages and the footer */
  contact_email?: string | null;
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
  is_public: boolean;
}

/**
 * What an anonymous viewer of a public room may load: the slides shown so
 * far, without speaker notes.
 */
export interface PublicRoom {
  code: string;
  title: string;
  total_slides: number;
  data: Record<string, unknown>;
}

/**
 * AI provider that can be configured from the profile.
 */
export interface AiProvider {
  id: string;
  label: string;
  default_base_url: string;
  key_url: string;
  requires_base_url: boolean;
}

/**
 * Stored AI credential; the key itself never leaves the server.
 */
export interface AiCredential {
  provider: string;
  label: string;
  key_hint: string;
  model: string;
  base_url: string | null;
  is_active: boolean;
  updated_at: string;
}

/**
 * Token usage aggregated for one calendar day.
 */
export interface AiUsageDay {
  date: string;
  input_tokens: number;
  output_tokens: number;
  requests: number;
}

/**
 * Token usage aggregated for one provider model.
 */
export interface AiUsageModel {
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  requests: number;
}

/**
 * Token usage over a period with daily and per-model breakdowns.
 */
export interface AiUsageSummary {
  days: number;
  input_tokens: number;
  output_tokens: number;
  requests: number;
  has_estimates: boolean;
  by_day: AiUsageDay[];
  by_model: AiUsageModel[];
}