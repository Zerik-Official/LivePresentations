import { useState } from "react";
import { FiChevronDown, FiPlay, FiPlus, FiTrash2 } from "react-icons/fi";

import { Select, type SelectOption } from "@/components/ui/Select";
import { EASINGS, EFFECTS, normalizeAnimations, sanitizeKeyframes, type AnimationEasing, type ElementAnimation } from "@/lib/animations/effects";
import { getDescendantIds } from "@/lib/presentation/hierarchy";
import { createId } from "@/lib/presentation/operations";
import { useAnimationPreview } from "@/stores/animationPreviewStore";
import type { Slide, SlideElement } from "@/types/presentation";

const GROUP_LABELS = { in: "Entrada", out: "Salida", emphasis: "Énfasis" } as const;

const EFFECT_OPTIONS: SelectOption[] = [
  ...Object.entries(EFFECTS).map(([value, effect]) => ({ value, label: `${GROUP_LABELS[effect.kind]} · ${effect.label}` })),
  { value: "custom", label: "Personalizada · CSS @keyframes" },
];

const EASING_OPTIONS: SelectOption[] = (Object.keys(EASINGS) as AnimationEasing[]).map((value) => ({
  value,
  label: { ease: "Suave", "ease-in": "Acelerar", "ease-out": "Frenar", "ease-in-out": "Acelerar y frenar", linear: "Lineal", spring: "Elástica" }[value],
}));

const CUSTOM_EXAMPLE = "0% { opacity: 0; transform: translateY(40px) scale(0.9) }\n60% { opacity: 1; transform: translateY(-8px) }\n100% { transform: none }";

const INPUT_CLASS = "w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-2 py-1.5 text-xs outline-none focus:border-zinc-900 dark:focus:border-zinc-400";

interface Props {
  element: SlideElement;
  onPatch: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
  /** Slide of the element, to preview animations on linked children */
  slide?: Slide | null;
}

/**
 * Default name of an animation, used until the user names it.
 * @param effect - Effect key
 * @returns Label of the effect
 */
function defaultName(effect: string): string {
  return EFFECTS[effect]?.label ?? "Animación personalizada";
}

/**
 * Editor of an element's animations: entrance, exit and emphasis effects or
 * custom CSS keyframes, played when the slide appears or from the controller.
 * @param element - Selected element
 * @param onPatch - Patch handler
 * @param slide - Slide of the element
 * @returns Animations section of the properties panel
 */
