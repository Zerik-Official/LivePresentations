import { useEffect, useState } from "react";
import { FiAlertCircle, FiArrowRight, FiLock, FiMail } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

import { authApi, configApi } from "@/lib/api";
import { TURNSTILE_PUBLIC_KEY } from "@/lib/api/client";
import type { RuntimeConfig } from "@/types/backend";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TurnstileCaptcha } from "@/components/TurnstileCaptcha";
import { useAuthStore } from "@/stores/authStore";

/**
 * Login page with email and password.
 */
export function LoginPage(): React.ReactNode {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  useEffect(() => {
    void configApi
      .fetchRuntimeConfig()
      .then(setRuntimeConfig)
      .catch(() => setRuntimeConfig({ turnstile_enabled: Boolean(TURNSTILE_PUBLIC_KEY), turnstile_site_key: TURNSTILE_PUBLIC_KEY ?? null, upload_quota_bytes: 20 * 1024 * 1024 }));
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
      const data = await authApi.login(email, password, turnstileToken ?? undefined);
      setAuth(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 dark:bg-zinc-950 px-4 py-10">
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-zinc-900/4 dark:bg-white/4 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-zinc-900/3 dark:bg-white/3 blur-3xl" />

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <form onSubmit={handleSubmit} className="relative w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center">
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Accede para presentar o controlar</p>
        </div>



        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            <FiAlertCircle className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <label className="mt-6 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Correo electrónico
          <div className="relative mt-1">
            <FiMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={14} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) py-2 pl-9 pr-3 text-sm outline-none placeholder:text-(--input-placeholder) focus:border-zinc-900 dark:focus:border-zinc-300 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white cursor-text"
            />
          </div>
        </label>

        <label className="mt-4 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Contraseña
          <div className="relative mt-1">
            <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={14} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) py-2 pl-9 pr-3 text-sm outline-none placeholder:text-(--input-placeholder) focus:border-zinc-900 dark:focus:border-zinc-300 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white cursor-text"
            />
          </div>
        </label>

        {runtimeConfig?.turnstile_enabled && runtimeConfig.turnstile_site_key && (
          <div className="mt-4">
            <TurnstileCaptcha siteKey={runtimeConfig.turnstile_site_key} onToken={setTurnstileToken} />
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" disabled={loading} className="mt-6 w-full cursor-pointer">
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

        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="cursor-pointer font-medium text-zinc-900 dark:text-zinc-100 underline decoration-zinc-300 dark:decoration-zinc-600 underline-offset-4 hover:text-black dark:hover:text-white">
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
}