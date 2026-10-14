import { FiAlertCircle } from "react-icons/fi";
import { Link } from "react-router-dom";

import { ThemeToggle } from "@/components/ThemeToggle";

/** Shared classes for the text inputs of the auth forms. */
export const AUTH_INPUT_CLASS =
  "w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) py-2 pl-9 pr-3 text-sm outline-none placeholder:text-(--input-placeholder) focus:border-zinc-900 dark:focus:border-zinc-300 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white cursor-text";

interface Props {
  title: string;
  subtitle: string;
  /** Error shown above the content */
  error?: string | null;
  children: React.ReactNode;
}

/**
 * Centered card layout shared by the login, register and verification pages.
 * @param title - Card heading
 * @param subtitle - Text under the heading
 * @param error - Error message
 * @param children - Card content
 * @returns Page layout
 */
export function AuthShell({ title, subtitle, error, children }: Props): React.ReactNode {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 dark:bg-zinc-950 px-4 py-10">
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-zinc-900/4 dark:bg-white/4 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-zinc-900/3 dark:bg-white/3 blur-3xl" />

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="h-12 w-auto" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>

        {error && (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            <FiAlertCircle className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {children}
      </div>

      <nav aria-label="Legal" className="absolute inset-x-0 bottom-4 flex justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <Link to="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100">
          Términos
        </Link>
        <Link to="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100">
          Privacidad
        </Link>
      </nav>
    </div>
  );
}
