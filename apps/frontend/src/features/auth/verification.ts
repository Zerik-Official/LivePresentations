import type { AuthResult } from "@/types/backend";

const STORAGE_KEY = "pending_verification";

/**
 * Email verification in progress.
 * The ticket only allows submitting or requesting codes for this account; it
 * is kept for the tab's lifetime so a reload does not lose the step.
 */
export interface PendingVerification {
  email: string;
  ticket: string;
  /** Epoch milliseconds from which another code may be requested */
  resendAt: number;
  /** Epoch milliseconds at which the current code expires */
  expiresAt: number;
}

/**
 * Build the pending verification from a server response.
 * @param email - Address the code was sent to
 * @param ticket - Verification ticket
 * @param resendIn - Seconds until another code may be requested
 * @param expiresIn - Seconds until the code expires
 * @returns Pending verification with absolute deadlines
 */
export function toPendingVerification(email: string, ticket: string, resendIn: number, expiresIn: number): PendingVerification {
  const now = Date.now();
  return { email, ticket, resendAt: now + resendIn * 1000, expiresAt: now + expiresIn * 1000 };
}

/**
 * Remember the verification step of a `verification_required` result.
 * @param result - Authentication result
 * @returns Stored verification, or null when the result does not ask for one
 */
export function savePendingVerification(result: AuthResult): PendingVerification | null {
  if (result.status !== "verification_required" || !result.email || !result.ticket) return null;
  const pending = toPendingVerification(result.email, result.ticket, result.resend_in ?? 0, result.expires_in ?? 0);
  storePendingVerification(pending);
  return pending;
}

/**
 * Persist the verification step for the current tab.
 * @param pending - Verification to store
 */
export function storePendingVerification(pending: PendingVerification): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // Without storage the step still works until the page is reloaded.
  }
}

/**
 * Load the verification step of the current tab.
 * @returns Stored verification or null
 */
export function loadPendingVerification(): PendingVerification | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null") as PendingVerification | null;
    return parsed && typeof parsed.ticket === "string" && typeof parsed.email === "string" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Forget the verification step.
 */
export function clearPendingVerification(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}
