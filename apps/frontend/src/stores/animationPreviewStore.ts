import { create } from "zustand";

import type { AnimationRun } from "@/lib/animations/playback";

interface AnimationPreviewState {
  /** Animation being previewed on the editor canvas */
  run: AnimationRun | null;
  /** Play an animation of an element on the canvas for a while, then restore it */
  preview: (elementId: string, animationId: string, playMs: number) => void;
  /** Stop the preview */
  clear: () => void;
}

/**
 * Animation preview shared by the properties panel, which starts it, and the
 * canvas, which plays it.
 */
export const useAnimationPreview = create<AnimationPreviewState>((set, get) => ({
  run: null,
  preview: (elementId, animationId, playMs) => {
    const run = { elementId, animationId, nonce: Date.now() };
    set({ run });
    // Exits end hidden and loops never end: put the element back afterwards.
    window.setTimeout(() => {
      if (get().run === run) set({ run: null });
    }, playMs + 400);
  },
  clear: () => set({ run: null }),
}));
