import { highlight, langLabel } from "@/lib/prism";

interface Props {
  code?: string;
  language?: string;
  className?: string;
  showBadge?: boolean;
  lineNumbers?: boolean;
  startLine?: number;
}

/**
 * Syntax highlighted code block shared by the editor and the player.
 * @param code - Source code to display
 * @param language - Requested language name
 * @param className - Extra classes applied to the pre element
 * @param showBadge - Whether to show the language badge
 * @param lineNumbers - Whether to render the line number gutter
 * @param startLine - First line number of the gutter
 */
export function CodeBlock({
  code,
  language,
  className = "",
  showBadge = true,
  lineNumbers = false,
  startLine = 1,
}: Props): React.ReactNode {
  const source = code ?? "";
  const { html, lang } = highlight(source, language);
  const total = source.split("\n").length;
  const gutter = Array.from({ length: total }, (_, i) => startLine + i).join("\n");

  return (
    <pre className={`relative h-full w-full overflow-auto whitespace-pre-wrap wrap-break-word rounded-md bg-[#2d2d2d] p-3 leading-relaxed ${className}`}>
      <div className="flex min-w-max">
        {lineNumbers && (
          <span aria-hidden className="mr-3 shrink-0 select-none whitespace-pre border-r border-zinc-600/60 pr-3 text-right text-zinc-500">
            {gutter}
          </span>
        )}
        <code className={`language-${lang} min-w-0 flex-1 whitespace-pre-wrap wrap-break-word`} style={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      {showBadge && (
        <span className="absolute right-1 top-1 rounded bg-zinc-700 px-1 text-[9px] uppercase text-zinc-200">{langLabel(lang)}</span>
      )}
    </pre>
  );
}
