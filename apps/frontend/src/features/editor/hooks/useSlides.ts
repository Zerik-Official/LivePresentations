import type { PresentationData, Slide } from "../../../types/presentation";
import { createEmptySlide } from "../../../types/presentation";

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

  return { addSlide, deleteSlide, duplicateSlide, updateBackground, updateTransition };
}