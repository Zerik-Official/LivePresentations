import { useEffect, useRef, useState } from "react";

import { DrawingSurface, type DrawingTool } from "@/components/DrawingSurface";
import { DrawingToolbar } from "@/components/DrawingToolbar";
import { elementRegistry } from "@/features/editor/elements/registry";
import type { Stroke, StrokePoint } from "@/lib/drawing/strokes";
import type { Slide } from "@/types/presentation";

interface Props {
  /** Slide currently shown to the audience */
  slide: Slide;
  /** Index of that slide */
  slideIndex: number;
  /** Logical slide width */
  width: number;
  /** Logical slide height */
  height: number;
  /** Strokes already drawn on the slide */
  strokes: Stroke[];
  /** Commit a finished stroke */
  onStroke: (slide: number, stroke: Stroke) => void;
  /** Send any room event */
  send: (type: string, payload: Record<string, unknown>) => void;
}

/**
 * Controller pad to annotate the live slide: a miniature of the slide with a
 * drawing surface on top, plus pen, highlighter and laser pointer tools.
 * @param slide - Current slide
 * @param slideIndex - Current slide index
 * @param width - Logical slide width
 * @param height - Logical slide height
 * @param strokes - Strokes of the slide
 * @param onStroke - Finished stroke handler
 * @param send - Room event sender
 * @returns Annotation pad
 */
export function AnnotationPad({ slide, slideIndex, width, height, strokes, onStroke, send }: Props): React.ReactNode {
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [color, setColor] = useState("#ef4444");
  const [inkWidth, setInkWidth] = useState(6);
  const [scale, setScale] = useState(0);
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / width);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [width]);

  /**
   * Share the laser position, or hide it when the finger is lifted.
   * @param point - Normalized position or null
   */
  function handlePointer(point: StrokePoint | null): void {
    send("POINTER_MOVE", point ? { x: point[0], y: point[1], visible: true } : { visible: false });
  }

  /**
   * Switch tool, hiding the laser when leaving it.
   * @param next - Tool to activate
   */
  function handleToolChange(next: DrawingTool): void {
    if (tool === "laser" && next !== "laser") handlePointer(null);
    setTool(next);
  }

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Anotar</h2>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{tool === "laser" ? "Arrastra el dedo para señalar con el puntero." : "Dibuja sobre la diapositiva; el público lo ve al instante."}</p>

      <div ref={frameRef} style={{ aspectRatio: `${width} / ${height}`, background: slide.background }} className="relative mt-3 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        {scale > 0 && (
          <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }} className="pointer-events-none absolute left-0 top-0">
            {slide.elements
              .slice()
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((el) => (
                <div key={el.id} style={{ position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h, transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined }}>
                  {elementRegistry.tryGet(el.type)?.renderThumbnail(el)}
                </div>
              ))}
          </div>
        )}
        <DrawingSurface
          width={width}
          height={height}
          strokes={strokes}
          tool={tool}
          color={color}
          strokeWidth={tool === "highlighter" ? inkWidth * 3 : inkWidth}
          onStrokeProgress={(stroke) => send("DRAW_PROGRESS", { slide: slideIndex, stroke })}
          onStrokeEnd={(stroke) => onStroke(slideIndex, stroke)}
          onPointer={handlePointer}
        />
      </div>

      <div className="mt-3">
        <DrawingToolbar
          tool={tool}
          color={color}
          strokeWidth={inkWidth}
          tools={["pen", "highlighter", "laser"]}
          onToolChange={handleToolChange}
          onColorChange={setColor}
          onWidthChange={setInkWidth}
          onUndo={() => send("DRAW_UNDO", { slide: slideIndex })}
          onClear={() => send("DRAW_CLEAR", { slide: slideIndex })}
          hasStrokes={strokes.length > 0}
        />
      </div>
    </section>
  );
}
