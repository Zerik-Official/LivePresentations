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

const MIN_PASSWORD_LENGTH = 8;

/**
 * Registration page with email, password and password confirmation.
 * The account is usable only after confirming the emailed code.
 */
export function RegisterPage(): React.ReactNode {
  const applyResult = useAuthResult();
  const runtimeConfig = useRuntimeConfig();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaRound, setCaptchaRound] = useState(0);
  const captchaRequired = Boolean(runtimeConfig?.turnstile_enabled && runtimeConfig.turnstile_site_key);
  const mismatch = confirmation.length > 0 && confirmation !== password;

  /** Ask for a new captcha: each token is accepted by the server only once. */
  const resetCaptcha = useCallback((): void => {
    setTurnstileToken(null);
    setCaptchaRound((round) => round + 1);
  }, []);

  /**
   * Handle registration form submission.
   * @param e - Form event
   */
  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
      return;
    }
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      applyResult(await authApi.register(email, password, turnstileToken ?? undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Crea tu cuenta" subtitle="Te enviaremos un código para verificar tu correo" error={error}>
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
            <input type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`} className={AUTH_INPUT_CLASS} />
          </div>
        </label>

        <label className="mt-4 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Confirmar contraseña
          <div className="relative mt-1">
            <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={14} />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="Repite la contraseña"
              aria-invalid={mismatch}
              className={`${AUTH_INPUT_CLASS} ${mismatch ? "border-red-400 dark:border-red-500" : ""}`}
            />
          </div>
          {mismatch && <span className="mt-1 block text-xs font-normal text-red-600 dark:text-red-400">Las contraseñas no coinciden</span>}
        </label>

        {captchaRequired && <TurnstileCaptcha siteKey={runtimeConfig!.turnstile_site_key!} onToken={setTurnstileToken} resetKey={captchaRound} />}

        <Button type="submit" variant="primary" size="lg" disabled={loading || mismatch || (captchaRequired && !turnstileToken)} className="mt-6 w-full cursor-pointer">
          {loading ? (
            <>
              <Spinner className="size-4 text-white dark:text-zinc-900" /> Creando cuenta...
            </>
          ) : (
            <>
              Crear cuenta <FiArrowRight size={14} />
            </>
          )}
        </Button>
      </form>

      <GoogleAuthSection clientId={runtimeConfig?.google_client_id} text="signup_with" captchaRequired={captchaRequired} captchaToken={turnstileToken} onResult={applyResult} onError={setError} onAttempt={resetCaptcha} />

      <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="cursor-pointer font-medium text-zinc-900 dark:text-zinc-100 underline decoration-zinc-300 dark:decoration-zinc-600 underline-offset-4 hover:text-black dark:hover:text-white">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
