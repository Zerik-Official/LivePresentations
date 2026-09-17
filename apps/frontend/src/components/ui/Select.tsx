import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiChevronDown } from "react-icons/fi";

/**
 * Option for the custom select.
 */
export interface SelectOption {
  /** Value sent to parent on select. */
  value: string;
  /** Label shown in trigger and menu. */
  label: string;
  /** Optional thumbnail. */
  thumb?: string | ReactNode;
}

interface SelectProps {
  /** Current value. */
  value: string;
  /** Options list. */
  options: SelectOption[];
  /** Change handler. */
  onChange: (value: string) => void;
  /** Placeholder when no value. */
  placeholder?: string;
}

/**
 * Custom select with portal menu to avoid clipping inside modals.
 * Adapts to dark theme and cuts overflow issues.
 * @param value - Selected value
 * @param options - Options
 * @param onChange - Callback
 * @param placeholder - Placeholder text
 */
export function Select({ value, options, onChange, placeholder = "Seleccionar" }: SelectProps): React.ReactNode {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    /**
     * Close on outside click.
     * @param event - Mouse event
     */
    function handleClickOutside(event: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        const menu = document.getElementById("select-portal");
        if (menu && menu.contains(event.target as Node)) return;
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });

    /**
     * Update position on scroll/resize.
     */
    function update(): void {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left, width: r.width });
    }
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-xs hover:border-zinc-400 dark:hover:border-zinc-500"
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {selected?.thumb ? <span className="flex h-4 w-6 shrink-0 overflow-hidden rounded">{selected.thumb}</span> : null}
          <span className="truncate">{selected?.label ?? placeholder}</span>
        </span>
        <FiChevronDown className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} size={12} />
      </button>

      {open && pos
        ? createPortal(
            <div
              id="select-portal"
              style={{ top: pos.top, left: pos.left, width: pos.width }}
              className="fixed z-9999 flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 shadow-xl"
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs ${opt.value === value ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
                >
                  {opt.thumb ? <span className="flex h-4 w-6 shrink-0 overflow-hidden rounded">{opt.thumb}</span> : null}
                  <span className="flex-1 truncate">{opt.label}</span>
                  {opt.value === value ? <FiCheck className="shrink-0 text-zinc-900 dark:text-zinc-100" size={12} /> : null}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
