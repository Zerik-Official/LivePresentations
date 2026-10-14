import { describe, expect, it } from "vitest";

import { heightForCrop, readCrop } from "@/components/CroppedMedia";
import { animationCss, normalizeAnimations, sanitizeKeyframes, type ElementAnimation } from "@/lib/animations/effects";
import { nextControllerAnimation, resolvePlayback } from "@/lib/animations/playback";
import type { Slide, SlideElement } from "@/types/presentation";

let counter = 0;
const nextId = (): string => `a${(counter += 1)}`;

/**
 * Build an animation with defaults for tests.
 * @param overrides - Fields to override
 * @returns Animation
 */
function animation(overrides: Partial<ElementAnimation>): ElementAnimation {
  return normalizeAnimations([{ effect: "fadeIn", trigger: "enter", ...overrides }], nextId)[0]!;
}

/**
 * Build an element for tests.
 * @param id - Element id
 * @param overrides - Fields to override
 * @returns Element
 */
function element(id: string, overrides: Partial<SlideElement> = {}): SlideElement {
  return { id, type: "shape", x: 0, y: 0, w: 10, h: 10, rotation: 0, zIndex: 0, props: {}, highlightable: true, parentId: null, ...overrides };
}

describe("custom keyframes", () => {
  it("accepts plain keyframe blocks and normalizes them", () => {
    expect(sanitizeKeyframes("/* in */ 0% { opacity: 0 }\n50%, 70% {transform: scale(1.1)} to { opacity: 1 }")).toBe("0% { opacity: 0 } 50%, 70% { transform: scale(1.1) } to { opacity: 1 }");
  });

  it("rejects anything that could escape the rule or load remote content", () => {
    for (const bad of ["from { background: url(https://x.test/a.png) }", "} body { display: none } x {", "@import 'x'; from { opacity: 0 }", "from { opacity: 0 } junk", "from { a { b: c } }", "", "to { content: '<script>' }"]) {
      expect(sanitizeKeyframes(bad)).toBeNull();
    }
  });

  it("builds the animation shorthand and drops invalid customs", () => {
    expect(animationCss(animation({ effect: "pulse", durationMs: 700, delayMs: 100, iterations: 0, easing: "linear" }))).toBe("lp-pulse 700ms linear 100ms infinite both");
    expect(animationCss(animation({ effect: "custom", keyframes: "url(x)" }))).toBeUndefined();
    expect(animationCss(animation({ effect: "custom", keyframes: "from { opacity: 0 } to { opacity: 1 }" }))).toMatch(/^lp-custom-[0-9a-z]+ /);
  });

  it("normalizes loose assistant output", () => {
    const [result] = normalizeAnimations([{ effect: "teleport", trigger: "controller", iterations: "infinite", durationMs: "900" }], nextId);
    expect(result).toMatchObject({ effect: "fadeIn", trigger: "controller", iterations: 0, durationMs: 900, includeChildren: true, easing: "ease-out" });
    expect(normalizeAnimations("nope", nextId)).toEqual([]);
  });
});

describe("animation playback", () => {
  const reveal = animation({ effect: "slideInLeft", trigger: "controller" });
  const entrance = animation({ effect: "zoomIn", trigger: "enter" });
  const slide: Slide = {
    id: "s",
    background: "#fff",
    transition: "fade",
    elements: [element("title", { animations: [entrance] }), element("card", { zIndex: 1, animations: [reveal] }), element("label", { parentId: "card", zIndex: 2 })],
  };

  it("plays entrances on arrival and hides click-to-reveal elements and their children", () => {
    const playback = resolvePlayback(slide, {});
    expect(playback.get("title")).toMatchObject({ animation: entrance, hidden: false });
    expect(playback.get("card")).toMatchObject({ animation: null, hidden: true });
    expect(playback.get("label")).toMatchObject({ hidden: true });
  });

  it("lets the author choose whether a controller animation starts hidden", () => {
    const visibleReveal = animation({ effect: "slideInLeft", trigger: "controller", startHidden: false });
    const customReveal = animation({ effect: "custom", trigger: "controller", startHidden: true, keyframes: "from { opacity: 0 } to { opacity: 1 }" });
    const custom: Slide = { ...slide, elements: [element("a", { animations: [visibleReveal] }), element("b", { animations: [customReveal] })] };
    const playback = resolvePlayback(custom, {});
    expect(playback.get("a")).toMatchObject({ hidden: false });
    expect(playback.get("b")).toMatchObject({ hidden: true });
    expect(animation({ effect: "pulse", trigger: "controller" }).startHidden).toBe(false);
  });

  it("applies a triggered animation to the element and its linked children", () => {
    const playback = resolvePlayback(slide, { [reveal.id]: { elementId: "card", animationId: reveal.id, nonce: 5 } });
    expect(playback.get("card")).toMatchObject({ animation: reveal, hidden: false, runKey: `${reveal.id}-5` });
    expect(playback.get("label")).toMatchObject({ animation: reveal, hidden: false });
  });

  it("walks controller animations in order", () => {
    expect(nextControllerAnimation(slide, new Set())?.animation.id).toBe(reveal.id);
    expect(nextControllerAnimation(slide, new Set([reveal.id]))).toBeNull();
  });
});

describe("media crop", () => {
  it("accepts regions inside the source and ignores full frames or garbage", () => {
    expect(readCrop({ x: 0.5, y: 0, w: 0.5, h: 1 })).toEqual({ x: 0.5, y: 0, w: 0.5, h: 1 });
    expect(readCrop({ x: 0, y: 0, w: 1, h: 1 })).toBeNull();
    expect(readCrop({ x: 0.8, y: 0, w: 0.5, h: 1 })).toBeNull();
    expect(readCrop({ x: "0" })).toBeNull();
    expect(readCrop(null)).toBeNull();
  });

  it("computes the element height that keeps the crop undistorted", () => {
    // Right half of a 16:9 image shown 400px wide: 8:9 region, so 450px tall.
    expect(heightForCrop(400, { x: 0.5, y: 0, w: 0.5, h: 1 }, 16 / 9)).toBe(450);
  });
});
