import type { DragEndEvent } from "@dnd-kit/core";
import type { PresentationData, SlideElement } from "@/types/presentation";
import { canLink, createDefaultElement, getDescendantIds } from "@/types/presentation";

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
  deleteSelected: () => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleResize: (elemId: string, w: number, h: number) => void;
  handleReorder: (elemId: string, dir: 1 | -1) => void;
  handleSortLayer: (activeId: string, overId: string) => void;
  setParent: (childId: string, parentId: string | null) => boolean;
  unlinkElement: (childId: string) => void;
  duplicateWithChildren: (rootId: string) => void;
} {
  /**
   * Add element to current slide.
   * @param type - Element type
   */
  function addElement(type: SlideElement["type"]): void {
    if (!data) return;
    const slide = data.slides[activeSlide];
    if (!slide) return;
    const el = createDefaultElement(type, `el-${Date.now()}`);
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements: [...slide.elements, el] };
    setData({ ...data, slides });
    setSelectedId(el.id);
  }

  /**
   * Patch selected element.
   * @param patch - Patch with optional propsPatch
   */
  function patchSelected(patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }): void {
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
  }

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
   */
  function handleDragEnd(event: DragEndEvent): void {
    const { active, delta } = event;
    if (!data || !delta) return;
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
    const descendantIds = getDescendantIds(slide.elements, rootId);
    const subtree = slide.elements.filter((e) => e.id === rootId || descendantIds.includes(e.id));
    const idMap = new Map<string, string>();
    for (const el of subtree) idMap.set(el.id, `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const clones: SlideElement[] = subtree.map((el) => {
      const newId = idMap.get(el.id)!;
      const newParentId = el.parentId ? (idMap.get(el.parentId) ?? null) : null;
      return { ...el, id: newId, parentId: newParentId, x: el.x + 20, y: el.y + 20, zIndex: slide.elements.length + 1 };
    });
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements: [...slide.elements, ...clones] };
    setData({ ...data, slides });
    const newRootId = idMap.get(rootId);
    if (newRootId) setSelectedId(newRootId);
  }

  return { addElement, patchSelected, patchSelectedId, replaceSelected, deleteSelected, handleDragEnd, handleResize, handleReorder, handleSortLayer, setParent, unlinkElement, duplicateWithChildren };
}