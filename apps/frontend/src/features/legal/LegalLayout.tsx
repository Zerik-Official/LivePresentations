import { useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useRuntimeConfig } from "@/features/auth/useRuntimeConfig";

/** Date the legal texts were last revised. */
export const LEGAL_UPDATED_AT = "14 de octubre de 2026";

/**
 * Section of a legal document.
 */
export interface LegalSection {
  title: string;
  /** Paragraphs or list items; a string starting with "• " renders as a bullet */
  body: React.ReactNode[];
}

interface Props {
  title: string;
  intro: React.ReactNode;
  sections: LegalSection[];
}

/**
 * Contact address for legal and privacy requests, from the server config.
 * @returns Mail link, or a note when no address is configured
 */
export function ContactEmail(): React.ReactNode {
  const email = useRuntimeConfig()?.contact_email;
  if (!email) return <span>la dirección de contacto publicada en este sitio</span>;
  return (
    <a href={`mailto:${email}`} className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
      {email}
    </a>
  );
}

/**
 * Readable layout for legal documents, styled like the rest of the site.
 * @param title - Document title
 * @param intro - Opening paragraph
 * @param sections - Numbered sections
 * @returns Legal page
 */
export function LegalLayout({ title, intro, sections }: Props): React.ReactNode {
  useEffect(() => {
    document.title = `${title} · LivePresentations`;
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className="min-h-screen bg-hypr-bg text-zinc-900 dark:text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-(--hypr-line) bg-hypr-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100">
            <FiArrowLeft size={14} />
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="h-6 w-auto rounded" />
            LivePresentations
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-hypr-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Última actualización: {LEGAL_UPDATED_AT}</p>
        <div className="mt-6 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{intro}</div>

        <ol className="mt-10 space-y-8">
          {sections.map((section, index) => (
            <li key={section.title}>
              <h2 className="font-hypr-display text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {index + 1}. {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                {section.body.map((paragraph, i) =>
                  typeof paragraph === "string" && paragraph.startsWith("• ") ? (
                    <p key={i} className="flex gap-2 pl-1">
                      <span aria-hidden>•</span>
                      <span>{paragraph.slice(2)}</span>
                    </p>
                  ) : (
                    <p key={i}>{paragraph}</p>
                  ),
                )}
              </div>
            </li>
          ))}
        </ol>

        <nav aria-label="Documentos legales" className="mt-14 flex flex-wrap gap-4 border-t border-(--hypr-line) pt-6 text-sm">
          <Link to="/terms" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            Términos y condiciones
          </Link>
          <Link to="/privacy" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            Política de privacidad
          </Link>
          <Link to="/" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            Inicio
          </Link>
        </nav>
      </main>
    </div>
  );
}
