import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiEdit3, FiUsers, FiZap } from "react-icons/fi";

import { GlowWindow } from "./GlowWindow";

const SLIDE_COUNT = 3;
const AUTOPLAY_MS = 4200;

interface SlideProps {
  /** Whether the controller highlighted the key element */
  highlight: boolean;
  /** Whether the controller is drawing on the slide */
  drawing: boolean;
}

/**
 * Hand-drawn underline that traces itself, like an annotation from the phone.
 * @param drawing - Whether to show the stroke
 * @returns SVG stroke
 */
function Annotation({ drawing, path, className }: { drawing: boolean; path: string; className: string }): React.ReactNode {
  if (!drawing) return null;
  return (
    <svg viewBox="0 0 200 40" className={`pointer-events-none absolute ${className}`} aria-hidden>
      <motion.path d={path} fill="none" stroke="#ef4444" strokeWidth={4} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: "easeOut" }} />
    </svg>
  );
}

/**
 * Title slide of the demo deck.
 * @param props - Highlight and drawing state
 * @returns Slide content
 */
function SlideTitle({ highlight, drawing }: SlideProps): React.ReactNode {
  return (
    <div className="relative flex h-full flex-col justify-center gap-3 bg-[linear-gradient(135deg,#0f172a,#1e293b)] p-6 sm:p-8">
      <span className="h-1 w-12 rounded-full bg-sky-400" />
      <h3 className={`font-hypr-display text-2xl font-semibold text-white transition-all duration-300 sm:text-3xl ${highlight ? "scale-[1.03] text-sky-200" : ""}`}>Energía solar en 2026</h3>
      <p className="max-w-xs text-xs text-slate-300 sm:text-sm">Qué ha cambiado este año y qué esperar del próximo.</p>
      <Annotation drawing={drawing} path="M5 25 Q 60 10 110 22 T 195 18" className="bottom-[34%] left-6 h-8 w-56 sm:left-8" />
    </div>
  );
}

/**
 * Question slide of the demo deck; the highlight reveals the answer.
 * @param props - Highlight and drawing state
 * @returns Slide content
 */
function SlideQuestion({ highlight, drawing }: SlideProps): React.ReactNode {
  const answers = ["Solar", "Eólica", "Hidráulica"];
  return (
    <div className="relative flex h-full flex-col justify-center gap-3 bg-white p-6 sm:p-8">
      <p className="font-hypr-mono text-[10px] tracking-[0.2em] text-zinc-400 uppercase">Pregunta</p>
      <h3 className="font-hypr-display text-lg font-semibold text-zinc-900 sm:text-2xl">¿Qué fuente creció más?</h3>
      <div className="mt-1 grid grid-cols-3 gap-2">
        {answers.map((answer, i) => {
          const correct = highlight && i === 0;
          return (
            <div key={answer} className={`rounded-lg border px-2 py-2 text-center text-[11px] font-medium transition-all duration-300 sm:text-xs ${correct ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-50 text-zinc-600"}`}>
              <span className="mr-1 font-hypr-mono opacity-60">{String.fromCharCode(65 + i)}</span>
              {answer}
            </div>
          );
        })}
      </div>
      <Annotation drawing={drawing} path="M10 20 C 40 2, 160 2, 190 20 C 160 38, 40 38, 10 20" className="bottom-[16%] left-4 h-14 w-36 sm:left-6" />
    </div>
  );
}

/**
 * Chart slide of the demo deck.
 * @param props - Highlight and drawing state
 * @returns Slide content
 */
