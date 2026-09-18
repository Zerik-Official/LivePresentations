import type { PresentationData, Slide } from "@/types/presentation";
import { createEmptySlide } from "@/types/presentation";

/**
 * Slide operations derived from editor data.
 * @param data - Presentation data
 * @param setData - Data setter
 * @param activeSlide - Active slide index
 * @param setActiveSlide - Active slide setter
 * @param setSelectedId - Selected element setter
 */
export function useSlides(
  data: PresentationData | null,
  setData: (d: PresentationData) => void,
  activeSlide: number,
  setActiveSlide: (idx: number) => void,
  setSelectedId: (id: string | null) => void,
): {
  addSlide: () => void;
  deleteSlide: (idx: number) => void;
  duplicateSlide: (idx: number) => void;
  updateBackground: (color: string) => void;
  updateTransition: (transition: Slide["transition"]) => void;
  reorderSlides: (activeId: string, overId: string) => void;
  updateSlide: (idx: number, nextSlide: Slide) => boolean;
} {
  /**
   * Add a new slide.
   */
  function addSlide(): void {
    if (!data) return;
    const s = createEmptySlide(`slide-${Date.now()}`);
    setData({ ...data, slides: [...data.slides, s] });
    setActiveSlide(data.slides.length);
  }

  /**
   * Delete a slide by index.
   * @param idx - Slide index
   */
  function deleteSlide(idx: number): void {
    if (!data) return;
    const slides = data.slides.filter((_, i) => i !== idx);
    setData({ ...data, slides });
    setActiveSlide(Math.max(0, Math.min(activeSlide, slides.length - 1)));
    setSelectedId(null);
  }

  /**
   * Duplicate a slide.
   * @param idx - Slide index
   */
  function duplicateSlide(idx: number): void {
    if (!data) return;
    const src = data.slides[idx];
    if (!src) return;
    const copy: Slide = {
      ...src,
      id: `slide-${Date.now()}`,
      elements: src.elements.map((e) => ({ ...e, id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
    };
    const slides = [...data.slides];
    slides.splice(idx + 1, 0, copy);
    setData({ ...data, slides });
  }

  /**
   * Update active slide background.
   * @param color - CSS color
   */
  function updateBackground(color: string): void {
    if (!data) return;
    const slide = data.slides[activeSlide];
    if (!slide) return;
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, background: color };
    setData({ ...data, slides });
  }

  /**
   * Update active slide transition.
   * @param transition - Transition type
   */
  function updateTransition(transition: Slide["transition"]): void {
    if (!data) return;
    const slide = data.slides[activeSlide];
    if (!slide) return;
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, transition };
    setData({ ...data, slides });
  }

  /**
   * Reorder slides via drag and drop.
   * @param activeId - Dragged slide id
   * @param overId - Target slide id
   */
  function reorderSlides(activeId: string, overId: string): void {
    if (!data) return;
    const oldIndex = data.slides.findIndex((s) => s.id === activeId);
    const newIndex = data.slides.findIndex((s) => s.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    const slides = [...data.slides];
    const [moved] = slides.splice(oldIndex, 1);
    if (!moved) return;
    slides.splice(newIndex, 0, moved);
    const activeIdValue = data.slides[activeSlide]?.id;
    let nextActive = activeSlide;
    if (activeIdValue) {
      const relocated = slides.findIndex((s) => s.id === activeIdValue);
      if (relocated !== -1) nextActive = relocated;
    }
    setData({ ...data, slides });
    setActiveSlide(nextActive);
  }

  /**
   * Replace a whole slide from JSON editor.
   * @param idx - Slide index
   * @param nextSlide - New slide data
   * @returns True if updated
   */
  function updateSlide(idx: number, nextSlide: Slide): boolean {
    if (!data) return false;
    if (idx < 0 || idx >= data.slides.length) return false;
    const slides = [...data.slides];
    slides[idx] = nextSlide;
    setData({ ...data, slides });
    return true;
  }

  return { addSlide, deleteSlide, duplicateSlide, updateBackground, updateTransition, reorderSlides, updateSlide };
}