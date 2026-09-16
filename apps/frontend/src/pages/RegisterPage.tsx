import { useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

import { register } from "../lib/api";
import { useAuthStore } from "../stores/authStore";

/**
 * Registration page with email and password.
 */
export function RegisterPage(): React.ReactNode {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Handle registration form submission.
   * @param e - Form event
   */
  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await register(email, password);
      setAuth(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 shadow-sm"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Crear cuenta</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Solo necesitas correo y contraseña</p>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <FiAlertCircle className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <label className="mt-6 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Correo electrónico
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="mt-1 w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-300 focus:ring-1 focus:ring-zinc-900"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Contraseña
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="mt-1 w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-300 focus:ring-1 focus:ring-zinc-900"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-zinc-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-medium text-zinc-900 dark:text-white underline decoration-zinc-300 dark:decoration-zinc-600 hover:text-black dark:hover:text-zinc-200">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
