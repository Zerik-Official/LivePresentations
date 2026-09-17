import type { DragEndEvent } from "@dnd-kit/core";
import type { PresentationData, SlideElement } from "@/types/presentation";
import { createDefaultElement } from "@/types/presentation";

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
  deleteSelected: () => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleResize: (elemId: string, w: number, h: number) => void;
  handleReorder: (elemId: string, dir: 1 | -1) => void;
  handleSortLayer: (activeId: string, overId: string) => void;
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
   * Delete selected element.
   */
  function deleteSelected(): void {
    if (!data || !selectedId) return;
    const slide = data.slides[activeSlide];
    if (!slide) return;
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements: slide.elements.filter((e) => e.id !== selectedId) };
    setData({ ...data, slides });
    setSelectedId(null);
  }

  /**
   * Handle drag end for @dnd-kit.
   * @param event - Drag end event
   */
  function handleDragEnd(event: DragEndEvent): void {
    const { active, delta } = event;
    if (!data || !delta) return;
    const slide = data.slides[activeSlide];
    if (!slide) return;
    const elements = slide.elements.map((el) => (el.id === active.id ? { ...el, x: Math.round(el.x + delta.x), y: Math.round(el.y + delta.y) } : el));
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

  return { addElement, patchSelected, deleteSelected, handleDragEnd, handleResize, handleReorder, handleSortLayer };
}