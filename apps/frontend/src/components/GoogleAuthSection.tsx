import { useCallback } from "react";

import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { authApi } from "@/lib/api";
import type { AuthResult } from "@/types/backend";

interface Props {
  /** OAuth web client id, or empty when Google access is disabled */
  clientId: string | null | undefined;
  /** Button caption variant */
  text: "signin_with" | "signup_with";
  /** Whether a solved captcha is required before using Google */
  captchaRequired: boolean;
  /** Token of the solved captcha, or null while it is pending */
  captchaToken: string | null;
  /** Receives the result of a successful Google sign-in */
  onResult: (result: AuthResult) => void;
  /** Reports a failed Google sign-in to the host form */
  onError: (message: string) => void;
  /** Called after every attempt, since the captcha token is spent */
  onAttempt: () => void;
}

/**
 * Google access block for the auth forms: an "or" divider and the button.
 * The button stays locked until the captcha is solved, and the captcha token
 * is verified by the server together with the Google credential.
 * Renders nothing when the server has no Google client id configured.
 * @param clientId - OAuth web client id
 * @param text - Caption variant
 * @param captchaRequired - Whether the captcha gates the button
 * @param captchaToken - Solved captcha token
 * @param onResult - Success handler
 * @param onError - Error reporter
 * @param onAttempt - Called after each attempt
 * @returns Google access block or null
 */
export function GoogleAuthSection({ clientId, text, captchaRequired, captchaToken, onResult, onError, onAttempt }: Props): React.ReactNode {
  const locked = captchaRequired && !captchaToken;

  const handleCredential = useCallback(
    (credential: string) => {
      void authApi
        .loginWithGoogle(credential, captchaToken ?? undefined)
        .then(onResult)
        .catch((err: unknown) => onError(err instanceof Error ? err.message : "No se pudo acceder con Google"))
        .finally(onAttempt);
    },
    [captchaToken, onAttempt, onError, onResult],
  );

  if (!clientId) return null;

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />o<span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <div className={`mt-5 transition-opacity ${locked ? "pointer-events-none opacity-40" : ""}`} aria-disabled={locked} inert={locked}>
        <GoogleSignInButton clientId={clientId} text={text} onCredential={handleCredential} />
      </div>
      {locked && <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">Completa el captcha para continuar con Google.</p>}
    </div>
  );
}
