import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { isChangeLive, revertChange, type AiChange } from "@/features/assistant/changes";
import { executeTool, TOOL_NAMES, type EditorBridge } from "@/features/assistant/tools";
import { registerElementDefinitions } from "@/features/editor/elements/registry/register";
import type { PresentationData } from "@/types/presentation";

let data: PresentationData;
let title: string;
let activeSlide: number;

const bridge: EditorBridge = {
  getData: () => data,
  setData: (next) => {
    data = next;
  },
  getTitle: () => title,
  setTitle: (next) => {
    title = next;
  },
  getActiveSlide: () => activeSlide,
  setActiveSlide: (index) => {
    activeSlide = index;
  },
};

/**
 * Run a tool with object arguments and no pacing.
 * @param name - Tool name
 * @param args - Arguments
 * @returns Outcome with the parsed result when it succeeded
 */
async function run(name: string, args: unknown): Promise<{ ok: boolean; result: string; changes: AiChange[]; parsed: Record<string, unknown> }> {
  const outcome = await executeTool(bridge, name, JSON.stringify(args), { paceMs: 0 });
  return { ...outcome, parsed: outcome.ok ? (JSON.parse(outcome.result) as Record<string, unknown>) : {} };
}

/**
 * Revert a change on the test document.
 * @param change - Change to revert
 */
function reject(change: AiChange): void {
  data = revertChange(data, change);
}

beforeAll(() => registerElementDefinitions());

beforeEach(() => {
  data = { slides: [], theme: { primary: "#000", accent: "#000" }, width: 1280, height: 720, variables: [] };
  title = "Demo";
  activeSlide = 0;
});

describe("assistant tools", () => {
  it("implements every tool the server defines", () => {
    expect(TOOL_NAMES.sort()).toEqual(["add_elements", "add_slide", "delete_element", "delete_slide", "get_presentation", "move_slide", "set_title", "update_element", "update_slide"]);
  });

  it("creates a slide with elements merged over defaults and navigates to it", async () => {
    const outcome = await run("add_slide", {
      background: "#0f172a",
      elements: [
        { type: "shape", x: 0, y: 0, w: 1280, h: 120, props: { fill: "#1e293b", variant: "rect" } },
        { type: "text", x: 80, y: 30.4, w: 900, h: 70, props: { text: "Hola", fontSize: 56 } },
      ],
    });
    expect(outcome.ok).toBe(true);
    expect(outcome.parsed.slide_index).toBe(0);
    const slide = data.slides[0]!;
    expect(slide.background).toBe("#0f172a");
    expect(slide.elements.map((el) => el.zIndex)).toEqual([1, 2]);
    expect(slide.elements[1]).toMatchObject({ type: "text", y: 30, props: { text: "Hola", fontSize: 56, fontFamily: "Inter" } });
    expect(activeSlide).toBe(0);
    expect(outcome.changes).toHaveLength(1);
    expect(outcome.changes[0]).toMatchObject({ kind: "slide-added", slideId: slide.id });
  });

  it("reads back a compact snapshot without recording changes", async () => {
    await run("add_slide", { elements: [{ type: "text", x: 0, y: 0, w: 10, h: 10, props: { text: "x".repeat(500) } }] });
    const outcome = await run("get_presentation", {});
    const snapshot = outcome.parsed as unknown as { title: string; slide_count: number; slides: Array<{ elements: Array<{ props: { text: string } }> }> };
    expect(snapshot.title).toBe("Demo");
    expect(snapshot.slide_count).toBe(1);
    expect(snapshot.slides[0]!.elements[0]!.props.text.length).toBeLessThan(350);
    expect(outcome.changes).toEqual([]);
  });

  it("reports mistakes to the model without changing the document", async () => {
    await run("add_slide", {});
    const before = data;
    expect((await run("add_elements", { slide_index: 7, elements: [{ type: "text", x: 0, y: 0, w: 1, h: 1 }] })).result).toContain("out of range");
    expect((await run("add_elements", { slide_index: 0, elements: [{ type: "specials", x: 0, y: 0, w: 1, h: 1 }] })).result).toContain("Unsupported element type");
    expect((await run("add_elements", { slide_index: 0, elements: [{ type: "text", x: "left", y: 0, w: 1, h: 1 }] })).result).toContain('"x" must be a number');
    expect((await run("update_element", { slide_index: 0, element_id: "nope" })).result).toContain("No element");
    expect((await executeTool(bridge, "add_slide", '{"elements": [')).result).toContain("not valid JSON");
    expect((await executeTool(bridge, "format_disk", "{}")).ok).toBe(false);
    expect(data).toBe(before);
  });
});

