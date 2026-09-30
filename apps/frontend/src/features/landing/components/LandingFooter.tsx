import { FiGithub } from "react-icons/fi";

const REPO_URL = "https://github.com/Zerik-Official/LivePresentations";

export function LandingFooter(): React.ReactNode {
  return (
    <footer className="border-t border-(--hypr-line) px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="font-hypr-mono text-[11px] text-zinc-500 dark:text-zinc-500">
          LivePresentations · React + FastAPI + WebSocket
        </p>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hypr-cyan dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <FiGithub />
          Código fuente
        </a>
      </div>
    </footer>
  );
}
