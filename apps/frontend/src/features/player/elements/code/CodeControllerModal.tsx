import { useEffect, useMemo, useRef, useState } from "react";
import { FiMaximize2, FiMinimize2, FiTrash2, FiX } from "react-icons/fi";

import { CodeBlock } from "@/components/CodeBlock";
import { Button } from "@/components/ui/Button";
import { Modal, ModalBody, ModalHeader } from "@/components/ui/Modal";
import type { SlideElement } from "@/types/presentation";

interface Props {
  /** Visibility */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Target code element */
  element: SlideElement | null;
  /** Whether currently expanded on presenter */
  expanded: boolean;
  /** Highlighted lines from room state */
  highlightedLines: number[];
  /** Scroll top from room state */
  scrollTop: number;
  /** Expand handler */
  onExpand: (elementId: string) => void;
  /** Collapse handler */
  onCollapse: () => void;
  /** Highlight change handler */
  onHighlightChange: (elementId: string, lines: number[]) => void;
  /** Scroll change handler */
  onScrollChange: (elementId: string, scrollTop: number) => void;
}

/**
 * Controller modal for code element with expand, line highlight and scroll sync.
 * @param open - Visibility
 * @param element - Code element
 * @param expanded - Expanded state
 * @param highlightedLines - Highlighted lines
 * @param scrollTop - Synced scroll
 */
export function CodeControllerModal({ open, onClose, element, expanded, highlightedLines, scrollTop, onExpand, onCollapse, onHighlightChange, onScrollChange }: Props): React.ReactNode {
  const props = element?.props as { code?: string; language?: string; lineNumbers?: boolean } | undefined;
  const code = props?.code ?? "";
  const lines = useMemo(() => code.split("\n"), [code]);
  const total = lines.length;
  const [localHighlighted, setLocalHighlighted] = useState<number[]>(highlightedLines);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    setLocalHighlighted(highlightedLines);
  }, [highlightedLines]);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current?.querySelector("pre");
    if (el) el.scrollTop = scrollTop;
  }, [open, scrollTop]);

  /**
   * Sync local highlight to remote via debounce.
   * @param next - Next lines
   */
  function syncHighlight(next: number[]): void {
    setLocalHighlighted(next);
    if (!element) return;
    onHighlightChange(element.id, next);
  }

  /**
   * Toggle single line.
   * @param line - Line number 1-indexed
   */
  function toggleLine(line: number): void {
    const exists = localHighlighted.includes(line);
    const next = exists ? localHighlighted.filter((l) => l !== line) : [...localHighlighted, line].sort((a, b) => a - b);
    syncHighlight(next);
  }

  /**
   * Handle scroll sync with throttle.
   */
  function handleScroll(top: number): void {
    if (!element) return;
    const now = Date.now();
    if (now - lastSentRef.current < 80) return;
    lastSentRef.current = now;
    onScrollChange(element.id, top);
  }

  const allSelected = localHighlighted.length === total && total > 0;

  if (!element) return null;

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-3xl max-h-[92vh]">
      <ModalHeader title="Control de código" subtitle={`${props?.language ?? "code"} · ${total} líneas${expanded ? " · expandido en presentación" : ""}`} onClose={onClose} />
      <ModalBody className="gap-3">
        <div className="flex flex-wrap gap-2">
          {!expanded ? (
            <Button variant="primary" size="sm" onClick={() => onExpand(element.id)} className="cursor-pointer">
              <FiMaximize2 /> Expandir en presentación
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={onCollapse} className="cursor-pointer">
              <FiMinimize2 /> Minimizar
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => syncHighlight([])} disabled={localHighlighted.length === 0} className="cursor-pointer">
            <FiTrash2 /> Limpiar resaltado
          </Button>
          <Button variant="secondary" size="sm" onClick={() => syncHighlight(Array.from({ length: total }, (_, i) => i + 1))} disabled={allSelected} className="cursor-pointer">
            Seleccionar todo
          </Button>
          <span className="ml-auto flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            {localHighlighted.length > 0 ? `${localHighlighted.length} líneas resaltadas` : "Toca una línea para resaltar"}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 p-2">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Líneas</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
              const active = localHighlighted.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleLine(n)}
                  className={`flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-lg border px-2 text-xs font-medium tabular-nums transition-colors ${active ? "border-amber-400 bg-amber-500 text-white shadow-sm" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-[#1e1e1e]">
          <div className="h-[48vh] min-h-70">
            <CodeBlock
              code={code}
              language={props?.language}
              lineNumbers={props?.lineNumbers ?? true}
              showBadge={false}
              highlightedLines={localHighlighted}
              scrollTop={scrollTop}
              onScroll={handleScroll}
              interactive
              onToggleLine={toggleLine}
              className="h-full rounded-none border-0 text-xs"
            />
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">Tip: expande el bloque y desde el móvil desplaza el scroll; la presentación reflejará el movimiento en vivo. Selecciona varias líneas a la vez.</p>
      </ModalBody>
      <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 dark:border-zinc-700 px-6 py-3">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{expanded ? "Visible en presentación como modal centrado" : "Sin expandir"}</span>
        <button type="button" onClick={onClose} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700">
          <FiX /> Cerrar
        </button>
      </div>
    </Modal>
  );
}