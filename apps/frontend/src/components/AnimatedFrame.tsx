import { useMemo } from "react";

import { animationCss, builtInKeyframesCss, customKeyframesCss, type ElementAnimation } from "@/lib/animations/effects";

const BUILT_IN_CSS = builtInKeyframesCss();

/**
 * Style sheet with the keyframes of every built-in effect.
 * Render it once near the root of any view that plays animations.
 * @returns Style element
 */
export function AnimationStyles(): React.ReactNode {
  return <style>{BUILT_IN_CSS}</style>;
}

interface Props {
  /** Animation to play, or null for none */
  animation: ElementAnimation | null;
  /** Restarts the animation when it changes */
  runKey: string;
  /** Keep the content invisible until an entrance is triggered */
  hidden?: boolean;
  children: React.ReactNode;
}

/**
 * Full-size wrapper that plays an element animation on its content.
 * It sits inside the element box, so the element's own position and
 * rotation are untouched by the animated transform.
 * @param animation - Animation to play
 * @param runKey - Replay key
 * @param hidden - Hide until triggered
 * @param children - Element content
 * @returns Animated wrapper
 */
export function AnimatedFrame({ animation, runKey, hidden = false, children }: Props): React.ReactNode {
  const customCss = useMemo(() => (animation?.effect === "custom" ? customKeyframesCss(animation) : ""), [animation]);
  const style: React.CSSProperties = hidden ? { opacity: 0 } : { animation: animation ? animationCss(animation) : undefined };
  return (
    <div key={runKey} style={style} className="h-full w-full">
      {customCss && <style>{customCss}</style>}
      {children}
    </div>
  );
}
