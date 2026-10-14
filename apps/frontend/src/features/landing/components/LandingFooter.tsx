import { FiGithub } from "react-icons/fi";
import { Link } from "react-router-dom";

import { useRuntimeConfig } from "@/features/auth/useRuntimeConfig";

const PROFILE_URL = "https://github.com/Zerik-Official";
const LINK_CLASS = "rounded px-1 text-sm text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:focus-visible:ring-white";

/**
 * Site footer with legal pages, contact and credits.
 * @returns Footer
 */
export function LandingFooter(): React.ReactNode {
  const contactEmail = useRuntimeConfig()?.contact_email;

  return (
    <footer className="border-t border-(--hypr-line) px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">© {new Date().getFullYear()} LivePresentations</p>
        <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link to="/terms" className={LINK_CLASS}>
            Términos
          </Link>
          <Link to="/privacy" className={LINK_CLASS}>
            Privacidad
          </Link>
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} className={LINK_CLASS}>
              Contacto
            </a>
          )}
          <a href={PROFILE_URL} target="_blank" rel="noreferrer" className={`${LINK_CLASS} inline-flex items-center gap-1.5`}>
            <FiGithub /> Creado por Zerik
          </a>
        </nav>
      </div>
    </footer>
  );
}
