import { useEffect, useRef, useState } from "react";
import { FiCopy, FiTrash2 } from "react-icons/fi";
import { HiOutlineBars3 } from "react-icons/hi2";

import { Button } from "@/components/ui/Button";
import { TooltipSimple } from "@/components/ui/Tooltip";
import type { Slide } from "@/types/presentation";
import { SlidePreview } from "./SlidePreview";

interface Props {
  /** Slide data */
  slide: Slide;
  /** Index in presentation */
  index: number;
  /** Whether this card is active */
  active: boolean;
  /** Total slides count for a11y */
  onSelect: () => void;
  /** Duplicate handler */
  onDuplicate: () => void;
  /** Delete handler */
  onDelete: () => void;
  /** Optional drag handle props from sortable */
  dragListeners?: Record<string, unknown>;
  /** Optional drag attributes */
  dragAttributes?: Record<string, unknown>;
}

/**
 * Reusable slide thumbnail card with preview and diagonal menu.
 * @param slide - Slide
 * @param index - Position
 * @param active - Selected state
 * @param onSelect - Select handler
 * @param onDuplicate - Duplicate handler
 * @param onDelete - Delete handler
 * @param dragListeners - DnD listeners for sortable
 * @param dragAttributes - DnD attributes
 */
export function SlideCard({ slide, index, active, onSelect, onDuplicate, onDelete, dragListeners, dragAttributes }: Props): React.ReactNode {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    /**
     * Close on outside click or escape.
     * @param e - Mouse event
     */
    function handleClick(e: MouseEvent): void {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    function handleKey(e: KeyboardEvent): void {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  return (
    <div
      className={`group relative rounded-xl border-2 bg-white dark:bg-zinc-900 p-2 transition-all ${active ? "border-zinc-900 dark:border-white shadow-md" : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"}`}
    >
      <button type="button" onClick={onSelect} className="block w-full cursor-pointer text-left">
        <div className="pointer-events-none">
          <SlidePreview slide={slide} />
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
          <span className={`text-xs font-medium ${active ? "text-zinc-900 dark:text-white" : "text-zinc-700 dark:text-zinc-300"}`}>Diapositiva {index + 1}</span>
          <TooltipSimple content={slide.elements.length === 1 ? "1 capa" : `${slide.elements.length} capas`} side="top">
            <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] leading-none text-zinc-500 dark:text-zinc-400">{slide.elements.length}</span>
          </TooltipSimple>
        </div>
      </button>

      <TooltipSimple content="Ver opciones" side="right">
        <button
          ref={btnRef}
          type="button"
          aria-label="Ver opciones"
          onClick={() => setMenuOpen((v) => !v)}
          className="absolute left-2 top-2 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-600 bg-white/90 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-300 shadow-sm backdrop-blur hover:bg-white dark:hover:bg-zinc-700"
        >
          <HiOutlineBars3 size={12} />
        </button>
      </TooltipSimple>

      <div
        aria-hidden={!menuOpen}
        className={`absolute left-2 top-9 z-20 w-36 origin-top-left rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1 shadow-xl transition-all ${menuOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"}`}
        ref={menuRef}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onDuplicate();
            setMenuOpen(false);
          }}
          className="w-full justify-start cursor-pointer"
        >
          <FiCopy size={12} /> Duplicar
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            onDelete();
            setMenuOpen(false);
          }}
          className="w-full justify-start cursor-pointer border-0"
        >
          <FiTrash2 size={12} /> Eliminar
        </Button>
        {dragListeners ? (
          <div className="mt-1 border-t border-zinc-100 dark:border-zinc-700 pt-1">
            <span
              {...dragAttributes}
              {...dragListeners}
              className="flex w-full cursor-grab items-center justify-center rounded-md px-2 py-1.5 text-[10px] font-medium tracking-widest text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:cursor-grabbing"
            >
              ≡ arrastrar para reordenar
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}