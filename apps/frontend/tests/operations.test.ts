import { describe, expect, it } from "vitest";

import { fitStrokesToBox, strokeToPath, type Stroke } from "@/lib/drawing/strokes";
import { alignElement, cloneSubtree, insertElements, moveElement, patchElement, removeElement, setElementLayer } from "@/lib/presentation/operations";
import type { PresentationData, SlideElement } from "@/types/presentation";

/**
 * Build a minimal element for tests.
 * @param id - Element id
 * @param overrides - Fields to override
 * @returns SlideElement
 */
function element(id: string, overrides: Partial<SlideElement> = {}): SlideElement {
  return { id, type: "shape", x: 100, y: 100, w: 200, h: 100, rotation: 0, zIndex: 0, props: { fill: "#fff" }, highlightable: true, parentId: null, ...overrides };
}

/**
 * Build a one-slide presentation for tests.
 * @param elements - Elements of the slide
 * @returns PresentationData
 */
function deck(elements: SlideElement[]): PresentationData {
  return { slides: [{ id: "s1", background: "#fff", elements, transition: "fade" }], theme: { primary: "#000", accent: "#000" }, width: 1280, height: 720, variables: [] };
}

describe("presentation operations", () => {
  it("stacks inserted elements above existing ones without mutating the input", () => {
    const data = deck([element("a", { zIndex: 4 })]);
    const next = insertElements(data, 0, [element("b"), element("c")]);
    expect(next.slides[0]!.elements.map((el) => [el.id, el.zIndex])).toEqual([["a", 4], ["b", 5], ["c", 6]]);
    expect(data.slides[0]!.elements).toHaveLength(1);
  });

  it("returns the same data when the slide does not exist", () => {
    const data = deck([]);
    expect(insertElements(data, 3, [element("b")])).toBe(data);
  });

  it("merges props patches and never changes the id", () => {
    const next = patchElement(deck([element("a")]), 0, "a", { x: 5, id: "hacked" }, { radius: 8 });
    expect(next.slides[0]!.elements[0]).toMatchObject({ id: "a", x: 5, props: { fill: "#fff", radius: 8 } });
  });

  it("moves and removes an element together with its descendants", () => {
    const data = deck([element("a"), element("child", { parentId: "a", x: 120 }), element("grandchild", { parentId: "child", x: 130 }), element("other", { x: 0 })]);
    const moved = moveElement(data, 0, "a", 10, -20);
    expect(moved.slides[0]!.elements.map((el) => [el.x, el.y])).toEqual([[110, 80], [130, 80], [140, 80], [0, 100]]);
    expect(removeElement(data, 0, "a").slides[0]!.elements.map((el) => el.id)).toEqual(["other"]);
  });

  it("aligns against the canvas", () => {
    const data = deck([element("a")]);
    expect(alignElement(data, 0, "a", "center").slides[0]!.elements[0]!.x).toBe(540);
    expect(alignElement(data, 0, "a", "bottom").slides[0]!.elements[0]!.y).toBe(620);
    expect(alignElement(data, 0, "a", "left").slides[0]!.elements[0]!.x).toBe(0);
  });

  it("reorders layers with contiguous z-indexes", () => {
    const data = deck([element("a", { zIndex: 0 }), element("b", { zIndex: 1 }), element("c", { zIndex: 2 })]);
    const z = (next: PresentationData): Record<string, number> => Object.fromEntries(next.slides[0]!.elements.map((el) => [el.id, el.zIndex]));
    expect(z(setElementLayer(data, 0, "a", "front"))).toEqual({ b: 0, c: 1, a: 2 });
    expect(z(setElementLayer(data, 0, "c", "back"))).toEqual({ c: 0, a: 1, b: 2 });
  });

  it("clones a subtree with fresh ids and remapped parents", () => {
    const source = [element("a", { parentId: "outside" }), element("child", { parentId: "a" }), element("other")];
    const clones = cloneSubtree(source, "a", 20);
    expect(clones).toHaveLength(2);
    const [root, child] = clones;
    expect(root!.parentId).toBeNull();
    expect(child!.parentId).toBe(root!.id);
    expect(new Set([root!.id, child!.id, "a", "child"]).size).toBe(4);
    expect([root!.x, root!.y]).toEqual([120, 120]);
    expect(root!.props).not.toBe(source[0]!.props);
  });
});

describe("strokes", () => {
  const stroke: Stroke = { id: "s", tool: "pen", color: "#000000", width: 4, points: [[0.25, 0.5], [0.5, 0.75]] };

  it("fits strokes into a padded box and renormalizes points", () => {
    const fitted = fitStrokesToBox([stroke], 1000, 1000)!;
    expect(fitted).toMatchObject({ x: 246, y: 496, w: 258, h: 258 });
    const [first, last] = fitted.strokes[0]!.points;
    expect(first![0] * fitted.w + fitted.x).toBeCloseTo(250);
    expect(last![1] * fitted.h + fitted.y).toBeCloseTo(750);
  });

  it("returns null when nothing was drawn", () => {
    expect(fitStrokesToBox([], 100, 100)).toBeNull();
  });

  it("builds a path for single and multiple points", () => {
    expect(strokeToPath([[0.5, 0.5]], 100, 100)).toBe("M 50 50 l 0.01 0");
    expect(strokeToPath(stroke.points, 100, 100)).toBe("M 25 50 L 50 75");
  });
});
