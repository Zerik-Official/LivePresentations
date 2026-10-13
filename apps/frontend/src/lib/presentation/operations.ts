import type { PresentationData, Slide, SlideElement } from "@/types/presentation";
import { getDescendantIds, getSubtree } from "./hierarchy";

/**
 * Pure presentation edits. Every function returns new data and leaves its
 * input untouched, so they compose with undo history and can be driven by
 * the UI or by the AI assistant alike. Functions return the input unchanged
 * when the target slide or element does not exist.
 */

/** Alignment of an element relative to the slide canvas. */
export type AlignMode = "left" | "center" | "right" | "top" | "middle" | "bottom";

/**
 * Create a collision-resistant id.
 * @param prefix - Id prefix such as `el` or `slide`
 * @returns Unique id
 */
export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Compute the z-index that places a new element above the rest.
 * @param slide - Target slide
 * @returns Next free z-index
 */
export function nextZIndex(slide: Slide): number {
  return slide.elements.reduce((max, el) => Math.max(max, el.zIndex), 0) + 1;
}

/**
 * Replace one slide of a presentation.
 * @param data - Presentation data
 * @param slideIndex - Slide index
 * @param update - Builds the new slide from the current one
 * @returns Updated data
 */
export function updateSlideAt(data: PresentationData, slideIndex: number, update: (slide: Slide) => Slide): PresentationData {
  const slide = data.slides[slideIndex];
  if (!slide) return data;
  const slides = [...data.slides];
  slides[slideIndex] = update(slide);
  return { ...data, slides };
}

/**
 * Append elements to a slide, stacking them above the existing ones.
 * @param data - Presentation data
 * @param slideIndex - Slide index
 * @param elements - Elements to add
 * @returns Updated data
 */
export function insertElements(data: PresentationData, slideIndex: number, elements: SlideElement[]): PresentationData {
  return updateSlideAt(data, slideIndex, (slide) => {
    const base = nextZIndex(slide);
    return { ...slide, elements: [...slide.elements, ...elements.map((el, i) => ({ ...el, zIndex: base + i }))] };
  });
}

/**
 * Patch an element's layout fields and merge a props patch.
 * @param data - Presentation data
 * @param slideIndex - Slide index
 * @param elementId - Element id
 * @param patch - Top-level fields to overwrite
 * @param propsPatch - Props to merge
 * @returns Updated data
 */
export function patchElement(data: PresentationData, slideIndex: number, elementId: string, patch: Partial<SlideElement>, propsPatch?: Record<string, unknown>): PresentationData {
  return updateSlideAt(data, slideIndex, (slide) => ({
    ...slide,
    elements: slide.elements.map((el) => (el.id === elementId ? { ...el, ...patch, id: el.id, props: propsPatch ? { ...el.props, ...propsPatch } : (patch.props ?? el.props) } : el)),
  }));
}

/**
 * Remove an element together with its descendants.
 * @param data - Presentation data
 * @param slideIndex - Slide index
 * @param elementId - Element id
 * @returns Updated data
 */
export function removeElement(data: PresentationData, slideIndex: number, elementId: string): PresentationData {
  return updateSlideAt(data, slideIndex, (slide) => {
    const doomed = new Set([elementId, ...getDescendantIds(slide.elements, elementId)]);
    return { ...slide, elements: slide.elements.filter((el) => !doomed.has(el.id)) };
  });
}

/**
 * Move an element and its descendants by an offset.
 * @param data - Presentation data
 * @param slideIndex - Slide index
 * @param elementId - Root element id
 * @param dx - Horizontal offset in slide pixels
 * @param dy - Vertical offset in slide pixels
 * @returns Updated data
 */
export function moveElement(data: PresentationData, slideIndex: number, elementId: string, dx: number, dy: number): PresentationData {
  return updateSlideAt(data, slideIndex, (slide) => {
    const moved = new Set([elementId, ...getDescendantIds(slide.elements, elementId)]);
    return { ...slide, elements: slide.elements.map((el) => (moved.has(el.id) ? { ...el, x: Math.round(el.x + dx), y: Math.round(el.y + dy) } : el)) };
  });
}

/**
 * Align an element (carrying its descendants) against the slide canvas.
 * @param data - Presentation data
 * @param slideIndex - Slide index
 * @param elementId - Element id
 * @param mode - Alignment
 * @returns Updated data
 */
export function alignElement(data: PresentationData, slideIndex: number, elementId: string, mode: AlignMode): PresentationData {
  const element = data.slides[slideIndex]?.elements.find((el) => el.id === elementId);
  if (!element) return data;
  const targets: Record<AlignMode, [number, number]> = {
    left: [0, element.y],
    center: [(data.width - element.w) / 2, element.y],
    right: [data.width - element.w, element.y],
    top: [element.x, 0],
    middle: [element.x, (data.height - element.h) / 2],
    bottom: [element.x, data.height - element.h],
  };
  const [x, y] = targets[mode];
  return moveElement(data, slideIndex, elementId, x - element.x, y - element.y);
}

/**
 * Send an element to the front or the back of its slide.
 * @param data - Presentation data
 * @param slideIndex - Slide index
 * @param elementId - Element id
 * @param position - Target layer
 * @returns Updated data with contiguous z-indexes
 */
export function setElementLayer(data: PresentationData, slideIndex: number, elementId: string, position: "front" | "back"): PresentationData {
  return updateSlideAt(data, slideIndex, (slide) => {
    const ordered = slide.elements.slice().sort((a, b) => a.zIndex - b.zIndex);
    const target = ordered.find((el) => el.id === elementId);
    if (!target) return slide;
    const rest = ordered.filter((el) => el.id !== elementId);
    const next = position === "front" ? [...rest, target] : [target, ...rest];
    const zById = new Map(next.map((el, i) => [el.id, i]));
    return { ...slide, elements: slide.elements.map((el) => ({ ...el, zIndex: zById.get(el.id) ?? el.zIndex })) };
  });
}

/**
 * Copy an element and its descendants with fresh ids.
 * @param elements - Elements of the source slide
 * @param rootId - Root element id
 * @param offset - Offset applied to every copy, in slide pixels
 * @returns Copies with the root first, or an empty list when the root is missing
 */
export function cloneSubtree(elements: SlideElement[], rootId: string, offset = 20): SlideElement[] {
  const subtree = getSubtree(elements, rootId);
  const ids = new Map(subtree.map((el) => [el.id, createId("el")]));
  return subtree
    .map((el) => ({
      ...el,
      id: ids.get(el.id)!,
      parentId: el.id === rootId ? null : ((el.parentId && ids.get(el.parentId)) ?? null),
      x: el.x + offset,
      y: el.y + offset,
      props: structuredClone(el.props),
    }))
    .sort((a, b) => Number(b.parentId === null) - Number(a.parentId === null));
}
