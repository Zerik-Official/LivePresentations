import { useDraggable } from "@dnd-kit/core";

import { AnimatedFrame } from "@/components/AnimatedFrame";
import { useAnimationPreview } from "@/stores/animationPreviewStore";
import type { SlideElement } from "@/types/presentation";
import { elementRegistry } from "./elements/registry";

const MIN_SIZE = 16;

interface Props {
  element: SlideElement;
  selected: boolean;
  onSelect: (id: string) => void;
  onResize: (id: string, w: number, h: number) => void;
  dragDelta?: { x: number; y: number } | null;
  isDescendantOfDragging?: boolean;
  /** Canvas zoom, to convert pointer pixels to slide pixels */
  scale?: number;
  /** Marks the element as created or modified by an assistant edit awaiting review */
  review?: "added" | "updated";
}

const REVIEW_CLASSES: Record<NonNullable<Props["review"]>, string> = {
  added: "outline-2 outline-dashed outline-offset-2 outline-emerald-500 animate-[popIn_0.3s_ease_both]",
  updated: "outline-2 outline-dashed outline-offset-2 outline-amber-500",
};

/**
 * Draggable wrapper for a slide element in the editor with resize handles.
 * @param element - Slide element
 * @param selected - Whether selected
 * @param onSelect - Selection handler
 * @param onResize - Resize handler
 * @param dragDelta - Drag offset of the dragged ancestor, in slide pixels
 * @param isDescendantOfDragging - Whether an ancestor is being dragged
 * @param scale - Canvas zoom
 * @param review - Pending assistant edit affecting the element
 */
export function DraggableElement({ element, selected, onSelect, onResize, dragDelta, isDescendantOfDragging, scale = 1, review }: Props): React.ReactNode {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: element.id });
  const rawListeners = listeners as Record<string, unknown> | undefined;

  // While this element is dragged, the editor's offset wins over the raw pointer
  // offset: it is already in slide pixels and adjusted by the smart guides.
  const dragged = transform ? (dragDelta ?? { x: transform.x / scale, y: transform.y / scale }) : null;
  const activeTranslate = dragged ? `translate3d(${dragged.x}px, ${dragged.y}px, 0)` : null;
  const descendantTranslate = isDescendantOfDragging && dragDelta ? `translate3d(${dragDelta.x}px, ${dragDelta.y}px, 0)` : "";
  const translate = activeTranslate ?? descendantTranslate;
  const rotate = element.rotation ? ` rotate(${element.rotation}deg)` : "";
  const combinedTransform = `${translate ?? ""}${rotate}`.trim() || undefined;

  const style: React.CSSProperties = {
    left: element.x,
    top: element.y,
    width: element.w,
    height: element.h,
    transform: combinedTransform,
    transformOrigin: "center",
    zIndex: element.zIndex,
    opacity: isDragging || isDescendantOfDragging ? 0.85 : 1,
  };

  /**
   * Begin resize interaction.
   * @param e - Pointer event
   * @param dir - Resize direction
   */
  function startResize(e: React.PointerEvent, dir: "se" | "sw" | "ne" | "nw" | "e" | "s"): void {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = element.w;
    const startH = element.h;

    /**
     * Handle pointer move.
     * @param ev - Pointer event
     */
    function onMove(ev: PointerEvent): void {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      let w = startW;
      let h = startH;
      if (dir.includes("e")) w = Math.max(MIN_SIZE, startW + dx);
      if (dir.includes("s")) h = Math.max(MIN_SIZE, startH + dy);
      if (dir === "e") h = startH;
      if (dir === "s") w = startW;
      if (dir === "se") {
        w = Math.max(MIN_SIZE, startW + dx);
        h = Math.max(MIN_SIZE, startH + dy);
      }
      onResize(element.id, Math.round(w), Math.round(h));
    }

    /**
     * Handle pointer up.
     */
    function onUp(): void {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const previewRun = useAnimationPreview((s) => (s.run?.targets.includes(element.id) ? s.run : null));
  const previewAnimation = previewRun?.animation ?? null;
  const definition = elementRegistry.tryGet(element.type);
  const content = definition ? definition.renderEditor(element) : null;
  const isTransparentVisual = definition?.isTransparent?.(element) ?? element.type === "image";

  /**
   * Handle pointer down to select element and forward to dnd-kit.
   * @param e - Pointer event
   */
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>): void {
    onSelect(element.id);
    const l = rawListeners?.onPointerDown as ((ev: unknown) => void) | undefined;
    if (l) l(e);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`absolute select-none rounded-md border ${isTransparentVisual ? "bg-transparent" : "bg-white"} ${selected ? "border-zinc-900 ring-2 ring-zinc-900" : isTransparentVisual ? "border-transparent" : "border-zinc-200"} ${isDragging || isDescendantOfDragging ? "shadow-lg" : ""} ${review ? REVIEW_CLASSES[review] : ""}`}
      onPointerDown={handlePointerDown}
      onClick={() => onSelect(element.id)}
      {...attributes}
      {...(rawListeners ? Object.fromEntries(Object.entries(rawListeners).filter(([k]) => k !== "onPointerDown")) : {})}
    >
      {previewAnimation ? (
        <AnimatedFrame animation={previewAnimation} runKey={`${previewRun!.nonce}`}>
          {content}
        </AnimatedFrame>
      ) : (
        content
      )}
      {selected && (
        <>
          <span onPointerDown={(e) => startResize(e, "se")} className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-sm border border-white bg-zinc-900" />
          <span onPointerDown={(e) => startResize(e, "e")} className="absolute -right-1 top-1/2 h-4 w-1.5 -translate-y-1/2 cursor-e-resize rounded bg-zinc-900" />
          <span onPointerDown={(e) => startResize(e, "s")} className="absolute -bottom-1 left-1/2 h-1.5 w-4 -translate-x-1/2 cursor-s-resize rounded bg-zinc-900" />
        </>
      )}
    </div>
  );
}
