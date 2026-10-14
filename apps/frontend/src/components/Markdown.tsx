import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const COMPONENTS: Components = {
  p: ({ children }) => <p className="leading-relaxed [&:not(:first-child)]:mt-2">{children}</p>,
  h1: ({ children }) => <h3 className="mt-3 text-base font-semibold first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-3 text-[15px] font-semibold first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-3 text-sm font-semibold first:mt-0">{children}</h4>,
  h4: ({ children }) => <h4 className="mt-2 text-sm font-semibold first:mt-0">{children}</h4>,
  ul: ({ children }) => <ul className="mt-2 list-disc space-y-1 pl-5 first:mt-0">{children}</ul>,
  ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5 first:mt-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-zinc-900 dark:text-white">{children}</strong>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900 dark:hover:text-white">
      {children}
    </a>
  ),
  blockquote: ({ children }) => <blockquote className="mt-2 border-l-2 border-zinc-300 dark:border-zinc-600 pl-3 text-zinc-600 dark:text-zinc-300">{children}</blockquote>,
  hr: () => <hr className="my-3 border-zinc-200 dark:border-zinc-700" />,
  pre: ({ children }) => <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 text-xs leading-relaxed first:mt-0 [&>code]:bg-transparent [&>code]:p-0">{children}</pre>,
  code: ({ children }) => <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 font-mono text-[0.85em]">{children}</code>,
  table: ({ children }) => (
    <div className="mt-2 overflow-x-auto first:mt-0">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-zinc-200 dark:border-zinc-700 px-2 py-1 align-top">{children}</td>,
};

interface Props {
  /** Markdown source */
  children: string;
  /** Extra classes for the wrapper */
  className?: string;
}

/**
 * Render Markdown (with tables, lists and strikethrough) in the app's style.
 * Raw HTML in the source is shown as text and images are dropped, so model
 * output can neither inject markup nor make the browser fetch remote files.
 * @param children - Markdown source
 * @param className - Extra classes
 * @returns Rendered content
 */
export function Markdown({ children, className = "" }: Props): React.ReactNode {
  return (
    <div className={`break-words text-sm text-zinc-800 dark:text-zinc-100 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS} disallowedElements={["img"]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
