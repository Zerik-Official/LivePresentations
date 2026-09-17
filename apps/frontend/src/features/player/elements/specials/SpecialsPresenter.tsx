import { useEffect, useRef, useState } from "react";

import { CodeBlock } from "@/components/CodeBlock";
import type { SlideElement, Variable } from "@/types/presentation";

interface Props {
  /** Target specials element */
  element: SlideElement | null;
  /** WS specials state for this element */
  state: Record<string, unknown> | undefined;
  /** Variables for name list */
  variables?: Variable[];
}

const WHEEL_COLORS = ["#ff4757", "#2ed573", "#ffa502", "#1e90ff", "#3742fa", "#9b59b6", "#e84393", "#00cec9"];

/**
 * Presenter overlay for specials-answers: centered strip/wheel with real names and question flow.
 * @param element - Specials element
 * @param state - WS state
 * @param variables - Variables
 */
export function SpecialsPresenter({ element, state, variables }: Props): React.ReactNode {
  const props = element?.props as {
    questionText?: string;
    questionColor?: string;
    questionAlign?: string;
    answers?: string[];
    answersFormat?: string;
    answersCount?: number;
    correctAnswerIndex?: number | null;
    extraCodeBlocks?: Array<{ language: string; code: string }>;
    selectorType?: string;
    selectorDuration?: number;
    variableId?: string;
  } | undefined;

  const phase = (state?.type as string) ?? "";
  const pickedName = (state?.pickedName as string) ?? null;
  const showQuestion = phase.includes("SHOW_QUESTION") || phase.includes("SHOW_ANSWERS") || phase.includes("CHECK");
  const showAnswers = phase.includes("SHOW_ANSWERS") || phase.includes("CHECK");
  const isPicking = phase === "SPECIALS_PICKING";
  const isCheck = phase === "SPECIALS_CHECK";
  const selectorType = props?.selectorType ?? "strip";
  const duration = (state?.duration as number) ?? props?.selectorDuration ?? 5;

  const varData = variables?.find((v) => v.id === props?.variableId);
  const names: string[] = Array.isArray(varData?.value) ? (varData.value as string[]) : [];
  const discarded = (state?.discarded as string[]) ?? [];

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const startAngleRef = useRef(0);
  const [stripOffset, setStripOffset] = useState(0);

  useEffect(() => {
    if (!isPicking || selectorType !== "strip") return;
    const available = names.length > 0 ? names.filter((n) => !discarded.includes(n)) : ["Persona 1", "Persona 2", "Persona 3"];
    const displayNames = available.length > 0 ? available : names;
    const pickedIdx = pickedName ? displayNames.indexOf(pickedName) : -1;
    const itemWidth = 132;
    const targetOffset = pickedIdx >= 0 ? pickedIdx * itemWidth : 0;
    const extraSpins = 3 * displayNames.length * itemWidth;
    const finalOffset = extraSpins + targetOffset;
    const start = Date.now();
    const total = duration * 1000;
    let raf = 0;
    /**
     * Animate strip with ease out to land on picked name without backward jumps.
     */
    function tick(): void {
      const elapsed = Date.now() - start;
      if (elapsed >= total) {
        setStripOffset(finalOffset);
        return;
      }
      const progress = elapsed / total;
      const ease = 1 - Math.pow(1 - progress, 3);
      setStripOffset(ease * finalOffset);
      raf = window.requestAnimationFrame(tick);
    }
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [isPicking, selectorType, duration, names, pickedName, discarded]);

  useEffect(() => {
    if (!isPicking || selectorType !== "wheel" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const available = names.length > 0 ? names.filter((n) => !discarded.includes(n)) : [];
    const displayNames = available.length > 0 ? available : names.length > 0 ? names : ["Sin nombres"];
    const numOptions = displayNames.length;
    const pickedIdx = pickedName ? displayNames.indexOf(pickedName) : 0;
    const safeIdx = pickedIdx >= 0 ? pickedIdx : 0;
    const arcSize = (2 * Math.PI) / (numOptions || 1);
    const baseAngle = startAngleRef.current;
    const targetAngle = -Math.PI / 2 - safeIdx * arcSize - arcSize / 2;
    let delta = (targetAngle - baseAngle) % (2 * Math.PI);
    if (delta < 0) delta += 2 * Math.PI;
    const totalRotation = 4 * 2 * Math.PI + delta;
    const target = baseAngle + totalRotation;
    const startTime = Date.now();
    const totalTime = duration * 1000;

    /**
     * Draw wheel at angle with text oriented radially along the strip.
     * @param angle - Angle
     */
    function drawWheel(angle: number): void {
      const outsideRadius = canvas.width / 2 - 14;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < numOptions; i++) {
        const a = angle + i * arcSize;
        ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length] as string;
        ctx.beginPath();
        ctx.arc(centerX, centerY, outsideRadius, a, a + arcSize, false);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
        ctx.save();
        ctx.fillStyle = "white";
        ctx.font = "bold 15px sans-serif";
        ctx.translate(centerX, centerY);
        ctx.rotate(a + arcSize / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        const text = displayNames[i] ?? "";
        ctx.fillText(text, outsideRadius - 15, 0);
        ctx.restore();
      }
    }

    let raf = 0;
    /**
     * Tick.
     */
    function tick(): void {
      const elapsed = Date.now() - startTime;
      if (elapsed >= totalTime) {
        startAngleRef.current = target;
        drawWheel(target);
        return;
      }
      const progress = elapsed / totalTime;
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = baseAngle + (target - baseAngle) * eased;
      drawWheel(current);
      raf = window.requestAnimationFrame(tick);
    }

    drawWheel(baseAngle);
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [isPicking, selectorType, names, duration, pickedName]);

  if (!element) return null;
  if (phase === "SPECIALS_FINALIZED") return null;
  const isActive = Boolean(phase.startsWith("SPECIALS_"));
  if (!isActive) return null;

  const answers = props?.answers ?? [];
  const format = props?.answersFormat ?? "letters";

  /**
   * Format prefix for answer.
   * @param idx - Index
   */
  function prefix(idx: number): string {
    if (format === "letters") return `${String.fromCharCode(65 + idx)}.`;
    if (format === "numbers") return `${idx + 1}.`;
    return "";
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-zinc-900 p-4 overflow-auto">
      {pickedName && !isPicking && (
        <div className="mb-3 flex shrink-0 items-center justify-center gap-3 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow">
          <span>{pickedName}</span>
          {isCheck && typeof props?.correctAnswerIndex === "number" && (
            <span className="rounded bg-white px-2 py-0.5 text-xs text-zinc-900">Correcta: {prefix(props.correctAnswerIndex as number)} {answers[props.correctAnswerIndex as number]}</span>
          )}
        </div>
      )}

      {isPicking && (
        <div className="flex flex-1 items-center justify-center py-6">
          {selectorType === "strip" ? (
            <div className="relative w-full max-w-4xl overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800 shadow-2xl">
              <div className="absolute inset-y-0 left-1/2 w-32 -translate-x-1/2 border-x-2 border-amber-400 bg-amber-400/15 pointer-events-none z-10 rounded" />
              <div style={{ transform: `translateX(-${stripOffset}px)` }} className="flex h-20 items-center gap-3 whitespace-nowrap px-4">
                {Array.from({ length: 60 }, (_, i) => {
                  const filtered = names.length > 0 ? names.filter((n) => !discarded.includes(n)) : [];
                  const source = filtered.length > 0 ? filtered : names.length > 0 ? names : [];
                  const name = source.length > 0 ? (source[i % source.length] as string) : `Persona ${i + 1}`;
                  return (
                    <span key={i} className="shrink-0 rounded-xl bg-zinc-700 px-5 py-3 text-sm font-medium text-zinc-100">
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="relative flex flex-col items-center">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 h-0 w-0 border-l-16 border-r-16 border-t-26 border-l-transparent border-r-transparent border-t-[#ff4757] drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" />
              <canvas ref={canvasRef} width={520} height={520} className="rounded-full shadow-[0_0_30px_rgba(0,0,0,0.6)]" />
            </div>
          )}
        </div>
      )}

      {!isPicking && showQuestion && (
        <>
          <div
            style={{ color: props?.questionColor ?? "#ffffff", textAlign: (props?.questionAlign as never) ?? "center" }}
            className="mb-3 shrink-0 rounded-xl bg-white/5 px-4 py-3 text-lg font-semibold"
          >
            {props?.questionText ?? "Pregunta"}
          </div>

          {props?.extraCodeBlocks && props.extraCodeBlocks.length > 0 && (
            <div className={`mb-3 grid gap-3 ${props.extraCodeBlocks.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
              {props.extraCodeBlocks.map((b, idx) => (
                <div key={idx} className="overflow-hidden rounded-lg border border-zinc-700">
                  <CodeBlock code={b.code} language={b.language} lineNumbers showBadge={false} className="text-xs max-h-55" />
                </div>
              ))}
            </div>
          )}

          {showAnswers && (
            <div className="grid gap-2 sm:grid-cols-2">
              {answers.slice(0, props?.answersCount ?? 4).map((ans, idx) => {
                const isCorrect = isCheck && props?.correctAnswerIndex === idx;
                const isWrong = isCheck && (state?.selectedIndex as number) === idx && !isCorrect;
                return (
                  <div key={idx} className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-sm ${isCorrect ? "border-emerald-400 bg-emerald-500 text-white" : isWrong ? "border-red-400 bg-red-500 text-white" : "border-zinc-700 bg-zinc-800 text-zinc-100"}`}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">{prefix(idx)}</span>
                    <span className="flex-1">{ans}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {!showQuestion && !isPicking && !pickedName && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-zinc-400">Iniciando pregunta: {(element.props as { questionId?: string })?.questionId ?? element.id}</p>
        </div>
      )}
    </div>
  );
}