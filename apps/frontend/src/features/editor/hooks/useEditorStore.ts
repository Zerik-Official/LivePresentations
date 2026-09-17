import { create } from "zustand";

import type { PresentationData, SlideElement } from "@/types/presentation";

interface EditorState {
  data: PresentationData | null;
  title: string;
  activeSlide: number;
  selectedId: string | null;
  setData: (data: PresentationData) => void;
  setTitle: (title: string) => void;
  setActiveSlide: (idx: number) => void;
  setSelectedId: (id: string | null) => void;
  patchSelected: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
}

/**
 * Global editor state for the current presentation.
 */
export const useEditorStore = create<EditorState>((set, get) => ({
  data: null,
  title: "",
  activeSlide: 0,
  selectedId: null,

  setData: (data) => set({ data }),
  setTitle: (title) => set({ title }),
  setActiveSlide: (idx) => set({ activeSlide: idx, selectedId: null }),
  setSelectedId: (id) => set({ selectedId: id }),

  /**
   * Patch props of the selected element.
   * @param patch - Partial element plus propsPatch for nested props
   */
  patchSelected: (patch) => {
    const { data, activeSlide, selectedId } = get();
    if (!data || selectedId === null) return;
    const slide = data.slides[activeSlide];
    if (!slide) return;
    const elements = slide.elements.map((el) => {
      if (el.id !== selectedId) return el;
      const next: SlideElement = { ...el, ...patch } as SlideElement;
      if (patch.propsPatch) next.props = { ...el.props, ...patch.propsPatch };
      delete (next as unknown as { propsPatch?: unknown }).propsPatch;
      return next;
    });
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements };
    set({ data: { ...data, slides } });
  },
}));
