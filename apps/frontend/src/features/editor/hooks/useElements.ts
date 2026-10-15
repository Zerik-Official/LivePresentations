import { useCallback } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { createDefaultElement } from "@/lib/presentation/factory";
import { canLink, getDescendantIds } from "@/lib/presentation/hierarchy";
import { alignElement, cloneSubtree, createId, insertElements, moveElement, nextZIndex, setElementLayer, type AlignMode } from "@/lib/presentation/operations";
import type { PresentationData, SlideElement } from "@/types/presentation";

/**
 * Element operations for the active slide.
 * @param data - Presentation data
 * @param setData - Data setter
 * @param activeSlide - Active slide index
 * @param selectedId - Selected element id
 * @param setSelectedId - Selected setter
 */
export function useElements(
  data: PresentationData | null,
  setData: (d: PresentationData) => void,
  activeSlide: number,
  selectedId: string | null,
  setSelectedId: (id: string | null) => void,
): {
  addElement: (type: SlideElement["type"]) => void;
  patchSelected: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
  patchSelectedId: (newId: string) => boolean;
  replaceSelected: (next: SlideElement) => boolean;
  replaceSubtree: (next: { element: SlideElement; children: SlideElement[] }) => boolean;
  deleteSelected: () => void;
  handleDragEnd: (event: DragEndEvent, scale?: number) => void;
  handleResize: (elemId: string, w: number, h: number) => void;
  handleReorder: (elemId: string, dir: 1 | -1) => void;
  handleSortLayer: (activeId: string, overId: string) => void;
  setParent: (childId: string, parentId: string | null) => boolean;
  unlinkElement: (childId: string) => void;
  duplicateWithChildren: (rootId: string) => void;
  addElements: (elements: SlideElement[]) => void;
  nudgeSelected: (dx: number, dy: number) => void;
  alignSelected: (mode: AlignMode) => void;
  layerSelected: (position: "front" | "back") => void;
} {
  /**
   * Add element to current slide.
   * @param type - Element type
   */
  function addElement(type: SlideElement["type"]): void {
    if (!data) return;
    const slide = data.slides[activeSlide];
    if (!slide) return;
    const el = { ...createDefaultElement(type, createId("el")), zIndex: nextZIndex(slide) };
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements: [...slide.elements, el] };
    setData({ ...data, slides });
    setSelectedId(el.id);
  }

  /**
   * Patch selected element.
   * @param patch - Patch with optional propsPatch
   */
  const patchSelected = useCallback((patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }): void => {
    if (!data || !selectedId) return;
    const slide = data.slides[activeSlide];
    if (!slide) return;
    const elements = slide.elements.map((e) => {
      if (e.id !== selectedId) return e;
      const next = { ...e, ...patch } as SlideElement;
      if (patch.propsPatch) next.props = { ...e.props, ...patch.propsPatch };
      delete (next as unknown as { propsPatch?: unknown }).propsPatch;
      return next;
    });
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements };
    setData({ ...data, slides });
  }, [data, activeSlide, selectedId, setData]);

  /**
   * Patch selected element id.
   * @param newId - New id
   * @returns True if updated
   */
  function patchSelectedId(newId: string): boolean {
    if (!data || !selectedId) return false;
    const trimmed = newId.trim();
    if (!trimmed || trimmed === selectedId) return false;
    const slide = data.slides[activeSlide];
    if (!slide) return false;
    if (slide.elements.some((e) => e.id === trimmed)) return false;
    const elements = slide.elements.map((e) => {
      if (e.id === selectedId) return { ...e, id: trimmed };
      if (e.parentId === selectedId) return { ...e, parentId: trimmed };
      return e;
    });
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements };
    setData({ ...data, slides });
    setSelectedId(trimmed);
    return true;
  }

  /**
   * Replace selected element entirely (for JSON editing).
   * @param next - Next element value
   * @returns True if replaced
   */
  function replaceSelected(next: SlideElement): boolean {
    if (!data || !selectedId) return false;
    const slide = data.slides[activeSlide];
    if (!slide) return false;
    if (next.id !== selectedId && slide.elements.some((e) => e.id === next.id)) return false;
    const elements = slide.elements.map((e) => (e.id === selectedId ? next : e.parentId === selectedId && next.id !== selectedId ? { ...e, parentId: next.id } : e));
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements };
    setData({ ...data, slides });
    if (next.id !== selectedId) setSelectedId(next.id);
    return true;
  }

  /**
   * Replace selected element and its children from a wrapper object.
   * @param next - Wrapper with element and children
   * @returns True if replaced
   */
  function replaceSubtree(next: { element: SlideElement; children: SlideElement[] }): boolean {
    if (!data || !selectedId) return false;
    const slide = data.slides[activeSlide];
    if (!slide) return false;
    const newElement = next.element;
    const newChildren = next.children ?? [];
    const oldDescendantIds = new Set(getDescendantIds(slide.elements, selectedId));
    const remaining = slide.elements.filter((e) => e.id !== selectedId && !oldDescendantIds.has(e.id));
    const remainingIds = new Set(remaining.map((e) => e.id));
    if (newElement.id !== selectedId && remainingIds.has(newElement.id)) return false;
    for (const child of newChildren) {
      if (child.id === newElement.id) return false;
      if (remainingIds.has(child.id)) return false;
    }
    const seen = new Set<string>([newElement.id]);
    for (const child of newChildren) {
      if (seen.has(child.id)) return false;
      seen.add(child.id);
    }
    const oldWrapperId = newElement.id;
    const normalizedChildren = newChildren.map((c) => {
      if (c.parentId === oldWrapperId || !c.parentId) return c;
      const parentInSubtree = newChildren.some((x) => x.id === c.parentId) || c.parentId === newElement.id;
      return parentInSubtree ? c : { ...c, parentId: newElement.id };
    });
    const nextElements = [...remaining, newElement, ...normalizedChildren];
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements: nextElements };
    setData({ ...data, slides });
    if (newElement.id !== selectedId) setSelectedId(newElement.id);
    return true;
  }

  /**
   * Delete selected element and its descendants.
   */
  function deleteSelected(): void {
    if (!data || !selectedId) return;
    const slide = data.slides[activeSlide];
    if (!slide) return;
    const toDelete = new Set([selectedId, ...getDescendantIds(slide.elements, selectedId)]);
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements: slide.elements.filter((e) => !toDelete.has(e.id)) };
    setData({ ...data, slides });
    setSelectedId(null);
  }

  /**
   * Handle drag end for @dnd-kit, propagating delta to descendants.
   * @param event - Drag end event
   * @param scale - Canvas zoom, to convert screen pixels to slide pixels
   */
  function handleDragEnd(event: DragEndEvent, scale = 1): void {
    const { active } = event;
    if (!data || !event.delta) return;
    const delta = { x: event.delta.x / scale, y: event.delta.y / scale };
    const slide = data.slides[activeSlide];
    if (!slide) return;
    const activeId = String(active.id);
    const descendantIds = new Set(getDescendantIds(slide.elements, activeId));
    const elements = slide.elements.map((el) => {
      if (el.id === activeId) return { ...el, x: Math.round(el.x + delta.x), y: Math.round(el.y + delta.y) };
      if (descendantIds.has(el.id)) return { ...el, x: Math.round(el.x + delta.x), y: Math.round(el.y + delta.y) };
      return el;
    });
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements };
    setData({ ...data, slides });
  }

  /**
   * Handle resize from handles.
   * @param elemId - Element id
   * @param w - New width
   * @param h - New height
   */
  function handleResize(elemId: string, w: number, h: number): void {
    if (!data) return;
    const slide = data.slides[activeSlide];
    if (!slide) return;
    const elements = slide.elements.map((el) => (el.id === elemId ? { ...el, w, h } : el));
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements };
    setData({ ...data, slides });
  }

  /**
   * Reorder zIndex by one step.
   * @param elemId - Element id
   * @param dir - Direction
   */
  function handleReorder(elemId: string, dir: 1 | -1): void {
    if (!data) return;
    const slide = data.slides[activeSlide];
    if (!slide) return;
    const elements = [...slide.elements];
    const idx = elements.findIndex((e) => e.id === elemId);
    if (idx === -1) return;
    const target = idx + dir;
    if (target < 0 || target >= elements.length) return;
    const [moved] = elements.splice(idx, 1);
    if (!moved) return;
    elements.splice(target, 0, moved);
    const withZ = elements.map((e, i) => ({ ...e, zIndex: i }));
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements: withZ };
    setData({ ...data, slides });
  }

  /**
   * Handle full drag sort for layers.
   * @param activeId - Active element id
   * @param overId - Over element id
   */
  function handleSortLayer(activeId: string, overId: string): void {
    if (!data) return;
    const slide = data.slides[activeSlide];
    if (!slide) return;
    const elements = [...slide.elements];
    const oldIndex = elements.findIndex((e) => e.id === activeId);
    const newIndex = elements.findIndex((e) => e.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const [moved] = elements.splice(oldIndex, 1);
    if (!moved) return;
    elements.splice(newIndex, 0, moved);
    const withZ = elements.map((e, i) => ({ ...e, zIndex: i }));
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements: withZ };
    setData({ ...data, slides });
  }

  /**
   * Link child to parent with cycle guard.
   * @param childId - Child id
   * @param parentId - Parent id or null to unlink
   * @returns True if linked
   */
  function setParent(childId: string, parentId: string | null): boolean {
    if (!data) return false;
    const slide = data.slides[activeSlide];
    if (!slide) return false;
    if (!canLink(slide.elements, childId, parentId)) return false;
    const elements = slide.elements.map((e) => (e.id === childId ? { ...e, parentId: parentId ?? null } : e));
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements };
    setData({ ...data, slides });
    return true;
  }

  /**
   * Unlink element from its parent.
   * @param childId - Child id
   */
  function unlinkElement(childId: string): void {
    void setParent(childId, null);
  }

  /**
   * Duplicate element with its whole subtree.
   * @param rootId - Root element id
   */
  function duplicateWithChildren(rootId: string): void {
    if (!data) return;
    const slide = data.slides[activeSlide];
    if (!slide) return;
    const root = slide.elements.find((e) => e.id === rootId);
    if (!root) return;
    addElements(cloneSubtree(slide.elements, rootId));
  }

  /**
   * Add ready-made elements to the active slide and select the first one.
   * @param elements - Elements to add, root first
   */
  function addElements(elements: SlideElement[]): void {
    if (!data || elements.length === 0) return;
    setData(insertElements(data, activeSlide, elements));
    setSelectedId(elements[0]!.id);
  }

  /**
   * Move the selected element and its children.
   * @param dx - Horizontal offset in slide pixels
   * @param dy - Vertical offset in slide pixels
   */
  function nudgeSelected(dx: number, dy: number): void {
    if (!data || !selectedId) return;
    setData(moveElement(data, activeSlide, selectedId, dx, dy));
  }

  /**
   * Align the selected element against the canvas.
   * @param mode - Alignment
   */
  function alignSelected(mode: AlignMode): void {
    if (!data || !selectedId) return;
    setData(alignElement(data, activeSlide, selectedId, mode));
  }

  /**
   * Send the selected element to the front or the back.
   * @param position - Target layer
   */
  function layerSelected(position: "front" | "back"): void {
    if (!data || !selectedId) return;
    setData(setElementLayer(data, activeSlide, selectedId, position));
  }

  return { addElements, nudgeSelected, alignSelected, layerSelected, addElement, patchSelected, patchSelectedId, replaceSelected, replaceSubtree, deleteSelected, handleDragEnd, handleResize, handleReorder, handleSortLayer, setParent, unlinkElement, duplicateWithChildren };
}