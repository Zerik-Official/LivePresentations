import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import * as FaIcons from "react-icons/fa";

import { CodeBlock } from "@/components/CodeBlock";
import type { SlideElement } from "@/types/presentation";
import { isYouTubeUrl, parseYouTubeId } from "./elements/video/youtube";

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

  const translate = CSS.Translate.toString(transform);
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
          backgroundEnabled?: boolean;
          backgroundColor?: string;
          backgroundRadius?: number;
          backgroundPadding?: number;
        };
        const hasBg = Boolean(p.backgroundEnabled);
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
              backgroundColor: hasBg ? (p.backgroundColor ?? "#ffffff") : "transparent",
              borderRadius: hasBg ? (p.backgroundRadius ?? 8) : undefined,
              padding: hasBg ? (p.backgroundPadding ?? 8) : 8,
            }}
            className="h-full w-full overflow-hidden text-sm"
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
        const variant = p.variant ?? "rect";
        const shapeStyle: React.CSSProperties = {
          background: p.fill ?? "#e4e4e7",
          border: p.borderWidth ? `${p.borderWidth}px solid ${p.borderColor ?? "#18181b"}` : undefined,
        };
        if (variant === "circle") shapeStyle.borderRadius = "50%";
        else if (variant === "pill") shapeStyle.borderRadius = 9999;
        else if (variant === "triangle") shapeStyle.clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)";
        else if (variant === "diamond") shapeStyle.clipPath = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
        else if (variant === "hexagon") shapeStyle.clipPath = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
        else shapeStyle.borderRadius = p.radius ?? 12;
        return <div style={shapeStyle} className="h-full w-full" />;
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
      case "specials": {
        const p = element.props as {
          text?: string;
          icon?: string;
          iconColor?: string;
          iconBgColor?: string;
          backgroundColor?: string;
          textColor?: string;
          kind?: string;
        };
        const IconComp = (FaIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[p.icon ?? "FaStar"] ?? FaIcons.FaStar;
        return (
          <div
            style={{ backgroundColor: p.backgroundColor ?? "#fffbeb", borderColor: "#fcd34d" }}
            className="flex h-full w-full items-center justify-between gap-3 rounded-md border px-3"
          >
            <span style={{ color: p.textColor ?? "#18181b" }} className="truncate text-sm font-medium">
              {p.text ?? "Respuesta especial"}
            </span>
            <span style={{ backgroundColor: p.iconBgColor ?? "#ffffff" }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700">
              <IconComp size={18} color={p.iconColor ?? "#f59e0b"} />
            </span>
          </div>
        );
      }
      case "video": {
        const p = element.props as { src?: string; poster?: string; autoplay?: boolean; loop?: boolean; muted?: boolean; controls?: boolean };
        if (!p.src) return <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-xs text-white">Sin video</div>;
        if (isYouTubeUrl(p.src)) {
          const id = parseYouTubeId(p.src);
          const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
          return (
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-md bg-zinc-900">
              {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" draggable={false} /> : null}
              <span className="absolute flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-600">
                <FaIcons.FaPlay size={12} className="ml-0.5" />
              </span>
            </div>
          );
        }
        return (
          <video
            src={p.src}
            poster={p.poster}
            autoPlay={p.autoplay}
            loop={p.loop}
            muted={p.muted ?? true}
            controls={p.controls ?? true}
            playsInline
            preload="metadata"
            className="h-full w-full rounded-md bg-black object-contain"
          />
        );
      }
      default:
        return null;
    }
  })();

  const isIconTransparent = element.type === "icon" && (element.props as { bg?: string }).bg === "transparent";
  const isTextTransparent = element.type === "text" && !(element.props as { backgroundEnabled?: boolean }).backgroundEnabled;

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
      className={`absolute select-none rounded-md border ${isIconTransparent || isTextTransparent ? "bg-transparent" : "bg-white"} ${selected ? "border-zinc-900 ring-2 ring-zinc-900" : isIconTransparent ? "border-dashed border-zinc-300" : isTextTransparent ? "border-transparent" : "border-zinc-200"} ${isDragging ? "shadow-lg" : ""}`}
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