import { useMemo, useState } from "react";

import { Modal, ModalBody, ModalHeader } from "../../../../components/ui/Modal";
import { FONT_OPTIONS, type FontOption } from "./constants";

interface Props {
  /** Visibility */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Selected font value */
  value: string;
  /** Selection handler */
  onSelect: (font: string) => void;
}

/**
 * Modal to pick a font family with live preview grouped by category.
 * @param open - Visibility
 * @param onClose - Close handler
 * @param value - Current font
 * @param onSelect - Select handler
 */
export function FontPickerModal({ open, onClose, value, onSelect }: Props): React.ReactNode {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return FONT_OPTIONS;
    return FONT_OPTIONS.filter((f) => f.label.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, FontOption[]>();
    for (const f of filtered) {
      const arr = map.get(f.category) ?? [];
      arr.push(f);
      map.set(f.category, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-2xl max-h-[85vh]">
      <ModalHeader title="Elegir fuente" subtitle="Vista previa en tiempo real · Google Fonts" onClose={onClose} />
      <ModalBody>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar fuente (ej. Poppins, Mono...)"
          className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
        />

        <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
          {grouped.map(([category, fonts]) => (
            <div key={category}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{category}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {fonts.map((font) => {
                  const active = font.value === value;
                  return (
                    <button
                      key={font.value}
                      type="button"
                      onClick={() => {
                        onSelect(font.value);
                        onClose();
                      }}
                      style={{ fontFamily: `"${font.value}", sans-serif` }}
                      className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-colors ${active ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}
                    >
                      <span className="text-sm font-semibold leading-none">{font.label}</span>
                      <span className={`text-xs leading-tight ${active ? "text-white/80 dark:text-zinc-700" : "text-zinc-500 dark:text-zinc-400"}`} style={{ fontFamily: `"${font.value}", sans-serif` }}>
                        Agita la presentación
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">Sin resultados</p>}
        </div>
      </ModalBody>
    </Modal>
  );
}