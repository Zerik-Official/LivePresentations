import { useRef, useState } from "react";

import { StrokesSvg } from "@/components/StrokesSvg";
import { createStrokeId, toNormalizedPoint, type Stroke, type StrokePoint } from "@/lib/drawing/strokes";

const PROGRESS_INTERVAL_MS = 60;
const MIN_POINT_DISTANCE = 0.002;

/** Tool handled by the surface: two inks and a non-drawing laser pointer. */
export type DrawingTool = "pen" | "highlighter" | "laser";

interface Props {
  /** Logical width the stroke widths refer to */
  width: number;
  /** Logical height the stroke widths refer to */
  height: number;
  /** Finished strokes to paint under the one in progress */
  strokes: Stroke[];
  /** Active tool */
  tool: DrawingTool;
  /** Ink color as #rrggbb */
  color: string;
  /** Ink width in logical pixels */
  strokeWidth: number;
  /** Called when a stroke is finished */
  onStrokeEnd: (stroke: Stroke) => void;
  /** Called, throttled, while a stroke is being drawn */
  onStrokeProgress?: (stroke: Stroke) => void;
  /** Called with the laser position, or null when the pointer is lifted */
  onPointer?: (point: StrokePoint | null) => void;
  /** Extra classes for the surface */
  className?: string;
}

/**
 * Pointer surface that captures freehand strokes in normalized coordinates.
 * It stretches over its positioned parent and works with mouse, pen and touch.
 * @param width - Logical width
 * @param height - Logical height
 * @param strokes - Finished strokes
 * @param tool - Active tool
 * @param color - Ink color
 * @param strokeWidth - Ink width
 * @param onStrokeEnd - Finished stroke handler
 * @param onStrokeProgress - In-progress stroke handler
 * @param onPointer - Laser position handler
 * @param className - Extra classes
 * @returns Drawing surface
 */
export function DrawingSurface({ width, height, strokes, tool, color, strokeWidth, onStrokeEnd, onStrokeProgress, onPointer, className = "" }: Props): React.ReactNode {
  const [current, setCurrent] = useState<Stroke | null>(null);
  const currentRef = useRef<Stroke | null>(null);
  const activePointer = useRef<number | null>(null);
  const lastProgress = useRef(0);

  /**
   * Begin a stroke or show the laser.
   * @param e - Pointer event
   */
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>): void {
    if (activePointer.current !== null) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointer.current = e.pointerId;
    const point = toNormalizedPoint(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
    if (tool === "laser") {
      onPointer?.(point);
      return;
    }
    const stroke: Stroke = { id: createStrokeId(), tool, color, width: strokeWidth, points: [point] };
    currentRef.current = stroke;
    setCurrent(stroke);
  }

  /**
   * Extend the stroke or move the laser.
   * @param e - Pointer event
   */
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>): void {
    if (activePointer.current !== e.pointerId) return;
    const point = toNormalizedPoint(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
    const now = Date.now();
    const throttled = now - lastProgress.current < PROGRESS_INTERVAL_MS;
    if (tool === "laser") {
      if (throttled) return;
      lastProgress.current = now;
      onPointer?.(point);
      return;
    }
    const stroke = currentRef.current;
    const last = stroke?.points[stroke.points.length - 1];
    if (!stroke || !last || Math.hypot(point[0] - last[0], point[1] - last[1]) < MIN_POINT_DISTANCE) return;
    const next = { ...stroke, points: [...stroke.points, point] };
    currentRef.current = next;
    setCurrent(next);
    if (!throttled) {
      lastProgress.current = now;
      onStrokeProgress?.(next);
    }
  }

  /**
   * Finish the stroke or hide the laser.
   * @param e - Pointer event
   */
  function handlePointerEnd(e: React.PointerEvent<HTMLDivElement>): void {
    if (activePointer.current !== e.pointerId) return;
    activePointer.current = null;
    if (tool === "laser") {
      onPointer?.(null);
      return;
    }
    const stroke = currentRef.current;
    currentRef.current = null;
    setCurrent(null);
    if (stroke) onStrokeEnd(stroke);
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      className={`absolute inset-0 touch-none select-none ${tool === "laser" ? "cursor-pointer" : "cursor-crosshair"} ${className}`}
    >
      <StrokesSvg strokes={current ? [...strokes, current] : strokes} width={width} height={height} className="pointer-events-none" />
    </div>
  );
}
