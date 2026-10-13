/**
 * Freehand stroke model shared by the editor drawing element and the live
 * annotations of the presenter/controller.
 */

/** Point normalized to the 0-1 space of its surface. */
export type StrokePoint = [number, number];

/**
 * Freehand stroke with normalized points.
 */
export interface Stroke {
  /** Unique id, used to replace previews and undo */
  id: string;
  /** Pen draws opaque ink; highlighter draws wide translucent ink */
  tool: "pen" | "highlighter";
  /** Ink color as #rrggbb */
  color: string;
  /** Stroke width in logical slide pixels */
  width: number;
  /** Normalized points in drawing order */
  points: StrokePoint[];
}

/** Opacity applied to highlighter strokes. */
export const HIGHLIGHTER_OPACITY = 0.4;

/**
 * Clamp a number to the 0-1 range.
 * @param value - Raw value
 * @returns Clamped value
 */
export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Normalize a pointer position against a surface rectangle.
 * @param clientX - Pointer X in viewport pixels
 * @param clientY - Pointer Y in viewport pixels
 * @param rect - Bounding rectangle of the surface
 * @returns Point in the 0-1 space of the surface
 */
export function toNormalizedPoint(clientX: number, clientY: number, rect: DOMRect): StrokePoint {
  return [clamp01((clientX - rect.left) / rect.width), clamp01((clientY - rect.top) / rect.height)];
}

/**
 * Build a smooth SVG path from normalized points.
 * Consecutive points are joined with quadratic curves through their midpoints.
 * @param points - Normalized points
 * @param width - Target width in SVG units
 * @param height - Target height in SVG units
 * @returns SVG path data
 */
export function strokeToPath(points: StrokePoint[], width: number, height: number): string {
  const scaled = points.map(([x, y]) => [x * width, y * height] as const);
  const first = scaled[0];
  if (!first) return "";
  if (scaled.length === 1) return `M ${first[0]} ${first[1]} l 0.01 0`;
  let path = `M ${first[0]} ${first[1]}`;
  for (let i = 1; i < scaled.length - 1; i += 1) {
    const current = scaled[i]!;
    const next = scaled[i + 1]!;
    path += ` Q ${current[0]} ${current[1]} ${(current[0] + next[0]) / 2} ${(current[1] + next[1]) / 2}`;
  }
  const last = scaled[scaled.length - 1]!;
  return `${path} L ${last[0]} ${last[1]}`;
}

/**
 * Compute the normalized bounding box of a set of strokes.
 * @param strokes - Strokes to measure
 * @returns Bounding box, or null when there are no points
 */
export function strokesBounds(strokes: Stroke[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const points = strokes.flatMap((s) => s.points);
  if (points.length === 0) return null;
  return {
    minX: Math.min(...points.map((p) => p[0])),
    minY: Math.min(...points.map((p) => p[1])),
    maxX: Math.max(...points.map((p) => p[0])),
    maxY: Math.max(...points.map((p) => p[1])),
  };
}

/**
 * Strokes re-expressed relative to their own bounding box.
 */
export interface FittedStrokes {
  /** Box position and size in surface pixels */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Strokes with points normalized to the box */
  strokes: Stroke[];
}

/**
 * Wrap surface-normalized strokes in a tight box, for turning a freehand
 * sketch into a movable element.
 * @param strokes - Strokes normalized to the whole surface
 * @param width - Surface width in pixels
 * @param height - Surface height in pixels
 * @returns Box and box-normalized strokes, or null when there is nothing drawn
 */
export function fitStrokesToBox(strokes: Stroke[], width: number, height: number): FittedStrokes | null {
  const bounds = strokesBounds(strokes);
  if (!bounds) return null;
  const padding = Math.max(...strokes.map((s) => s.width)) / 2 + 2;
  const x = Math.round(bounds.minX * width - padding);
  const y = Math.round(bounds.minY * height - padding);
  const w = Math.max(16, Math.round((bounds.maxX - bounds.minX) * width + padding * 2));
  const h = Math.max(16, Math.round((bounds.maxY - bounds.minY) * height + padding * 2));
  return {
    x,
    y,
    w,
    h,
    strokes: strokes.map((s) => ({ ...s, points: s.points.map(([px, py]): StrokePoint => [(px * width - x) / w, (py * height - y) / h]) })),
  };
}

/**
 * Create a short unique stroke id.
 * @returns Stroke id
 */
export function createStrokeId(): string {
  return `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
