import { useEffect, useRef } from "react";

import { highlight, langLabel } from "@/lib/prism";

interface Props {
  code?: string;
  language?: string;
  className?: string;
  showBadge?: boolean;
  lineNumbers?: boolean;
  startLine?: number;
  highlightedLines?: number[];
  scrollTop?: number;
  onScroll?: (scrollTop: number) => void;
  interactive?: boolean;
  onToggleLine?: (line: number) => void;
}

/**
 * Syntax highlighted code block shared by the editor and the player.
 * Supports per-line highlight and scroll synchronization.
 * @param code - Source code to display
 * @param language - Requested language name
 * @param className - Extra classes applied to the pre element
 * @param showBadge - Whether to show the language badge
 * @param lineNumbers - Whether to render the line number gutter
 * @param startLine - First line number of the gutter
 * @param highlightedLines - Lines to highlight (1-indexed)
 * @param scrollTop - Controlled scrollTop for sync
 * @param onScroll - Scroll handler
 * @param interactive - Whether lines are clickable
 * @param onToggleLine - Toggle line handler
 */
export function CodeBlock({
  code,
  language,
  className = "",
  showBadge = true,
  lineNumbers = false,
  startLine = 1,
  highlightedLines,
  scrollTop,
  onScroll,
  interactive = false,
  onToggleLine,
}: Props): React.ReactNode {
  const source = code ?? "";
  const { html, lang } = highlight(source, language);
  const highlightSet = new Set(highlightedLines ?? []);
  const htmlLines = html.split("\n");
  const sourceLines = source.split("\n");
  const total = sourceLines.length;
  const containerRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (scrollTop === undefined || containerRef.current === null) return;
    if (Math.abs(containerRef.current.scrollTop - scrollTop) > 2) {
      containerRef.current.scrollTop = scrollTop;
    }
  }, [scrollTop]);

  /**
   * Handle scroll event.
   * @param e - Scroll event
   */
  function handleScroll(e: React.UIEvent<HTMLPreElement>): void {
    onScroll?.(e.currentTarget.scrollTop);
  }

  return (
    <pre ref={containerRef} onScroll={onScroll ? handleScroll : undefined} className={`relative flex h-full w-full flex-col overflow-auto rounded-md bg-[#2d2d2d] p-0 leading-relaxed ${className}`}>
      {showBadge && (
        <span className="pointer-events-none absolute right-2 top-2 z-10 rounded bg-zinc-700 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-zinc-200">{langLabel(lang)}</span>
      )}
      <div className="flex min-h-0 flex-1 flex-col">
        {Array.from({ length: total }, (_, idx) => {
          const lineNo = startLine + idx;
          const isHighlighted = highlightSet.has(lineNo);
          const lineHtml = htmlLines[idx] ?? "";
          return (
            <div
              key={lineNo}
              onClick={interactive && onToggleLine ? () => onToggleLine(lineNo) : undefined}
              className={`flex min-w-max items-start gap-0 px-3 py-px first:pt-3 last:pb-3 ${isHighlighted ? "bg-amber-500/20 border-l-2 border-amber-400" : "border-l-2 border-transparent"} ${interactive ? "cursor-pointer hover:bg-white/6" : ""}`}
            >
              {lineNumbers && (
                <span className={`mr-3 shrink-0 select-none border-r border-zinc-600/60 pr-3 text-right text-xs tabular-nums ${isHighlighted ? "text-amber-300" : "text-zinc-500"}`} style={{ minWidth: `${String(startLine + total).length + 1}ch` }}>
                  {lineNo}
                </span>
              )}
              <code
                className={`language-${lang} min-w-0 flex-1 whitespace-pre-wrap wrap-break-word text-sm`}
                style={{ whiteSpace: "pre-wrap" }}
                dangerouslySetInnerHTML={{ __html: lineHtml || " " }}
              />
            </div>
          );
        })}
      </div>
    </pre>
  );
}
