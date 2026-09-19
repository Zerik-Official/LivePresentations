import type { Slide, SlideElement } from "@/types/presentation";
import { elementRegistry } from "@/features/editor/elements/registry";

/**
 * Create an empty slide with a unique id.
 * @param id - Slide id
 * @returns Slide object
 */
export function createEmptySlide(id: string): Slide {
  return { id, background: "#ffffff", elements: [], transition: "fade" };
}

/**
 * Create a default element of a given type via registry.
 * Falls back to empty props if type not registered.
 * @param type - Element type
 * @param id - Element id
 * @returns SlideElement
 */
export function createDefaultElement(type: SlideElement["type"], id: string): SlideElement {
  if (elementRegistry.has(type)) {
    return elementRegistry.createDefault(type, id);
  }
  return { id, type, x: 80, y: 80, w: 300, h: 80, rotation: 0, zIndex: 1, highlightable: true, parentId: null, props: {} };
}
