import { useEffect, useRef, useState } from "react";

import { useThemeStore } from "@/stores/themeStore";

const GSI_SCRIPT_URL = "https://accounts.google.com/gsi/client";

/**
 * Subset of the Google Identity Services API used by the button.
 */
interface GoogleAccountsId {
  initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void; ux_mode?: "popup" }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

let scriptPromise: Promise<void> | null = null;

/**
 * Load the Google Identity Services script once per page.
 * @returns Promise resolved when `window.google` is available
 */
function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts.id) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("No se pudo cargar Google"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface Props {
  /** OAuth web client id exposed by the backend */
  clientId: string;
  /** Button caption variant */
  text: "signin_with" | "signup_with" | "continue_with";
  /** Called with the Google ID token after the user picks an account */
  onCredential: (credential: string) => void;
}

/**
 * Official "Sign in with Google" button rendered by Google Identity Services.
 * @param clientId - OAuth web client id
 * @param text - Caption variant
 * @param onCredential - Handler receiving the ID token
 * @returns Button container, or an error note when Google cannot load
 */
export function GoogleSignInButton({ clientId, text, onCredential }: Props): React.ReactNode {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onCredential);
  const theme = useThemeStore((s) => s.theme);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;
    void loadGoogleScript()
      .then(() => {
        const container = containerRef.current;
        if (cancelled || !container || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: "popup",
          callback: (response) => {
            if (response.credential) callbackRef.current(response.credential);
          },
        });
        container.replaceChildren();
        window.google.accounts.id.renderButton(container, {
          type: "standard",
          theme: theme === "dark" ? "filled_black" : "outline",
          size: "large",
          shape: "rectangular",
          text,
          logo_alignment: "center",
          width: Math.min(400, Math.max(200, Math.round(container.clientWidth))),
          locale: "es",
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, text, theme]);

  if (failed) return <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">No se pudo cargar el acceso con Google.</p>;
  return <div ref={containerRef} className="flex min-h-10 w-full justify-center" />;
}
