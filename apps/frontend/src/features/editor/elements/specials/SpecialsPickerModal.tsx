import { useMemo, useState } from "react";
import { FiSearch, FiStar } from "react-icons/fi";

import { Modal, ModalBody, ModalHeader } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface SpecialItem {
  /** Identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Icon */
  icon: string;
}

const SPECIALS: SpecialItem[] = [
  { id: "specials-answers", name: "specials-answers", description: "Bloque de respuestas interactivas", icon: "FaStar" },
];

interface Props {
  /** Visibility */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Select handler */
  onSelect: (id: string) => void;
}

/**
 * Wide modal to search and add special elements to the slide.
 * @param open - Visibility
 * @param onClose - Close handler
 * @param onSelect - Select handler
 */
export function SpecialsPickerModal({ open, onClose, onSelect }: Props): React.ReactNode {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return SPECIALS;
    return SPECIALS.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }, [query]);

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-3xl max-h-[85vh]">
      <ModalHeader title="Elementos especiales" subtitle="Busca y añade a la diapositiva" onClose={onClose} />
      <ModalBody>
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar elemento (ej. answers...)"
            className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) pl-9 pr-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 max-h-[55vh] overflow-y-auto pr-1">
          {filtered.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300">
                  <FiStar size={16} />
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.description}</span>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onSelect(item.id);
                  onClose();
                }}
                className="cursor-pointer"
              >
                Añadir
              </Button>
            </div>
          ))}
          {filtered.length === 0 && <p className="col-span-2 py-8 text-center text-sm text-zinc-500">Sin resultados</p>}
        </div>
      </ModalBody>
    </Modal>
  );
}