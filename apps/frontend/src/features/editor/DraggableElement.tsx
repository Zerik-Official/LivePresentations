import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import * as FaIcons from "react-icons/fa";

import { CodeBlock } from "@/components/CodeBlock";
import type { SlideElement } from "@/types/presentation";

interface Props {
  element: SlideElement;
  selected: boolean;
  onSelect: (id: string) => void;
  onResize: (id: string, w: number, h: number) => void;
}

/**
 * Draggable wrapper for a slide element in the editor with resize handles.
 * @param element - Slide element
 * @param selected - Whether selected
 * @param onSelect - Selection handler
 * @param onResize - Resize handler
 */
export function DraggableElement({ element, selected, onSelect, onResize }: Props): React.ReactNode {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: element.id });
  const rawListeners = listeners as Record<string, unknown> | undefined;

  const style: React.CSSProperties = {
    left: element.x,
    top: element.y,
    width: element.w,
    height: element.h,
    transform: CSS.Translate.toString(transform),
    zIndex: element.zIndex,
    opacity: isDragging ? 0.85 : 1,
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
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let w = startW;
      let h = startH;
      if (dir.includes("e")) w = Math.max(40, startW + dx);
      if (dir.includes("s")) h = Math.max(40, startH + dy);
      if (dir === "e") h = startH;
      if (dir === "s") w = startW;
      if (dir === "se") {
        w = Math.max(40, startW + dx);
        h = Math.max(40, startH + dy);
      }
      onResize(element.id, w, h);
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

  const content = (() => {
    switch (element.type) {
      case "text": {
        const p = element.props as {
          text?: string;
          fontSize?: number;
          color?: string;
          bold?: boolean;
          italic?: boolean;
          underline?: boolean;
          align?: string;
          fontFamily?: string;
          lineHeight?: number;
          letterSpacing?: number;
          opacity?: number;
        };
        return (
          <div
            style={{
              fontSize: p.fontSize ?? 24,
              color: p.color ?? "#18181b",
              fontWeight: p.bold ? 700 : 400,
              fontStyle: p.italic ? "italic" : "normal",
              textDecoration: p.underline ? "underline" : "none",
              textAlign: (p.align as React.CSSProperties["textAlign"]) ?? "left",
              fontFamily: p.fontFamily ? `"${p.fontFamily}", sans-serif` : undefined,
              lineHeight: p.lineHeight ?? 1.2,
              letterSpacing: p.letterSpacing ? `${p.letterSpacing}px` : undefined,
              opacity: p.opacity ?? 1,
            }}
            className="h-full w-full overflow-hidden p-2 text-sm"
          >
            {p.text ?? ""}
          </div>
        );
      }
      case "image": {
        const p = element.props as { src?: string };
        return <img src={p.src ?? ""} alt="" className="h-full w-full object-cover rounded-md" draggable={false} />;
      }
      case "shape": {
        const p = element.props as { fill?: string; radius?: number; borderColor?: string; borderWidth?: number; variant?: string };
        const isCircle = p.variant === "circle";
        return (
          <div
            style={{
              background: p.fill ?? "#e4e4e7",
              borderRadius: isCircle ? "50%" : (p.radius ?? 8),
              border: p.borderWidth ? `${p.borderWidth}px solid ${p.borderColor ?? "#18181b"}` : undefined,
            }}
            className="h-full w-full"
          />
        );
      }
      case "icon": {
        const p = element.props as { name?: string; color?: string; size?: number; bg?: string; bgColor?: string; rounded?: number };
        const IconComp = (FaIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[p.name ?? "FaStar"] ?? FaIcons.FaStar;
        const showBg = (p.bg ?? "transparent") !== "transparent";
        return (
          <div
            style={{ background: showBg ? (p.bgColor ?? "#ffffff") : "transparent", borderRadius: p.rounded ?? 12 }}
            className="flex h-full w-full items-center justify-center"
          >
            <IconComp size={p.size ?? 48} color={p.color ?? "#18181b"} />
          </div>
        );
      }
      case "code": {
        const p = element.props as { code?: string; language?: string; lineNumbers?: boolean };
        return <CodeBlock code={p.code} language={p.language} lineNumbers={p.lineNumbers ?? false} className="text-[11px]" />;
      }
      case "video":
        return <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-xs text-white">Video</div>;
      default:
        return null;
    }
  })();

  const isIconTransparent = element.type === "icon" && (element.props as { bg?: string }).bg === "transparent";

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
      className={`absolute select-none rounded-md border ${isIconTransparent ? "bg-transparent border-dashed border-zinc-300" : "bg-white"} ${selected ? "border-zinc-900 ring-2 ring-zinc-900" : isIconTransparent ? "" : "border-zinc-200"} ${isDragging ? "shadow-lg" : ""}`}
      onPointerDown={handlePointerDown}
      onClick={() => onSelect(element.id)}
      {...attributes}
      {...(rawListeners ? Object.fromEntries(Object.entries(rawListeners).filter(([k]) => k !== "onPointerDown")) : {})}
    >
      {content}
      {selected && (
        <>
          <span
            onPointerDown={(e) => startResize(e, "se")}
            className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-sm border border-white bg-zinc-900"
          />
          <span onPointerDown={(e) => startResize(e, "e")} className="absolute -right-1 top-1/2 h-4 w-1.5 -translate-y-1/2 cursor-e-resize rounded bg-zinc-900" />
          <span onPointerDown={(e) => startResize(e, "s")} className="absolute -bottom-1 left-1/2 h-1.5 w-4 -translate-x-1/2 cursor-s-resize rounded bg-zinc-900" />
        </>
      )}
    </div>
  );
}