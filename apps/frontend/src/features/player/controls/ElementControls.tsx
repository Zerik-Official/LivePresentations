import { FiCode, FiTarget } from "react-icons/fi";

import type { Slide, SlideElement } from "@/types/presentation";
import type { CodeOverlayState } from "../useRoom";

interface Props {
  /** Current slide */
  slide: Slide | null;
  /** Room code overlay state */
  codeOverlay: CodeOverlayState;
  /** Highlighted id */
  highlightedId: string | null;
  /** Send highlight */
  onHighlight: (id: string | null) => void;
  /** Open code control */
  onOpenCode: (id: string) => void;
}

/**
 * Modular element controls dispatcher for controller page.
 * Delegates per-type controls; currently supports code and generic highlight.
 * @param slide - Current slide
 * @param codeOverlay - Code overlay state
 * @param highlightedId - Highlighted element
 * @param onHighlight - Highlight handler
 * @param onOpenCode - Open code modal handler
 */
export function ElementControls({ slide, codeOverlay, highlightedId, onHighlight, onOpenCode }: Props): React.ReactNode {
  if (!slide) return null;

  const codeElements = slide.elements.filter((e) => e.type === "code");
  const highlightable = slide.elements.filter((e) => e.highlightable);

  return (
    <div className="space-y-4">
      {codeElements.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Bloques de código</h2>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {codeElements.map((el) => {
              const p = el.props as { code?: string; language?: string };
              const lineCount = (p.code ?? "").split("\n").length;
              const isActive = codeOverlay.elementId === el.id && codeOverlay.expanded;
              return (
                <button
                  key={el.id}
                  type="button"
                  onClick={() => onOpenCode(el.id)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-3 text-xs font-medium ${isActive ? "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}
                >
                  <span className="flex items-center gap-2">
                    <FiCode /> {(p.language ?? "code").toUpperCase()} · {lineCount} líneas
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${isActive ? "bg-amber-500 text-white" : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"}`}>{isActive ? "Expandido" : "Controlar"}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Resaltar objeto</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {highlightable.map((el: SlideElement) => (
            <button
              key={el.id}
              type="button"
              onClick={() => onHighlight(highlightedId === el.id ? null : el.id)}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-medium ${highlightedId === el.id ? "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}
            >
              <FiTarget /> {el.type} {el.id.slice(0, 4)}
            </button>
          ))}
          {highlightable.length === 0 && <p className="text-xs text-zinc-500 dark:text-zinc-400">Sin objetos resaltables.</p>}
        </div>
      </div>
    </div>
  );
}
