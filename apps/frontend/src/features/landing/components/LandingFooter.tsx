import { FiGithub } from "react-icons/fi";

const REPO_URL = "https://github.com/Zerik-Official/LivePresentations";

export function LandingFooter(): React.ReactNode {
  return (
    <footer className="border-t border-(--hypr-line) px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-center">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:focus-visible:ring-white"
        >
          <FiGithub />
          Código fuente
        </a>
      </div>
    </footer>
  );
}