describe("reviewing assistant changes", () => {
  it("discards one added element and keeps the others", async () => {
    await run("add_slide", {});
    const outcome = await run("add_elements", {
      slide_index: 0,
      elements: [
        { type: "text", x: 0, y: 0, w: 100, h: 40, props: { text: "Uno" } },
        { type: "shape", x: 0, y: 50, w: 100, h: 40 },
      ],
    });
    expect(outcome.changes.map((c) => c.kind)).toEqual(["element-added", "element-added"]);
    expect(outcome.changes[0]!.label).toBe("Añadido: Texto «Uno» · diapositiva 1");
    reject(outcome.changes[0]!);
    expect(data.slides[0]!.elements.map((el) => el.type)).toEqual(["shape"]);
  });

  it("restores an updated element exactly", async () => {
    const ids = (await run("add_slide", { elements: [{ type: "text", x: 10, y: 10, w: 100, h: 40 }] })).parsed.element_ids as string[];
    const original = data.slides[0]!.elements[0]!;
    const outcome = await run("update_element", { slide_index: 0, element_id: ids[0], x: 50, props: { color: "#ff0000" } });
    expect(data.slides[0]!.elements[0]).toMatchObject({ x: 50, y: 10, props: { color: "#ff0000", text: "Texto de ejemplo" } });
    reject(outcome.changes[0]!);
    expect(data.slides[0]!.elements[0]).toEqual(original);
  });

  it("brings back a deleted element and a deleted slide", async () => {
    const ids = (await run("add_slide", { background: "#111111", elements: [{ type: "shape", x: 1, y: 2, w: 3, h: 4 }] })).parsed.element_ids as string[];
    await run("add_slide", { background: "#222222" });
    const removedElement = await run("delete_element", { slide_index: 0, element_id: ids[0] });
    expect(data.slides[0]!.elements).toHaveLength(0);
    reject(removedElement.changes[0]!);
    expect(data.slides[0]!.elements[0]!.id).toBe(ids[0]);

    const removedSlide = await run("delete_slide", { slide_index: 0 });
    expect(data.slides.map((s) => s.background)).toEqual(["#222222"]);
    reject(removedSlide.changes[0]!);
    expect(data.slides.map((s) => s.background)).toEqual(["#111111", "#222222"]);
  });

  it("undoes slide moves, slide settings and the title", async () => {
    await run("add_slide", { background: "#111111" });
    await run("add_slide", { background: "#222222" });
    const moved = await run("move_slide", { from_index: 1, to_index: 0 });
    expect(data.slides.map((s) => s.background)).toEqual(["#222222", "#111111"]);
    reject(moved.changes[0]!);
    expect(data.slides.map((s) => s.background)).toEqual(["#111111", "#222222"]);

    const updated = await run("update_slide", { slide_index: 0, background: "#abcdef", notes: "nota" });
    reject(updated.changes[0]!);
    expect(data.slides[0]).toMatchObject({ background: "#111111" });
    expect(data.slides[0]!.notes).toBeUndefined();

    const renamed = await run("set_title", { title: "  Nuevo título " });
    expect(title).toBe("Nuevo título");
    expect(renamed.changes[0]).toMatchObject({ kind: "title", before: "Demo" });
  });

  it("treats changes as moot once their target is gone", async () => {
    const added = await run("add_slide", { elements: [{ type: "text", x: 0, y: 0, w: 10, h: 10 }] });
    const element = await run("add_elements", { slide_index: 0, elements: [{ type: "shape", x: 0, y: 0, w: 10, h: 10 }] });
    expect(isChangeLive(data, element.changes[0]!)).toBe(true);
    reject(added.changes[0]!);
    expect(data.slides).toHaveLength(0);
    expect(isChangeLive(data, element.changes[0]!)).toBe(false);
    expect(revertChange(data, element.changes[0]!)).toBe(data);
  });
});
