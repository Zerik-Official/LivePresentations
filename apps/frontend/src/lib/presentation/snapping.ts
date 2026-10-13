/**
 * Smart guides: snap a dragged box to the edges and centers of other boxes
 * and of the canvas, and report the lines to draw while they are aligned.
 */

/** Axis-aligned box in slide pixels. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Alignment line to draw on the canvas.
 */
export interface Guide {
  /** `vertical` lines sit at an x position; `horizontal` lines at a y position */
  orientation: "vertical" | "horizontal";
  /** Coordinate of the line on its axis */
  position: number;
  /** Where the line starts on the other axis */
  start: number;
  /** Where the line ends on the other axis */
  end: number;
}

/**
 * Result of snapping a drag.
 */
export interface SnapResult {
  /** Horizontal offset to apply, adjusted to the nearest alignment */
  dx: number;
  /** Vertical offset to apply, adjusted to the nearest alignment */
  dy: number;
  /** Lines for the alignments the box ends up on */
  guides: Guide[];
}

/** Tolerance for treating two coordinates as the same after snapping. */
const EPSILON = 0.01;

/**
 * Snap one axis of the moving box.
 * @param start - Leading edge of the moving box after the raw offset
 * @param size - Size of the moving box on this axis
 * @param targets - Coordinates to align with on this axis
 * @param threshold - Maximum distance that still snaps
 * @returns Correction to add to the raw offset, 0 when nothing is close
 */
function snapAxis(start: number, size: number, targets: number[], threshold: number): number {
  let best = 0;
  let bestDistance = threshold + EPSILON;
  for (const anchor of [start, start + size / 2, start + size]) {
    for (const target of targets) {
      const distance = Math.abs(target - anchor);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = target - anchor;
      }
    }
  }
  return best;
}

/**
 * Snap a dragged box against other boxes and the canvas.
 * Edges and centers are matched on each axis independently; the closest
 * match within the threshold wins and a guide is returned for every
 * alignment that holds at the snapped position.
 * @param moving - Box being dragged, at its position before the drag
 * @param rawDx - Horizontal drag offset in slide pixels
 * @param rawDy - Vertical drag offset in slide pixels
 * @param others - Boxes to align with
 * @param canvas - Canvas size
 * @param threshold - Snap distance in slide pixels
 * @returns Adjusted offset and the guides to draw
 */
export function snapDrag(moving: Box, rawDx: number, rawDy: number, others: Box[], canvas: { width: number; height: number }, threshold: number): SnapResult {
  const frame: Box = { x: 0, y: 0, w: canvas.width, h: canvas.height };
  const references = [frame, ...others];
  const dx = rawDx + snapAxis(moving.x + rawDx, moving.w, references.flatMap((box) => [box.x, box.x + box.w / 2, box.x + box.w]), threshold);
  const dy = rawDy + snapAxis(moving.y + rawDy, moving.h, references.flatMap((box) => [box.y, box.y + box.h / 2, box.y + box.h]), threshold);
  const snapped: Box = { ...moving, x: moving.x + dx, y: moving.y + dy };

  const guides = new Map<string, Guide>();
  /**
   * Record a guide, merging it with one already on the same line.
   * @param guide - Guide to add
   */
  function addGuide(guide: Guide): void {
    const key = `${guide.orientation}:${Math.round(guide.position * 100)}`;
    const existing = guides.get(key);
    guides.set(key, existing ? { ...existing, start: Math.min(existing.start, guide.start), end: Math.max(existing.end, guide.end) } : guide);
  }

  for (const box of references) {
    for (const mine of [snapped.x, snapped.x + snapped.w / 2, snapped.x + snapped.w]) {
      for (const theirs of [box.x, box.x + box.w / 2, box.x + box.w]) {
        if (Math.abs(mine - theirs) < EPSILON) addGuide({ orientation: "vertical", position: theirs, start: Math.min(snapped.y, box.y), end: Math.max(snapped.y + snapped.h, box.y + box.h) });
      }
    }
    for (const mine of [snapped.y, snapped.y + snapped.h / 2, snapped.y + snapped.h]) {
      for (const theirs of [box.y, box.y + box.h / 2, box.y + box.h]) {
        if (Math.abs(mine - theirs) < EPSILON) addGuide({ orientation: "horizontal", position: theirs, start: Math.min(snapped.x, box.x), end: Math.max(snapped.x + snapped.w, box.x + box.w) });
      }
    }
  }
  return { dx, dy, guides: Array.from(guides.values()) };
}
