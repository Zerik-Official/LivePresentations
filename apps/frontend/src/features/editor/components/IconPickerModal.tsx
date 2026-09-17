import { useMemo, useState } from "react";
import * as FaIcons from "react-icons/fa";

import { Modal, ModalBody, ModalHeader } from "@/components/ui/Modal"

const ALL_ICONS = Object.keys(FaIcons).filter((k) => k.startsWith("Fa")).slice(0, 400);

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;
}

/**
 * Modal to search and pick a FontAwesome icon.
 * @param open - Visibility
 * @param onClose - Close handler
 * @param onSelect - Icon name selected (e.g. FaStar)
 */
export function IconPickerModal({ open, onClose, onSelect }: Props): React.ReactNode {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().replace(/^fa/, "");
    if (!q) return ALL_ICONS.slice(0, 60);
    return ALL_ICONS.filter((n) => n.toLowerCase().includes(q)).slice(0, 60);
  }, [query]);

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-2xl max-h-[85vh]">
      <ModalHeader title="Elegir icono" subtitle="Busca por nombre (ej. star, rocket, heart)" onClose={onClose} />
      <ModalBody>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar icono..."
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400 text-zinc-900 dark:text-zinc-100"
        />
        <div className="grid max-h-[50vh] grid-cols-6 gap-2 overflow-y-auto p-1 sm:grid-cols-8">
          {filtered.map((name) => {
            const Icon = (FaIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[name];
            if (!Icon) return null;
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onSelect(name);
                  onClose();
                }}
                className="flex flex-col items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                <Icon size={20} />
                <span className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate w-full text-center">{name}</span>
              </button>
            );
          })}
          {filtered.length === 0 && <p className="col-span-full py-8 text-center text-sm text-zinc-500">Sin resultados</p>}
        </div>
      </ModalBody>
    </Modal>
  );
}
