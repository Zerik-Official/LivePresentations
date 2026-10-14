import { FiArrowUpRight } from "react-icons/fi";
import { Link } from "react-router-dom";

import { ThemeToggle } from "@/components/ThemeToggle";
import { LANDING_SECTIONS, LANDING_SECTION_IDS } from "../constants";
import { useActiveSection } from "../hooks/useActiveSection";
import { usePrimaryCta } from "../hooks/usePrimaryCta";

/**
 * Floating navigation bar of the landing page.
 * @returns Navigation header
 */
export function LandingNav(): React.ReactNode {
  const active = useActiveSection(LANDING_SECTION_IDS);
  const cta = usePrimaryCta();

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <nav aria-label="Principal" className="hypr-window mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl px-3 py-2 sm:px-4">
        <a href="#inicio" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-white">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="h-7 w-auto rounded-md" />
          <span className="hidden font-hypr-display text-sm font-semibold tracking-tight text-zinc-900 sm:inline dark:text-zinc-100">LivePresentations</span>
        </a>

        <ol className="hidden items-center gap-1 rounded-xl bg-zinc-900/4 p-1 md:flex dark:bg-white/4">
          {LANDING_SECTIONS.map((section) => {
            const isActive = active === section.id;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`flex h-7 items-center rounded-lg px-2.5 text-xs font-medium transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-white ${
                    isActive ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900" : "text-zinc-500 hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/6 dark:hover:text-zinc-100"
                  }`}
                >
                  {section.label}
                </a>
              </li>
            );
          })}
        </ol>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!cta.isAuthenticated && (
            <Link to="/login" className="hidden h-9 items-center rounded-lg px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-900/5 sm:inline-flex dark:text-zinc-200 dark:hover:bg-white/6">
              Entrar
            </Link>
          )}
          <Link to={cta.to} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100">
            {cta.isAuthenticated ? "Mis presentaciones" : "Empezar"}
            <FiArrowUpRight size={14} />
          </Link>
        </div>
      </nav>
    </header>
  );
}
