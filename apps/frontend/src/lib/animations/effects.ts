/**
 * Element animation model and the built-in effect catalog.
 * Effects are plain CSS keyframes, so the editor, the presenter and public
 * viewers render them identically without any animation library.
 */

/** When an animation plays. */
export type AnimationTrigger = "enter" | "controller";

/** Timing curve of an animation; `spring` overshoots slightly. */
export type AnimationEasing = "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear" | "spring";

/** Role of an effect: reveals, hides or draws attention to an element. */
export type EffectKind = "in" | "out" | "emphasis" | "custom";

/**
 * Animation attached to a slide element.
 */
export interface ElementAnimation {
  id: string;
  /** Label shown on the controller */
  name: string;
  /** Built-in effect key, or `custom` to use `keyframes` */
  effect: string;
  trigger: AnimationTrigger;
  durationMs: number;
  delayMs: number;
  easing: AnimationEasing;
  /** Repetitions; 0 means forever */
  iterations: number;
  /** Also animate the elements linked as children */
  includeChildren: boolean;
  /** Body of a CSS @keyframes rule, used by the `custom` effect */
  keyframes?: string;
}

/**
 * Built-in effect.
 */
export interface EffectDefinition {
  label: string;
  kind: Exclude<EffectKind, "custom">;
  /** Body of the @keyframes rule */
  keyframes: string;
  /** Suggested duration in milliseconds */
  durationMs: number;
}

/** Every built-in effect, keyed by its stored name. */
export const EFFECTS: Record<string, EffectDefinition> = {
  fadeIn: { label: "Aparecer", kind: "in", durationMs: 500, keyframes: "from { opacity: 0 } to { opacity: 1 }" },
  slideInLeft: { label: "Entrar desde la izquierda", kind: "in", durationMs: 600, keyframes: "from { opacity: 0; transform: translateX(-60px) } to { opacity: 1; transform: none }" },
  slideInRight: { label: "Entrar desde la derecha", kind: "in", durationMs: 600, keyframes: "from { opacity: 0; transform: translateX(60px) } to { opacity: 1; transform: none }" },
  slideInUp: { label: "Entrar desde abajo", kind: "in", durationMs: 600, keyframes: "from { opacity: 0; transform: translateY(50px) } to { opacity: 1; transform: none }" },
  slideInDown: { label: "Entrar desde arriba", kind: "in", durationMs: 600, keyframes: "from { opacity: 0; transform: translateY(-50px) } to { opacity: 1; transform: none }" },
  zoomIn: { label: "Acercar", kind: "in", durationMs: 500, keyframes: "from { opacity: 0; transform: scale(0.6) } to { opacity: 1; transform: none }" },
  popIn: { label: "Rebote al aparecer", kind: "in", durationMs: 600, keyframes: "0% { opacity: 0; transform: scale(0.5) } 60% { opacity: 1; transform: scale(1.08) } 80% { transform: scale(0.97) } 100% { opacity: 1; transform: none }" },
  flipIn: { label: "Girar en 3D", kind: "in", durationMs: 700, keyframes: "from { opacity: 0; transform: perspective(800px) rotateX(80deg) } to { opacity: 1; transform: perspective(800px) rotateX(0) }" },
  rotateIn: { label: "Girar al aparecer", kind: "in", durationMs: 700, keyframes: "from { opacity: 0; transform: rotate(-180deg) scale(0.6) } to { opacity: 1; transform: none }" },
  blurIn: { label: "Enfocar", kind: "in", durationMs: 700, keyframes: "from { opacity: 0; filter: blur(16px) } to { opacity: 1; filter: blur(0) }" },
  fadeOut: { label: "Desvanecer", kind: "out", durationMs: 500, keyframes: "from { opacity: 1 } to { opacity: 0 }" },
  slideOutLeft: { label: "Salir por la izquierda", kind: "out", durationMs: 600, keyframes: "from { opacity: 1; transform: none } to { opacity: 0; transform: translateX(-60px) }" },
  slideOutRight: { label: "Salir por la derecha", kind: "out", durationMs: 600, keyframes: "from { opacity: 1; transform: none } to { opacity: 0; transform: translateX(60px) }" },
  zoomOut: { label: "Alejar", kind: "out", durationMs: 500, keyframes: "from { opacity: 1; transform: none } to { opacity: 0; transform: scale(0.6) }" },
  blurOut: { label: "Desenfocar", kind: "out", durationMs: 700, keyframes: "from { opacity: 1; filter: blur(0) } to { opacity: 0; filter: blur(16px) }" },
  pulse: { label: "Pulso", kind: "emphasis", durationMs: 700, keyframes: "0%, 100% { transform: none } 50% { transform: scale(1.08) }" },
  bounce: { label: "Botar", kind: "emphasis", durationMs: 800, keyframes: "0%, 20%, 50%, 80%, 100% { transform: none } 40% { transform: translateY(-24px) } 60% { transform: translateY(-12px) }" },
  shake: { label: "Sacudir", kind: "emphasis", durationMs: 600, keyframes: "0%, 100% { transform: none } 20%, 60% { transform: translateX(-10px) } 40%, 80% { transform: translateX(10px) }" },
  wiggle: { label: "Balancear", kind: "emphasis", durationMs: 700, keyframes: "0%, 100% { transform: none } 25% { transform: rotate(-6deg) } 75% { transform: rotate(6deg) }" },
  spin: { label: "Girar", kind: "emphasis", durationMs: 900, keyframes: "from { transform: rotate(0) } to { transform: rotate(360deg) }" },
  float: { label: "Flotar", kind: "emphasis", durationMs: 2000, keyframes: "0%, 100% { transform: none } 50% { transform: translateY(-12px) }" },
  heartbeat: { label: "Latido", kind: "emphasis", durationMs: 1000, keyframes: "0%, 40%, 100% { transform: none } 15% { transform: scale(1.12) } 30% { transform: scale(1.04) }" },
  flash: { label: "Destello", kind: "emphasis", durationMs: 800, keyframes: "0%, 50%, 100% { opacity: 1 } 25%, 75% { opacity: 0.2 }" },
};

