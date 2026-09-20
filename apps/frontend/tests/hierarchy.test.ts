import { describe, expect, it } from "vitest";

import type { SlideElement } from "@/types/presentation";

import { buildElementTree, canLink, getAncestorIds, getChildren, getDescendantIds, getSubtree } from "@/lib/presentation/hierarchy";

function makeEl(id: string, parentId: string | null = null, zIndex = 0): SlideElement {
  return { id, type: "text", x: 0, y: 0, w: 10, h: 10, rotation: 0, zIndex, props: {}, highlightable: true, parentId };
}

describe("hierarchy helpers", () => {
  it("getChildren filters by parentId", () => {
    const els = [makeEl("a"), makeEl("b", "a"), makeEl("c", "a"), makeEl("d", "b")];
    expect(getChildren(els, "a").map((e) => e.id)).toEqual(["b", "c"]);
  });

  it("getDescendantIds recursively collects descendants", () => {
    const els = [makeEl("root"), makeEl("c1", "root"), makeEl("c2", "root"), makeEl("gc1", "c1")];
    expect(getDescendantIds(els, "root").sort()).toEqual(["c1", "c2", "gc1"].sort());
    expect(getDescendantIds(els, "c1")).toEqual(["gc1"]);
  });

  it("getAncestorIds walks up the tree", () => {
    const els = [makeEl("root"), makeEl("mid", "root"), makeEl("leaf", "mid")];
    expect(getAncestorIds(els, "leaf")).toEqual(["mid", "root"]);
    expect(getAncestorIds(els, "root")).toEqual([]);
  });

  it("canLink prevents cycles and self-link", () => {
    const els = [makeEl("a"), makeEl("b", "a"), makeEl("c", "b")];
    expect(canLink(els, "a", "c")).toBe(false);
    expect(canLink(els, "a", "a")).toBe(false);
    expect(canLink(els, "c", "a")).toBe(true);
    expect(canLink(els, "c", null)).toBe(true);
    expect(canLink(els, "c", "missing")).toBe(false);
  });

  it("buildElementTree nests children and sorts by zIndex", () => {
    const els = [makeEl("a", null, 2), makeEl("b", "a", 1), makeEl("c", "a", 0), makeEl("root", null, 0)];
    const tree = buildElementTree(els);
    expect(tree.map((n) => n.id)).toEqual(["root", "a"]);
    const a = tree.find((n) => n.id === "a")!;
    expect(a.children.map((c) => c.id)).toEqual(["c", "b"]);
  });

  it("getSubtree returns node plus descendants", () => {
    const els = [makeEl("a"), makeEl("b", "a"), makeEl("c", "a"), makeEl("d", "b")];
    const sub = getSubtree(els, "a").map((e) => e.id).sort();
    expect(sub).toEqual(["a", "b", "c", "d"].sort());
    expect(getSubtree(els, "b").map((e) => e.id).sort()).toEqual(["b", "d"].sort());
  });
});
