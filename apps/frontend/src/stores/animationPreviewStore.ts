import { create } from "zustand";

import type { ElementAnimation } from "@/lib/animations/effects";

/**
 * Animation playing on the editor canvas.
 */
export interface AnimationPreview {
  animation: ElementAnimation;
  /** Elements that play it: the owner and, if included, its linked children */
  targets: string[];
  /** Changes on every preview so the same animation can replay */
  nonce: number;
}

interface AnimationPreviewState {
  /** Animation being previewed on the editor canvas */
  run: AnimationPreview | null;
  /** Play an animation on some elements for a while, then restore them */
  preview: (animation: ElementAnimation, targets: string[], playMs: number) => void;
  /** Stop the preview */
  clear: () => void;
}

/**
 * Animation preview shared by the properties panel, which starts it, and the
 * canvas, which plays it.
 */
export const useAnimationPreview = create<AnimationPreviewState>((set, get) => ({
  run: null,
  preview: (animation, targets, playMs) => {
    const run = { animation, targets, nonce: Date.now() };
    set({ run });
    // Exits end hidden and loops never end: put the element back afterwards.
    window.setTimeout(() => {
      if (get().run === run) set({ run: null });
    }, playMs + 400);
  },
  clear: () => set({ run: null }),
}));