export function AnimationsPanel({ element, onPatch, slide }: Props): React.ReactNode {
  const animations = element.animations ?? [];
  const [expanded, setExpanded] = useState<string | null>(null);
  const preview = useAnimationPreview((s) => s.preview);

  /**
   * Store a new animation list.
   * @param next - Animations to keep
   */
  function save(next: ElementAnimation[]): void {
    onPatch({ animations: next });
  }

  /**
   * Change one animation.
   * @param id - Animation id
   * @param change - Fields to overwrite
   */
  function update(id: string, change: Partial<ElementAnimation>): void {
    save(animations.map((animation) => (animation.id === id ? { ...animation, ...change } : animation)));
  }

  /** Add an entrance animation and open it for editing. */
  function add(): void {
    const [created] = normalizeAnimations([{ effect: "fadeIn", trigger: "enter" }], () => createId("anim"));
    save([...animations, created!]);
    setExpanded(created!.id);
  }

  return (
    <section data-tour="animations" className="space-y-2 border-t border-zinc-200 dark:border-zinc-700 pt-3">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Animaciones</h5>
        <button type="button" onClick={add} className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
          <FiPlus size={11} /> Añadir
        </button>
      </div>
      {animations.length === 0 && <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">Sin animaciones. Pueden reproducirse al mostrar la diapositiva o lanzarse desde el controlador.</p>}

      {animations.map((animation) => {
        const open = expanded === animation.id;
        const customInvalid = animation.effect === "custom" && !sanitizeKeyframes(animation.keyframes ?? "");
        return (
          <div key={animation.id} className="rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <button type="button" onClick={() => setExpanded(open ? null : animation.id)} aria-expanded={open} className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-left">
                <FiChevronDown size={12} className={`shrink-0 text-zinc-500 transition-transform ${open ? "" : "-rotate-90"}`} />
                <span className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-100">{animation.name}</span>
                <span className="shrink-0 text-[10px] text-zinc-500 dark:text-zinc-400">{animation.trigger === "controller" ? (animation.startHidden ? "controlador · oculto" : "controlador") : "al mostrar"}</span>
              </button>
              <button type="button" aria-label="Previsualizar animación" title="Previsualizar" disabled={customInvalid} onClick={() =>
                  preview(
                    animation,
                    animation.includeChildren && slide ? [element.id, ...getDescendantIds(slide.elements, element.id)] : [element.id],
                    animation.delayMs + animation.durationMs * (animation.iterations > 0 ? Math.min(animation.iterations, 5) : 3),
                  )
                } className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <FiPlay size={11} />
              </button>
              <button type="button" aria-label="Eliminar animación" title="Eliminar" onClick={() => save(animations.filter((a) => a.id !== animation.id))} className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950">
                <FiTrash2 size={11} />
              </button>
            </div>

            {open && (
              <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-700 p-2">
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  Nombre en el controlador
                  <input value={animation.name} maxLength={60} onChange={(e) => update(animation.id, { name: e.target.value })} className={`mt-1 ${INPUT_CLASS}`} />
                </label>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  Efecto
                  <Select
                    value={animation.effect}
                    options={EFFECT_OPTIONS}
                    onChange={(effect) =>
                      update(animation.id, {
                        effect,
                        name: animation.name === defaultName(animation.effect) ? defaultName(effect) : animation.name,
                        startHidden: effect === "custom" ? animation.startHidden : EFFECTS[effect]?.kind === "in",
                        durationMs: EFFECTS[effect]?.durationMs ?? animation.durationMs,
                        keyframes: effect === "custom" ? (animation.keyframes ?? CUSTOM_EXAMPLE) : animation.keyframes,
                      })
                    }
                  />
                </label>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  Cuándo
                  <Select
                    value={animation.trigger}
                    options={[
                      { value: "enter", label: "Al mostrar la diapositiva" },
                      { value: "controller", label: "Al pulsarlo en el controlador" },
                    ]}
                    onChange={(trigger) => update(animation.id, { trigger: trigger as ElementAnimation["trigger"] })}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    Duración (ms)
                    <input type="number" min={50} max={20000} step={50} value={animation.durationMs} onChange={(e) => update(animation.id, { durationMs: Math.max(50, Number(e.target.value) || 0) })} className={`mt-1 ${INPUT_CLASS}`} />
                  </label>
                  <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    Retraso (ms)
                    <input type="number" min={0} max={20000} step={50} value={animation.delayMs} onChange={(e) => update(animation.id, { delayMs: Math.max(0, Number(e.target.value) || 0) })} className={`mt-1 ${INPUT_CLASS}`} />
                  </label>
                  <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    Curva
                    <Select value={animation.easing} options={EASING_OPTIONS} onChange={(easing) => update(animation.id, { easing: easing as AnimationEasing })} />
                  </label>
                  <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    Repeticiones
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={animation.iterations}
                      title="0 repite sin fin"
                      onChange={(e) => update(animation.id, { iterations: Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0))) })}
                      className={`mt-1 ${INPUT_CLASS}`}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Repeticiones 0 = sin fin.</p>
                <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  <input type="checkbox" checked={animation.includeChildren} onChange={(e) => update(animation.id, { includeChildren: e.target.checked })} className="cursor-pointer accent-zinc-900 dark:accent-white" />
                  Animar también los elementos enlazados
                </label>
                {animation.trigger === "controller" && (
                  <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    <input type="checkbox" checked={animation.startHidden} onChange={(e) => update(animation.id, { startHidden: e.target.checked })} className="cursor-pointer accent-zinc-900 dark:accent-white" />
                    Oculto hasta lanzarla desde el controlador
                  </label>
                )}
                {animation.effect === "custom" && (
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    Fotogramas clave (cuerpo de @keyframes)
                    <textarea
                      value={animation.keyframes ?? ""}
                      onChange={(e) => update(animation.id, { keyframes: e.target.value })}
                      rows={5}
                      spellCheck={false}
                      className={`mt-1 font-mono ${INPUT_CLASS} ${customInvalid ? "border-red-400 dark:border-red-500" : ""}`}
                    />
                    <span className={`mt-1 block text-[10px] font-normal ${customInvalid ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                      {customInvalid ? "Usa bloques como «0% { ... } 100% { ... }» sin @reglas, url() ni bloques anidados." : "Bloques from/to o porcentajes con propiedades CSS, p. ej. transform, opacity o filter."}
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
