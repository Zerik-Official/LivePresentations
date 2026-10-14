import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import type { Tutorial } from "./tutorials";

const POPOVER_WIDTH = 320;
const POPOVER_ESTIMATED_HEIGHT = 190;
const GAP = 14;
const VIEWPORT_MARGIN = 12;
const SPOTLIGHT_PADDING = 6;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  /** Tutorial being played */
  tutorial: Tutorial;
  /** Called when the last step is completed */
  onFinish: () => void;
  /** Called when the user leaves before the end */
  onExit: () => void;
}

/**
 * Find a visible tour target.
 * @param name - `data-tour` attribute value
 * @returns Element, or null when it is missing or hidden
 */
function findTarget(name: string | undefined): HTMLElement | null {
  if (!name) return null;
  const element = document.querySelector<HTMLElement>(`[data-tour="${name}"]`);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? element : null;
}

/**
 * Place the popover beside the spotlight, preferring below, then above, then
 * to a side, and always inside the viewport.
 * @param rect - Spotlight rectangle, or null for a centered step
 * @returns Fixed position for the popover
 */
function placePopover(rect: Rect | null): { top: number; left: number } {
  const maxLeft = window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN;
  const maxTop = window.innerHeight - POPOVER_ESTIMATED_HEIGHT - VIEWPORT_MARGIN;
  const clampLeft = (left: number): number => Math.max(VIEWPORT_MARGIN, Math.min(maxLeft, left));
  const clampTop = (top: number): number => Math.max(VIEWPORT_MARGIN, Math.min(maxTop, top));
  if (!rect) return { top: clampTop((window.innerHeight - POPOVER_ESTIMATED_HEIGHT) / 2), left: clampLeft((window.innerWidth - POPOVER_WIDTH) / 2) };

  const centeredLeft = clampLeft(rect.left + rect.width / 2 - POPOVER_WIDTH / 2);
  const below = rect.top + rect.height + GAP;
  if (below <= maxTop) return { top: below, left: centeredLeft };
  const above = rect.top - GAP - POPOVER_ESTIMATED_HEIGHT;
  if (above >= VIEWPORT_MARGIN) return { top: above, left: centeredLeft };
  const centeredTop = clampTop(rect.top + rect.height / 2 - POPOVER_ESTIMATED_HEIGHT / 2);
  const right = rect.left + rect.width + GAP;
  if (right <= maxLeft) return { top: centeredTop, left: right };
  const left = rect.left - GAP - POPOVER_WIDTH;
  if (left >= VIEWPORT_MARGIN) return { top: centeredTop, left };
  return { top: clampTop(window.innerHeight - POPOVER_ESTIMATED_HEIGHT - 2 * GAP), left: centeredLeft };
}

/**
 * Guided tour player: dims the page, spotlights the target of each step and
 * shows its explanation in a popover with step navigation.
 * @param tutorial - Tutorial to play
 * @param onFinish - Completion handler
 * @param onExit - Early exit handler
 * @returns Tour overlay rendered in a portal
 */
export function TourOverlay({ tutorial, onFinish, onExit }: Props): React.ReactNode {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const step = tutorial.steps[index]!;
  const isLast = index === tutorial.steps.length - 1;

  useLayoutEffect(() => {
    if (step.open) findTarget(step.open)?.click();

    /**
     * Measure the target of the current step.
     */
    function measure(): void {
      const target = findTarget(step.target);
      if (!target) {
        setRect(null);
        return;
      }
      const box = target.getBoundingClientRect();
      setRect({ top: box.top - SPOTLIGHT_PADDING, left: box.left - SPOTLIGHT_PADDING, width: box.width + SPOTLIGHT_PADDING * 2, height: box.height + SPOTLIGHT_PADDING * 2 });
    }

    // The click above may switch a tab, so measure again once it has rendered.
    // The timer covers background tabs, where animation frames do not fire.
    measure();
    const frame = window.requestAnimationFrame(measure);
    const timer = window.setTimeout(measure, 80);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);

  useEffect(() => {
    /**
     * Keyboard navigation for the tour.
     * @param event - Keyboard event
     */
    function handleKey(event: KeyboardEvent): void {
      if (event.key === "Escape") onExit();
      else if (event.key === "ArrowRight" || event.key === "Enter") {
        if (isLast) onFinish();
        else setIndex((i) => i + 1);
      } else if (event.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      else return;
      event.preventDefault();
      event.stopPropagation();
    }
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [isLast, onExit, onFinish]);

  const position = placePopover(rect);

  return createPortal(
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`Tutorial: ${tutorial.title}`}>
      {rect ? (
        <div
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.6)" }}
          className="pointer-events-none absolute rounded-xl ring-2 ring-white transition-all duration-200"
        />
      ) : (
        <div className="absolute inset-0 bg-black/60" />
      )}
      <div style={{ top: position.top, left: position.left, width: POPOVER_WIDTH }} className="absolute rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-2xl transition-all duration-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {tutorial.title} · {index + 1} de {tutorial.steps.length}
            </p>
            <h3 className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{step.title}</h3>
          </div>
          <button type="button" onClick={onExit} aria-label="Salir del tutorial" className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <FiX size={14} />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1" aria-hidden="true">
            {tutorial.steps.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-zinc-900 dark:bg-white" : "w-1.5 bg-zinc-300 dark:bg-zinc-600"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {index > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setIndex(index - 1)}>
                Atrás
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={() => (isLast ? onFinish() : setIndex(index + 1))}>
              {isLast ? "Terminar" : "Siguiente"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
