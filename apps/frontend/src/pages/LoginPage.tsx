import { useCallback, useState } from "react";
import { FiArrowRight, FiLock, FiMail } from "react-icons/fi";
import { Link } from "react-router-dom";

import { GoogleAuthSection } from "@/components/GoogleAuthSection";
import { TurnstileCaptcha } from "@/components/TurnstileCaptcha";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { AUTH_INPUT_CLASS, AuthShell } from "@/features/auth/AuthShell";
import { useAuthResult } from "@/features/auth/useAuthResult";
import { useRuntimeConfig } from "@/features/auth/useRuntimeConfig";
import { authApi } from "@/lib/api";

/**
 * Login page with email and password, plus Google once the captcha is solved.
 */
export function LoginPage(): React.ReactNode {
  const applyResult = useAuthResult();
  const runtimeConfig = useRuntimeConfig();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaRound, setCaptchaRound] = useState(0);
  const captchaRequired = Boolean(runtimeConfig?.turnstile_enabled && runtimeConfig.turnstile_site_key);

  /** Ask for a new captcha: each token is accepted by the server only once. */
  const resetCaptcha = useCallback((): void => {
    setTurnstileToken(null);
    setCaptchaRound((round) => round + 1);
  }, []);

  /**
   * Handle login form submission.
   * @param e - Form event
   */
  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      applyResult(await authApi.login(email, password, turnstileToken ?? undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Iniciar sesión" subtitle="Accede para presentar o controlar" error={error}>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <label className="mt-6 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Correo electrónico
          <div className="relative mt-1">
            <FiMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={14} />
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className={AUTH_INPUT_CLASS} />
          </div>
        </label>

        <label className="mt-4 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Contraseña
          <div className="relative mt-1">
            <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={14} />
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={AUTH_INPUT_CLASS} />
          </div>
        </label>

        {captchaRequired && <TurnstileCaptcha siteKey={runtimeConfig!.turnstile_site_key!} onToken={setTurnstileToken} resetKey={captchaRound} />}

        <Button type="submit" variant="primary" size="lg" disabled={loading || (captchaRequired && !turnstileToken)} className="mt-6 w-full cursor-pointer">
          {loading ? (
            <>
              <Spinner className="size-4 text-white dark:text-zinc-900" /> Entrando...
            </>
          ) : (
            <>
              Entrar <FiArrowRight size={14} />
            </>
          )}
        </Button>
      </form>

      <GoogleAuthSection clientId={runtimeConfig?.google_client_id} text="signin_with" captchaRequired={captchaRequired} captchaToken={turnstileToken} onResult={applyResult} onError={setError} onAttempt={resetCaptcha} />

      <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="cursor-pointer font-medium text-zinc-900 dark:text-zinc-100 underline decoration-zinc-300 dark:decoration-zinc-600 underline-offset-4 hover:text-black dark:hover:text-white">
          Regístrate
        </Link>
      </p>
    </AuthShell>
  );
}
