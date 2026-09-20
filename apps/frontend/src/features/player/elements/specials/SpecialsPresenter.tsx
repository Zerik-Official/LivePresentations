import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FiMaximize2, FiX } from "react-icons/fi";

import { CodeBlock } from "@/components/CodeBlock";
import type { SlideElement, Variable } from "@/types/presentation";

interface Props {
  /** Target specials element */
  element: SlideElement | null;
  /** WS specials state for this element */
  state: Record<string, unknown> | undefined;
  /** Variables for name list */
  variables?: Variable[];
  /** Whether presenter is in fullscreen TV mode */
  fullscreen?: boolean;
}

const WHEEL_COLORS = ["#ff4757", "#2ed573", "#ffa502", "#1e90ff", "#3742fa", "#9b59b6", "#e84393", "#00cec9"];

/**
 * Presenter overlay for specials-answers: centered strip/wheel with real names and question flow.
 * @param element - Specials element
 * @param state - WS state
 * @param variables - Variables
 */
export function SpecialsPresenter({ element, state, variables, fullscreen = false }: Props): React.ReactNode {
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
  const [expandedCode, setExpandedCode] = useState<{ code: string; language: string } | null>(null);

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
    <div className={`absolute inset-0 z-20 flex flex-col overflow-auto ${fullscreen ? "bg-zinc-900 p-6 lg:p-10 xl:p-12" : "bg-zinc-900 p-4"}`}>
      {pickedName && !isPicking && (
        <div className={`mb-4 flex shrink-0 items-center justify-center gap-3 rounded-xl bg-amber-500 shadow font-bold text-white ${fullscreen ? "px-6 py-4 text-xl lg:text-2xl" : "px-5 py-3 text-base lg:text-lg"}`}>
          <span>{pickedName}</span>
          {isCheck && typeof props?.correctAnswerIndex === "number" && (
            <span className={`rounded bg-white font-medium text-zinc-900 ${fullscreen ? "px-3 py-1 text-sm lg:text-base" : "px-2 py-0.5 text-xs"}`}>Correcta: {prefix(props.correctAnswerIndex as number)} {answers[props.correctAnswerIndex as number]}</span>
          )}
        </div>
      )}

      {isPicking && (
        <div className="flex flex-1 items-center justify-center py-6">
          {selectorType === "strip" ? (
            <div className={`relative w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800 shadow-2xl ${fullscreen ? "max-w-6xl" : "max-w-4xl"}`}>
              <div className="absolute inset-y-0 left-1/2 w-32 -translate-x-1/2 border-x-2 border-amber-400 bg-amber-400/15 pointer-events-none z-10 rounded" />
              <div style={{ transform: `translateX(-${stripOffset}px)` }} className={`flex items-center gap-3 whitespace-nowrap px-4 ${fullscreen ? "h-28" : "h-20"}`}>
                {Array.from({ length: 60 }, (_, i) => {
                  const filtered = names.length > 0 ? names.filter((n) => !discarded.includes(n)) : [];
                  const source = filtered.length > 0 ? filtered : names.length > 0 ? names : [];
                  const name = source.length > 0 ? (source[i % source.length] as string) : `Persona ${i + 1}`;
                  return (
                    <span key={i} className={`shrink-0 rounded-xl bg-zinc-700 font-medium text-zinc-100 ${fullscreen ? "px-8 py-5 text-lg lg:text-xl" : "px-5 py-3 text-sm"}`}>
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="relative flex flex-col items-center">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 h-0 w-0 border-l-16 border-r-16 border-t-26 border-l-transparent border-r-transparent border-t-[#ff4757] drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" />
              <canvas ref={canvasRef} width={fullscreen ? 640 : 520} height={fullscreen ? 640 : 520} className="rounded-full shadow-[0_0_30px_rgba(0,0,0,0.6)]" />
            </div>
          )}
        </div>
      )}

      {!isPicking && showQuestion && (
        <>
          <div
            style={{ color: props?.questionColor ?? "#ffffff", textAlign: (props?.questionAlign as never) ?? "center" }}
            className={`mb-4 shrink-0 rounded-xl bg-white/5 font-semibold leading-tight ${fullscreen ? "px-8 py-6 text-2xl lg:text-3xl xl:text-4xl" : "px-6 py-4 text-xl lg:text-2xl"}`}
          >
            {props?.questionText ?? "Pregunta"}
          </div>

          {props?.extraCodeBlocks && props.extraCodeBlocks.length > 0 && (
            <div className={`mb-4 grid gap-4 ${props.extraCodeBlocks.length === 2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
              {props.extraCodeBlocks.map((b, idx) => (
                <div key={idx} className="group relative overflow-hidden rounded-xl border border-zinc-700 bg-[#1e1e1e]">
                  <div className="flex items-center justify-between border-b border-zinc-700 bg-[#252526] px-3 py-2">
                    <span className={`rounded bg-zinc-700 font-semibold uppercase tracking-widest text-zinc-300 ${fullscreen ? "px-2 py-1 text-xs" : "px-2 py-0.5 text-[10px]"}`}>{b.language}</span>
                    <button
                      type="button"
                      onClick={() => setExpandedCode({ code: b.code, language: b.language })}
                      className={`flex cursor-pointer items-center gap-1 rounded-md border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white ${fullscreen ? "px-3 py-1.5 text-sm" : "px-2 py-1 text-xs"}`}
                    >
                      <FiMaximize2 size={14} /> Ampliar
                    </button>
                  </div>
                  <CodeBlock code={b.code} language={b.language} lineNumbers showBadge={false} className={`${fullscreen ? "text-sm lg:text-base max-h-[32vh]" : "text-sm max-h-60"}`} />
                </div>
              ))}
            </div>
          )}

          {showAnswers && (
            <div className={`grid ${fullscreen ? "gap-4 lg:gap-5" : "gap-2"} sm:grid-cols-2`}>
              {answers.slice(0, props?.answersCount ?? 4).map((ans, idx) => {
                const isCorrect = isCheck && props?.correctAnswerIndex === idx;
                const isWrong = isCheck && (state?.selectedIndex as number) === idx && !isCorrect;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 rounded-xl border ${isCorrect ? "border-emerald-400 bg-emerald-500 text-white" : isWrong ? "border-red-400 bg-red-500 text-white" : "border-zinc-700 bg-zinc-800 text-zinc-100"} ${fullscreen ? "px-5 py-5 lg:px-6 lg:py-6" : "px-3 py-3"}`}
                  >
                    <span className={`flex shrink-0 items-center justify-center rounded-full bg-white/20 font-bold ${fullscreen ? "h-10 w-10 lg:h-12 lg:w-12 text-base lg:text-lg" : "h-8 w-8 text-sm"}`}>{prefix(idx)}</span>
                    <span className={`flex-1 font-medium ${fullscreen ? "text-lg lg:text-xl xl:text-2xl leading-snug" : "text-base leading-snug"}`}>{ans}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {!showQuestion && !isPicking && !pickedName && (
        <div className="flex flex-1 items-center justify-center">
          <p className={`text-zinc-400 ${fullscreen ? "text-lg" : "text-sm"}`}>Iniciando pregunta: {(element.props as { questionId?: string })?.questionId ?? element.id}</p>
        </div>
      )}

      <AnimatePresence>
        {expandedCode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm lg:p-8" onClick={() => setExpandedCode(null)}>
            <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-[#1e1e1e] shadow-2xl">
              <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 bg-[#252526] px-4 py-3">
                <span className="rounded bg-zinc-700 px-2 py-1 text-xs font-semibold uppercase tracking-widest text-zinc-300">{expandedCode.language}</span>
                <button type="button" onClick={() => setExpandedCode(null)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                  <FiX size={16} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <CodeBlock code={expandedCode.code} language={expandedCode.language} lineNumbers showBadge={false} className="text-sm lg:text-base" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}