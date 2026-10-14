import { getDescendantIds } from "@/lib/presentation/hierarchy";
import type { Slide, SlideElement } from "@/types/presentation";
import type { ElementAnimation } from "./effects";

/**
 * Animation started on an element from the controller.
 */
export interface AnimationRun {
  /** Element whose animation was triggered */
  elementId: string;
  animationId: string;
  /** Changes on every trigger so the same animation can replay */
  nonce: number;
}

/**
 * What an element should render right now.
 */
export interface ElementPlayback {
  /** Animation to apply, if any */
  animation: ElementAnimation | null;
  /** Key that restarts the CSS animation when it changes */
  runKey: string;
  /** Keep the element invisible: it waits for a controller-triggered entrance */
  hidden: boolean;
}

/**
 * Read the animations of an element.
 * @param element - Slide element
 * @returns Its animations, empty when it has none
 */
export function animationsOf(element: SlideElement): ElementAnimation[] {
  return element.animations ?? [];
}

/**
 * Resolve the animation state of every element of a slide.
 * A controller run applies to its element and, when the animation includes
 * children, to every descendant. Elements with a controller-triggered
 * animation marked `startHidden` stay hidden until it runs.
 * @param slide - Slide being shown
 * @param runs - Controller runs since the slide appeared, keyed by element id
 * @returns Playback state by element id
 */
export function resolvePlayback(slide: Slide, runs: Record<string, AnimationRun>): Map<string, ElementPlayback> {
  const byElement = new Map<string, { animation: ElementAnimation; run: AnimationRun }>();
  for (const run of Object.values(runs)) {
    const source = slide.elements.find((el) => el.id === run.elementId);
    const animation = source ? animationsOf(source).find((a) => a.id === run.animationId) : undefined;
    if (!source || !animation) continue;
    const targets = animation.includeChildren ? [source.id, ...getDescendantIds(slide.elements, source.id)] : [source.id];
    for (const id of targets) {
      const current = byElement.get(id);
      if (!current || current.run.nonce < run.nonce) byElement.set(id, { animation, run });
    }
  }

  const playback = new Map<string, ElementPlayback>();
  for (const element of slide.elements) {
    const triggered = byElement.get(element.id);
    if (triggered) {
      playback.set(element.id, { animation: triggered.animation, runKey: `${triggered.run.animationId}-${triggered.run.nonce}`, hidden: false });
      continue;
    }
    const own = animationsOf(element);
    const inherited = slide.elements
      .filter((el) => el.id !== element.id && getDescendantIds(slide.elements, el.id).includes(element.id))
      .flatMap((ancestor) => animationsOf(ancestor).filter((a) => a.includeChildren));
    const entrance = [...own, ...inherited].find((a) => a.trigger === "enter");
    const waiting = [...own, ...inherited].some((a) => a.trigger === "controller" && a.startHidden);
    playback.set(element.id, { animation: entrance ?? null, runKey: entrance ? `enter-${entrance.id}` : "static", hidden: !entrance && waiting });
  }
  return playback;
}

/**
 * Controller-triggered animations of a slide, in presentation order.
 * @param slide - Slide being shown
 * @returns Element and animation pairs, back to front then by list order
 */
export function controllerAnimations(slide: Slide): Array<{ element: SlideElement; animation: ElementAnimation }> {
  return slide.elements
    .slice()
    .sort((a, b) => a.zIndex - b.zIndex)
    .flatMap((element) => animationsOf(element).filter((a) => a.trigger === "controller").map((animation) => ({ element, animation })));
}

/**
 * Find the next controller animation that has not run yet on this slide.
 * @param slide - Slide being shown
 * @param played - Ids of the animations already triggered
 * @returns Next animation, or null when all have run
 */
export function nextControllerAnimation(slide: Slide, played: Set<string>): { element: SlideElement; animation: ElementAnimation } | null {
  return controllerAnimations(slide).find(({ animation }) => !played.has(animation.id)) ?? null;
}