/** CSS curves of each easing option. */
export const EASINGS: Record<AnimationEasing, string> = {
  ease: "ease",
  "ease-in": "ease-in",
  "ease-out": "ease-out",
  "ease-in-out": "ease-in-out",
  linear: "linear",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
};

/**
 * Tell what an animation does to its element.
 * @param animation - Animation to classify
 * @returns Effect kind, `custom` for user keyframes
 */
export function effectKind(animation: Pick<ElementAnimation, "effect">): EffectKind {
  return EFFECTS[animation.effect]?.kind ?? "custom";
}

/**
 * Remove comments and reject anything that is not plain keyframe blocks.
 * The result is injected into a `<style>` element that every viewer of a
 * public room loads, so at-rules, `url()` and stray braces are refused:
 * they could load remote content or escape the @keyframes rule.
 * @param source - Body of a @keyframes rule written by a user or the assistant
 * @returns Normalized keyframes, or null when the text is not acceptable
 */
export function sanitizeKeyframes(source: string): string | null {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, "").trim();
  if (!text || text.length > 4000) return null;
  if (/[@<>\\]|url\s*\(|expression\s*\(|image-set|javascript:/i.test(text)) return null;
  const block = /\s*((?:from|to|\d{1,3}(?:\.\d+)?%)(?:\s*,\s*(?:from|to|\d{1,3}(?:\.\d+)?%))*)\s*\{([^{}]*)\}\s*/y;
  const parts: string[] = [];
  let index = 0;
  while (index < text.length) {
    block.lastIndex = index;
    const match = block.exec(text);
    if (!match) return null;
    parts.push(`${match[1]} { ${match[2]!.trim()} }`);
    index = block.lastIndex;
  }
  return parts.join(" ");
}

/**
 * Stable short hash, used to name custom @keyframes rules.
 * @param text - Text to hash
 * @returns Base-36 hash
 */
export function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
}

/**
 * Name of the @keyframes rule an animation uses.
 * @param animation - Animation
 * @returns Rule name, or null when a custom animation has invalid keyframes
 */
export function keyframesName(animation: ElementAnimation): string | null {
  if (EFFECTS[animation.effect]) return `lp-${animation.effect}`;
  const body = sanitizeKeyframes(animation.keyframes ?? "");
  return body ? `lp-custom-${hashText(body)}` : null;
}

/**
 * CSS rules for every built-in effect.
 * @returns Style sheet text
 */
export function builtInKeyframesCss(): string {
  return Object.entries(EFFECTS)
    .map(([name, effect]) => `@keyframes lp-${name} { ${effect.keyframes} }`)
    .join("\n");
}

/**
 * CSS rule for a custom animation.
 * @param animation - Animation using the `custom` effect
 * @returns Style sheet text, empty when the keyframes are invalid
 */
export function customKeyframesCss(animation: ElementAnimation): string {
  const body = sanitizeKeyframes(animation.keyframes ?? "");
  return body ? `@keyframes lp-custom-${hashText(body)} { ${body} }` : "";
}

/**
 * Build the CSS `animation` shorthand of an element animation.
 * `both` keeps the first frame during the delay and the last frame after the
 * end, so entrances start hidden and exits stay hidden.
 * @param animation - Animation to play
 * @returns CSS value, or undefined when it cannot play
 */
export function animationCss(animation: ElementAnimation): string | undefined {
  const name = keyframesName(animation);
  if (!name) return undefined;
  const iterations = animation.iterations > 0 ? animation.iterations : "infinite";
  return `${name} ${Math.max(1, animation.durationMs)}ms ${EASINGS[animation.easing] ?? "ease"} ${Math.max(0, animation.delayMs)}ms ${iterations} both`;
}

/**
 * Coerce loosely typed data (stored JSON, assistant output) into animations.
 * Unknown effects become invalid customs and are dropped by `keyframesName`.
 * @param raw - Value of an element's `animations` field
 * @param createId - Id factory for entries without one
 * @returns Normalized animations
 */
export function normalizeAnimations(raw: unknown, createId: () => string): ElementAnimation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const effect = typeof item.effect === "string" && (EFFECTS[item.effect] || item.effect === "custom") ? item.effect : "fadeIn";
      const iterationsRaw = item.iterations;
      const iterations = iterationsRaw === "infinite" || iterationsRaw === 0 ? 0 : Math.max(1, Math.min(100, Math.round(Number(iterationsRaw) || 1)));
      return {
        id: typeof item.id === "string" && item.id ? item.id : createId(),
        name: typeof item.name === "string" && item.name.trim() ? item.name.trim().slice(0, 60) : (EFFECTS[effect]?.label ?? "Animación personalizada"),
        effect,
        trigger: item.trigger === "controller" ? "controller" : "enter",
        durationMs: Math.min(20000, Math.max(50, Math.round(Number(item.durationMs) || EFFECTS[effect]?.durationMs || 600))),
        delayMs: Math.min(20000, Math.max(0, Math.round(Number(item.delayMs) || 0))),
        easing: typeof item.easing === "string" && item.easing in EASINGS ? (item.easing as AnimationEasing) : "ease-out",
        iterations,
        includeChildren: item.includeChildren !== false,
        keyframes: typeof item.keyframes === "string" ? item.keyframes.slice(0, 4000) : undefined,
      } satisfies ElementAnimation;
    });
}
