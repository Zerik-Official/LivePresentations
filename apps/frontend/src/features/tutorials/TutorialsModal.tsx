import { useMemo, useState } from "react";
import { FiCheckCircle, FiClock, FiPlay, FiSearch } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import { Modal, ModalBody, ModalHeader } from "@/components/ui/Modal";
import { SHORTCUTS, TUTORIALS, type Tutorial } from "./tutorials";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Ids of the tutorials already completed */
  completed: string[];
  /** Start playing a tutorial */
  onStart: (tutorial: Tutorial) => void;
}

/**
 * Tutorial library: searchable list of guided tours grouped by category,
 * with completion state and a keyboard shortcut reference.
 * @param open - Visibility
 * @param onClose - Close handler
 * @param completed - Completed tutorial ids
 * @param onStart - Start handler
 * @returns Library modal
 */
export function TutorialsModal({ open, onClose, completed, onStart }: Props): React.ReactNode {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = TUTORIALS.filter((t) => !needle || `${t.title} ${t.description} ${t.category}`.toLowerCase().includes(needle));
    const byCategory = new Map<string, Tutorial[]>();
    for (const tutorial of matches) byCategory.set(tutorial.category, [...(byCategory.get(tutorial.category) ?? []), tutorial]);
    return Array.from(byCategory.entries());
  }, [query]);

  const done = TUTORIALS.filter((t) => completed.includes(t.id)).length;

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-2xl max-h-[88vh]">
      <ModalHeader title="Tutoriales" subtitle={`${done} de ${TUTORIALS.length} completados`} onClose={onClose} />
      <ModalBody>
        <div className="h-1.5 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div className="h-full rounded-full bg-zinc-900 transition-all dark:bg-white" style={{ width: `${(done / TUTORIALS.length) * 100}%` }} />
        </div>

        <div className="relative shrink-0">
          <FiSearch size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tutoriales..."
            aria-label="Buscar tutoriales"
            className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) py-2 pl-9 pr-3 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-300"
          />
        </div>

        {groups.length === 0 && <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">Ningún tutorial coincide con «{query}».</p>}

        {groups.map(([category, tutorials]) => (
          <section key={category}>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{category}</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {tutorials.map((tutorial) => {
                const isDone = completed.includes(tutorial.id);
                return (
                  <li key={tutorial.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {tutorial.title}
                        {isDone && <FiCheckCircle size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="Completado" />}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{tutorial.description}</p>
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <FiClock size={11} /> {tutorial.minutes} min · {tutorial.steps.length} pasos
                      </p>
                    </div>
                    <Button variant={isDone ? "secondary" : "primary"} size="sm" onClick={() => onStart(tutorial)} className="shrink-0">
                      <FiPlay size={12} /> {isDone ? "Repetir" : "Empezar"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {!query.trim() && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Atajos de teclado</h3>
            <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4 text-xs sm:grid-cols-2">
              {SHORTCUTS.map((shortcut) => (
                <div key={shortcut.keys} className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-600 dark:text-zinc-300">{shortcut.action}</dt>
                  <dd>
                    <kbd className="rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-200">{shortcut.keys}</kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </ModalBody>
    </Modal>
  );
}
