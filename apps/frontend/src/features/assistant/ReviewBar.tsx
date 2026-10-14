import { useState } from "react";
import { FiCheck, FiChevronDown, FiX } from "react-icons/fi";
import { LuSparkles } from "react-icons/lu";

import { TooltipSimple } from "@/components/ui/Tooltip";
import type { AiChange } from "./changes";
import type { PendingChanges } from "./usePendingChanges";

interface Props {
  /** Review list and its actions */
  review: PendingChanges;
  /** Whether the assistant is still editing; bulk actions wait until it finishes */
  busy: boolean;
  /** Bring the target of a change into view */
  onFocus: (change: AiChange) => void;
}

/**
 * Review bar for the assistant's edits, shown over the canvas while any is
 * pending. Each edit can be kept or discarded on its own, or all at once.
 * @param review - Review list and actions
 * @param busy - Whether the assistant is still working
 * @param onFocus - Focus handler
 * @returns Review bar, or null when there is nothing to review
 */
export function ReviewBar({ review, busy, onFocus }: Props): React.ReactNode {
  const [expanded, setExpanded] = useState(false);
  const { changes } = review;
  if (changes.length === 0) return null;

  const action = "inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const iconAction = "flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <section aria-label="Cambios del asistente por revisar" className="pointer-events-auto w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl animate-[popIn_0.2s_ease_both]">
        {expanded && (
          <ul className="max-h-56 overflow-y-auto border-b border-zinc-200 dark:border-zinc-700 p-1.5">
            {changes.map((change) => (
              <li key={change.id} className="flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                <button type="button" onClick={() => onFocus(change)} className="min-w-0 flex-1 cursor-pointer truncate text-left text-xs text-zinc-700 dark:text-zinc-200" title={change.label}>
                  {change.label}
                </button>
                <TooltipSimple content="Aceptar este cambio" side="top">
                  <button type="button" aria-label={`Aceptar: ${change.label}`} onClick={() => review.accept(change.id)} className={`${iconAction} text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-950`}>
                    <FiCheck size={13} />
                  </button>
                </TooltipSimple>
                <TooltipSimple content="Descartar este cambio" side="top">
                  <button type="button" aria-label={`Descartar: ${change.label}`} onClick={() => review.reject(change.id)} className={`${iconAction} text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950`}>
                    <FiX size={13} />
                  </button>
                </TooltipSimple>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-2 px-2.5 py-2">
          <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left">
            <LuSparkles size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-100">
              {changes.length} {changes.length === 1 ? "cambio del asistente por revisar" : "cambios del asistente por revisar"}
            </span>
            <FiChevronDown size={13} className={`shrink-0 text-zinc-500 transition-transform ${expanded ? "" : "rotate-180"}`} />
          </button>
          <button type="button" disabled={busy} onClick={review.rejectAll} className={`${action} text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800`}>
            Descartar todo
          </button>
          <button type="button" disabled={busy} onClick={review.acceptAll} className={`${action} bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100`}>
            <FiCheck size={12} /> Aceptar todo
          </button>
        </div>
      </section>
    </div>
  );
}