function SlideChart({ highlight, drawing }: SlideProps): React.ReactNode {
  const bars = [38, 52, 64, 81];
  return (
    <div className="relative flex h-full flex-col justify-center gap-3 bg-white p-6 sm:p-8">
      <h3 className="font-hypr-display text-lg font-semibold text-zinc-900 sm:text-2xl">Capacidad instalada</h3>
      <div className="flex h-24 items-end gap-3 sm:h-28">
        {bars.map((value, i) => (
          <div key={value} className="flex flex-1 flex-col items-center gap-1">
            <motion.div initial={{ height: 0 }} animate={{ height: `${value}%` }} transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }} className={`w-full rounded-t-md ${highlight && i === bars.length - 1 ? "bg-sky-500" : "bg-slate-300"}`} />
            <span className="font-hypr-mono text-[9px] text-zinc-400">{2023 + i}</span>
          </div>
        ))}
      </div>
      <Annotation drawing={drawing} path="M10 30 L 120 30 L 185 6 M 170 4 L 186 6 L 180 20" className="top-[30%] right-6 h-10 w-40" />
    </div>
  );
}

const SLIDES = [SlideTitle, SlideQuestion, SlideChart];

/**
 * Interactive demo: a presented slide driven by a phone controller, with the
 * audience following through the public link.
 * @returns Demo windows
 */
export function HeroShowcase(): React.ReactNode {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [highlight, setHighlight] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [autoplay, setAutoplay] = useState(!reduceMotion);

  const go = useCallback((delta: number) => {
    setIndex((current) => (current + delta + SLIDE_COUNT) % SLIDE_COUNT);
    setHighlight(false);
    setDrawing(false);
  }, []);

  useEffect(() => {
    if (!autoplay || reduceMotion) return;
    const id = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [autoplay, reduceMotion, go]);

  /**
   * Run a controller action and stop the autoplay.
   * @param action - Action to run
   */
  function manual(action: () => void): void {
    setAutoplay(false);
    action();
  }

  const Slide = SLIDES[index]!;
  const control = "flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

  return (
    <div className="grid grid-cols-5 gap-3">
      <GlowWindow label="Presentando · sala K7Q2" active className="col-span-5 sm:col-span-3" bodyClassName="p-2">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-zinc-900">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              className="absolute inset-0"
              initial={reduceMotion ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
              transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Slide highlight={highlight} drawing={drawing} />
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-2 right-3 font-hypr-mono text-[10px] text-zinc-400">
            {index + 1}/{SLIDE_COUNT}
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1.5 px-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          <FiUsers size={12} /> 24 personas siguen la presentación desde su móvil
        </p>
      </GlowWindow>

      <GlowWindow label="Tu móvil" hoverActive className="col-span-5 sm:col-span-2" bodyClassName="flex flex-col items-center justify-center p-3">
        <div className="flex w-full max-w-44 flex-col gap-2 rounded-2xl border border-(--hypr-line) bg-zinc-950/90 p-2.5 shadow-inner">
          <div className="mx-auto h-1 w-8 rounded-full bg-white/15" />
          <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center font-hypr-mono text-[10px] text-zinc-400">
            Diapositiva <span className="text-white">{index + 1}</span> / {SLIDE_COUNT}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => manual(() => go(-1))} aria-label="Diapositiva anterior" className={`${control} bg-white/6 text-zinc-200 hover:bg-white/12`}>
              <FiChevronLeft />
            </button>
            <button type="button" onClick={() => manual(() => go(1))} aria-label="Diapositiva siguiente" className={`${control} bg-white text-zinc-900 hover:bg-zinc-100`}>
              <FiChevronRight />
            </button>
          </div>
          <button type="button" onClick={() => manual(() => setHighlight((value) => !value))} aria-pressed={highlight} className={`${control} ${highlight ? "bg-white/15 text-white" : "bg-white/6 text-zinc-300 hover:bg-white/12"}`}>
            <FiZap size={12} /> Resaltar
          </button>
          <button type="button" onClick={() => manual(() => setDrawing((value) => !value))} aria-pressed={drawing} className={`${control} ${drawing ? "bg-red-500/25 text-white" : "bg-white/6 text-zinc-300 hover:bg-white/12"}`}>
            <FiEdit3 size={12} /> Anotar
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-zinc-500">Pruébalo: controla la demo</p>
      </GlowWindow>
    </div>
  );
}
