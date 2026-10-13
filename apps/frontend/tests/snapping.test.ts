import { describe, expect, it } from "vitest";

import { snapDrag, type Box } from "@/lib/presentation/snapping";

const canvas = { width: 1280, height: 720 };
const moving: Box = { x: 100, y: 100, w: 200, h: 100 };

describe("smart guides", () => {
  it("snaps a left edge to another left edge and draws the vertical guide across both", () => {
    const other: Box = { x: 404, y: 400, w: 120, h: 80 };
    const result = snapDrag(moving, 300, 37, [other], canvas, 6);
    expect(result.dx).toBe(304);
    expect(result.dy).toBe(37);
    expect(result.guides).toEqual([{ orientation: "vertical", position: 404, start: 137, end: 480 }]);
  });

  it("snaps edges to opposite edges and centers to centers", () => {
    const other: Box = { x: 600, y: 300, w: 100, h: 100 };
    // Right edge of the moving box (300 + dx) meets the left edge of the other (600).
    expect(snapDrag(moving, 297, 0, [other], canvas, 6).dx).toBe(300);
    // Vertical centers: moving center y = 150 + dy, other center y = 350.
    const centered = snapDrag(moving, 700, 203, [other], canvas, 6);
    expect(centered.dy).toBe(200);
    expect(centered.guides.some((guide) => guide.orientation === "horizontal" && guide.position === 350)).toBe(true);
  });

  it("snaps to the canvas center and edges", () => {
    const result = snapDrag(moving, 437, -98, [], canvas, 6);
    expect(result.dx).toBe(440);
    expect(result.dy).toBe(-100);
    expect(result.guides).toContainEqual({ orientation: "vertical", position: 640, start: 0, end: 720 });
    expect(result.guides).toContainEqual({ orientation: "horizontal", position: 0, start: 0, end: 1280 });
  });

  it("leaves the drag alone when nothing is within the threshold", () => {
    const result = snapDrag(moving, 33, 41, [{ x: 900, y: 500, w: 50, h: 50 }], canvas, 6);
    expect(result).toEqual({ dx: 33, dy: 41, guides: [] });
  });

  it("prefers the closest of several candidates", () => {
    const near: Box = { x: 402, y: 600, w: 10, h: 10 };
    const far: Box = { x: 394, y: 650, w: 2, h: 10 };
    expect(snapDrag(moving, 300, 300, [far, near], canvas, 6).dx).toBe(302);
  });
});
