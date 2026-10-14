import { removeElement, updateSlideAt } from "@/lib/presentation/operations";
import type { PresentationData, Slide, SlideElement } from "@/types/presentation";

/**
 * What an assistant edit touched, with enough of the previous state to undo
 * that edit alone. Targets are referenced by id, so a change can still be
 * reverted after later edits moved things around.
 */
export type ChangeDetail =
  | { kind: "slide-added"; slideId: string }
  | { kind: "slide-updated"; slideId: string; before: Pick<Slide, "background" | "transition" | "notes"> }
  | { kind: "slide-removed"; index: number; before: Slide }
  | { kind: "slide-moved"; slideId: string; fromIndex: number }
  | { kind: "element-added"; slideId: string; elementId: string }
  | { kind: "element-updated"; slideId: string; elementId: string; before: SlideElement }
  | { kind: "element-removed"; slideId: string; before: SlideElement[] }
  | { kind: "title"; before: string };

/**
 * Assistant edit awaiting the user's review.
 */
export type AiChange = ChangeDetail & {
  /** Unique id of the change */
  id: string;
  /** Description in Spanish shown in the review list */
  label: string;
};

/**
 * Find the index of a slide by id.
 * @param data - Presentation data
 * @param slideId - Slide id
 * @returns Index, or -1 when the slide no longer exists
 */
export function slideIndexOf(data: PresentationData, slideId: string): number {
  return data.slides.findIndex((slide) => slide.id === slideId);
}

/**
 * Tell whether a change can still be reviewed.
 * A change becomes moot when its target was deleted afterwards, for example
 * an element added to a slide that the user then removed.
 * @param data - Current presentation data
 * @param change - Change to check
 * @returns True when accepting or rejecting it still means something
 */
export function isChangeLive(data: PresentationData, change: AiChange): boolean {
  if (change.kind === "title" || change.kind === "slide-removed") return true;
  const index = slideIndexOf(data, change.slideId);
  if (index === -1) return false;
  if (change.kind === "element-added" || change.kind === "element-updated") return data.slides[index]!.elements.some((el) => el.id === change.elementId);
  return true;
}

/**
 * Undo a single assistant change on the current document.
 * Title changes are not part of the document data; the caller restores them.
 * @param data - Current presentation data
 * @param change - Change to revert
 * @returns Data with that change undone, or the same data when nothing applies
 */
export function revertChange(data: PresentationData, change: AiChange): PresentationData {
  if (change.kind === "title") return data;
  if (change.kind === "slide-removed") {
    const slides = [...data.slides];
    slides.splice(Math.min(change.index, slides.length), 0, change.before);
    return { ...data, slides };
  }
  const index = slideIndexOf(data, change.slideId);
  if (index === -1) return data;

  switch (change.kind) {
    case "slide-added":
      return { ...data, slides: data.slides.filter((slide) => slide.id !== change.slideId) };
    case "slide-updated":
      return updateSlideAt(data, index, (slide) => ({ ...slide, ...change.before }));
    case "slide-moved": {
      const slides = [...data.slides];
      const [moved] = slides.splice(index, 1);
      slides.splice(Math.min(change.fromIndex, slides.length), 0, moved!);
      return { ...data, slides };
    }
    case "element-added":
      return removeElement(data, index, change.elementId);
    case "element-updated":
      return updateSlideAt(data, index, (slide) => ({ ...slide, elements: slide.elements.map((el) => (el.id === change.elementId ? change.before : el)) }));
    case "element-removed":
      return updateSlideAt(data, index, (slide) => {
        const present = new Set(slide.elements.map((el) => el.id));
        return { ...slide, elements: [...slide.elements, ...change.before.filter((el) => !present.has(el.id))] };
      });
  }
}

/**
 * Locate what a change points at, to bring it into view.
 * @param data - Current presentation data
 * @param change - Change to locate
 * @returns Slide index and element id when they still exist
 */
export function locateChange(data: PresentationData, change: AiChange): { slideIndex: number; elementId: string | null } | null {
  if (change.kind === "title" || change.kind === "slide-removed") return null;
  const slideIndex = slideIndexOf(data, change.slideId);
  if (slideIndex === -1) return null;
  const elementId = change.kind === "element-added" || change.kind === "element-updated" ? change.elementId : null;
  return { slideIndex, elementId };
}
