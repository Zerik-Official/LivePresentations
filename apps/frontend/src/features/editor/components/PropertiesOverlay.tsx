import { useRef, useState } from "react";
import { FiMaximize2, FiMinimize2, FiMove } from "react-icons/fi";

import { TooltipSimple } from "@/components/ui/Tooltip";
import type { PresentationData, Slide, SlideElement } from "@/types/presentation";

import { PropertiesPanel } from "./PropertiesPanel";

interface Props {
  selected: SlideElement | null;
  onPatch: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
  onPatchId?: (newId: string) => boolean;
  onReplace?: (next: SlideElement) => boolean;
  onReplaceSubtree?: (next: { element: SlideElement; children: SlideElement[] }) => boolean;
  onDelete: () => void;
  data?: PresentationData | null;
  slide?: Slide | null;
}

/**
 * Movable and minimizable overlay for element properties.
 * @param selected - Selected element
 * @param onPatch - Patch handler
 * @param onDelete - Delete handler
 */
export function PropertiesOverlay({ selected, onPatch, onPatchId, onReplace, onReplaceSubtree, onDelete, data, slide }: Props): React.ReactNode {
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);

  /**
   * Start dragging overlay.
   * @param e - Pointer event
   */
  function onPointerDown(e: React.PointerEvent): void {
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    dragRef.current = { x: pos.x, y: pos.y, startX: e.clientX, startY: e.clientY };

    /**
     * Handle pointer move.
     * @param ev - Pointer event
     */
    function onMove(ev: PointerEvent): void {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      setPos({ x: dragRef.current.x + dx, y: dragRef.current.y + dy });
    }

    /**
     * Handle pointer up.
     */
    function onUp(): void {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      className={`fixed right-6 top-24 z-40 w-80 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl ${minimized ? "overflow-hidden" : ""}`}
    >
      <div
        onPointerDown={onPointerDown}
        className={`flex items-center justify-between px-3 py-2 ${minimized ? "rounded-xl bg-zinc-50 dark:bg-zinc-800" : "cursor-move rounded-t-xl border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"}`}
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <FiMove className="opacity-60" /> Propiedades
        </span>
        <TooltipSimple content={minimized ? "Desplegar propiedades" : "Colapsar propiedades"} side="left">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setMinimized((v) => !v)}
            className="cursor-pointer rounded-md border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 p-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-600"
          >
            {minimized ? <FiMaximize2 size={12} /> : <FiMinimize2 size={12} />}
          </button>
        </TooltipSimple>
      </div>
      {!minimized && (
        <div className="max-h-[60vh] overflow-y-auto p-4">
          <PropertiesPanel selected={selected} onPatch={onPatch} onPatchId={onPatchId} onReplace={onReplace} onReplaceSubtree={onReplaceSubtree} onDelete={onDelete} data={data} slide={slide} />
        </div>
      )}
    </div>
  );
}
