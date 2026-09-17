import { AnimatePresence, motion } from "framer-motion";

interface Props {
  /** Whether intro is active */
  active: boolean;
  /** Countdown value or null */
  countdown: number | null;
}

/**
 * Anti-spoiler intro overlay with cinema countdown.
 * @param active - Whether to show intro
 * @param countdown - Current countdown number
 */
export function AntiSpoilerOverlay({ active, countdown }: Props): React.ReactNode {
  if (!active) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950 px-6 text-white">
      <AnimatePresence mode="wait">
        {countdown === null ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <p className="text-2xl font-semibold tracking-tight sm:text-3xl">En unos momentos,</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">comenzará la presentación</p>
            <p className="mt-4 text-xs tracking-widest uppercase text-zinc-400">Esperando al presentador</p>
          </motion.div>
        ) : (
          <motion.div
            key={countdown}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.8, opacity: 1 }}
            exit={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-white/5 text-6xl font-black tabular-nums backdrop-blur"
          >
            {countdown}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}