import { FiCheck, FiPlay, FiSkipForward } from "react-icons/fi";

import { effectKind } from "@/lib/animations/effects";
import { controllerAnimations, nextControllerAnimation, type AnimationRun } from "@/lib/animations/playback";
import type { Slide } from "@/types/presentation";

const KIND_LABELS = { in: "Entrada", out: "Salida", emphasis: "Énfasis", custom: "Personalizada" } as const;

interface Props {
  /** Slide being presented */
  slide: Slide;
  /** Animations already triggered on this slide, keyed by animation id */
  runs: Record<string, AnimationRun>;
  /** Trigger an animation on every screen */
  onTrigger: (elementId: string, animationId: string) => void;
}

/**
 * Controller panel to play the slide's controller-triggered animations,
 * either one by one in order or individually.
 * @param slide - Current slide
 * @param runs - Animations already played
 * @param onTrigger - Trigger handler
 * @returns Animation controls, or null when the slide has none
 */
export function AnimationControls({ slide, runs, onTrigger }: Props): React.ReactNode {
  const items = controllerAnimations(slide);
  if (items.length === 0) return null;
  const played = new Set(Object.keys(runs));
  const next = nextControllerAnimation(slide, played);

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Animaciones</h2>
      <button
        type="button"
        disabled={!next}
        onClick={() => next && onTrigger(next.element.id, next.animation.id)}
        className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white py-3 text-sm font-medium text-white dark:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FiSkipForward /> {next ? `Siguiente: ${next.animation.name}` : "Todas reproducidas"}
      </button>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map(({ element, animation }) => {
          const done = played.has(animation.id);
          return (
            <li key={animation.id}>
              <button
                type="button"
                onClick={() => onTrigger(element.id, animation.id)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-left text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {done ? <FiCheck className="shrink-0 text-emerald-600 dark:text-emerald-400" /> : <FiPlay className="shrink-0" />}
                <span className="min-w-0 flex-1 truncate font-medium">{animation.name}</span>
                <span className="shrink-0 text-[10px] text-zinc-500 dark:text-zinc-400">
                  {KIND_LABELS[effectKind(animation)]} · {element.type}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
