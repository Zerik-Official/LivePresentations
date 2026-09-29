import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiZap } from "react-icons/fi";

import { GlowWindow } from "./GlowWindow";

interface LogEntry {
  id: number;
  time: string;
  type: string;
  payload: string;
}

const SLIDE_COUNT = 3;
const AUTOPLAY_MS = 3800;

function stamp(): string {
  return new Date().toLocaleTimeString("es-CO", { hour12: false });
}

function SlideArchitecture({ highlight }: { highlight: boolean }): React.ReactNode {
  const bars = [
    { label: "editor/", width: "82%" },
    { label: "player/", width: "64%" },
    { label: "room/", width: "48%" },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-5 sm:p-7">
      <p className="font-hypr-mono text-[10px] uppercase tracking-[0.2em] text-hypr-cyan">src/features</p>
      <h3 className="font-hypr-display text-lg font-semibold text-white sm:text-2xl">Arquitectura por features</h3>
      <div className="mt-1 flex flex-col gap-2">
        {bars.map((bar, i) => (
          <div key={bar.label} className="flex items-center gap-3">
            <span className="w-14 font-hypr-mono text-[10px] text-zinc-400">{bar.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: bar.width }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`h-full rounded-full ${highlight && i === 0 ? "bg-hypr-mint shadow-[0_0_14px_var(--color-hypr-mint)]" : "bg-linear-to-r from-hypr-cyan to-hypr-violet"}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideQuestion({ highlight }: { highlight: boolean }): React.ReactNode {
  const answers = ["WebSocket", "REST polling", "gRPC"];
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-5 sm:p-7">
      <p className="font-hypr-mono text-[10px] uppercase tracking-[0.2em] text-hypr-violet">pregunta · 1/1</p>
      <h3 className="font-hypr-display text-lg font-semibold text-white sm:text-2xl">¿Cómo se sincroniza la sala?</h3>
      <div className="mt-1 grid grid-cols-3 gap-2">
        {answers.map((answer, i) => {
          const correct = highlight && i === 0;
          return (
            <div
              key={answer}
              className={`rounded-lg border px-2 py-2 text-center text-[10px] font-medium transition-all duration-300 sm:text-xs ${
                correct ? "border-hypr-mint bg-hypr-mint/15 text-hypr-mint shadow-[0_0_18px_-6px_var(--color-hypr-mint)]" : "border-white/10 bg-white/5 text-zinc-300"
              }`}
            >
              <span className="mr-1 font-hypr-mono opacity-60">{String.fromCharCode(65 + i)}</span>
              {answer}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlideRaffle({ highlight }: { highlight: boolean }): React.ReactNode {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center sm:p-7">
      <p className="font-hypr-mono text-[10px] uppercase tracking-[0.2em] text-hypr-rose">sorteo · $participantes</p>
      <div className={`rounded-xl border px-6 py-3 transition-all duration-300 ${highlight ? "border-hypr-rose bg-hypr-rose/10 shadow-[0_0_24px_-6px_var(--color-hypr-rose)]" : "border-white/10 bg-white/5"}`}>
        <span className="font-hypr-display text-2xl font-semibold text-white sm:text-3xl">Valentina</span>
      </div>
      <p className="text-[11px] text-zinc-400">Ruleta · 3 s · sin repetir</p>
    </div>
  );
}

const SLIDES = [SlideArchitecture, SlideQuestion, SlideRaffle];

export function HeroShowcase(): React.ReactNode {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [highlight, setHighlight] = useState(false);
  const [autoplay, setAutoplay] = useState(!reduceMotion);
  const [log, setLog] = useState<LogEntry[]>([{ id: 0, time: stamp(), type: "ROOM_STATE", payload: '{"code":"K7Q2"}' }]);
  const nextId = useRef(1);
  const indexRef = useRef(0);

  const push = useCallback((type: string, payload: string) => {
    const entry = { id: nextId.current++, time: stamp(), type, payload };
    setLog((prev) => [...prev.slice(-3), entry]);
  }, []);

  const go = useCallback(
    (delta: number) => {
      const next = (indexRef.current + delta + SLIDE_COUNT) % SLIDE_COUNT;
      indexRef.current = next;
      setIndex(next);
      setHighlight(false);
      push("SLIDE_CHANGED", `{"index":${next}}`);
    },
    [push],
  );

  useEffect(() => {
    if (!autoplay || reduceMotion) return;
    const id = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [autoplay, reduceMotion, go]);

  function handleManual(delta: number): void {
    setAutoplay(false);
    go(delta);
  }

  function handleHighlight(): void {
    setAutoplay(false);
    const next = !highlight;
    setHighlight(next);
    push("HIGHLIGHT_CHANGED", `{"active":${next}}`);
  }

  const Slide = SLIDES[index];

  return (
    <div className="grid grid-cols-5 gap-3">
      <GlowWindow label="presenter — /present/K7Q2" active className="col-span-5 sm:col-span-3" bodyClassName="p-2">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-[radial-gradient(120%_120%_at_0%_0%,#1b1b2e_0%,#0a0a12_60%)]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              className="absolute inset-0"
              initial={reduceMotion ? false : { opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(6px)" }}
              transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Slide highlight={highlight} />
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-2 right-3 font-hypr-mono text-[10px] text-zinc-500">
            {index + 1}/{SLIDE_COUNT}
          </div>
        </div>
      </GlowWindow>

      <GlowWindow label="controller" hoverActive className="col-span-2 sm:row-span-2" bodyClassName="flex flex-col items-center justify-center p-3">
        <div className="flex w-full max-w-[140px] flex-col gap-2 rounded-2xl border border-(--hypr-line) bg-zinc-950/90 p-2.5 shadow-inner">
          <div className="mx-auto h-1 w-8 rounded-full bg-white/15" />
          <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center font-hypr-mono text-[10px] text-zinc-400">
            Diapositiva <span className="text-white">{index + 1}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleManual(-1)}
              aria-label="Diapositiva anterior"
              className="grid h-10 cursor-pointer place-items-center rounded-lg bg-white/6 text-zinc-200 transition-colors hover:bg-white/12 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hypr-cyan"
            >
              <FiChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => handleManual(1)}
              aria-label="Diapositiva siguiente"
              className="grid h-10 cursor-pointer place-items-center rounded-lg bg-linear-to-br from-hypr-cyan to-hypr-mint text-zinc-950 transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <FiChevronRight />
            </button>
          </div>
          <button
            type="button"
            onClick={handleHighlight}
            aria-pressed={highlight}
            className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hypr-violet ${
              highlight ? "bg-hypr-violet/25 text-hypr-violet" : "bg-white/6 text-zinc-300 hover:bg-white/12"
            }`}
          >
            <FiZap size={12} />
            Resaltar
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-zinc-500">Pruébalo: controla la demo</p>
      </GlowWindow>

      <GlowWindow label="ws://room/K7Q2" className="col-span-3" bodyClassName="h-[118px] overflow-hidden px-4 py-3">
        <ul aria-live="polite" className="flex flex-col gap-1.5 font-hypr-mono text-[10px] leading-tight sm:text-[11px]">
          <AnimatePresence initial={false}>
            {log.map((entry) => (
              <motion.li
                key={entry.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex gap-2 truncate"
              >
                <span className="text-zinc-400 dark:text-zinc-600">{entry.time}</span>
                <span className="text-sky-700 dark:text-hypr-cyan">{entry.type}</span>
                <span className="truncate text-zinc-500">{entry.payload}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </GlowWindow>
    </div>
  );
}
