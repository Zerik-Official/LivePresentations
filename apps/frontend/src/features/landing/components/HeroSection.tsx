import { motion, useReducedMotion } from "framer-motion";
import { FiArrowRight, FiSmartphone } from "react-icons/fi";
import { Link } from "react-router-dom";

import { usePrimaryCta } from "../hooks/usePrimaryCta";
import { HeroShowcase } from "./HeroShowcase";

const HIGHLIGHTS = ["Lienzo 1280×720", "Salas con QR", "Sync por WebSocket", "Export .zip"];

export function HeroSection(): React.ReactNode {
  const cta = usePrimaryCta();
  const reduceMotion = useReducedMotion();
  const enter = (delay: number) =>
    reduceMotion ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const } };

  return (
    <section id="inicio" aria-labelledby="hero-title" className="relative scroll-mt-24 px-4 pt-28 pb-20 sm:px-6 sm:pt-36 lg:pb-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <motion.div {...enter(0)} className="hypr-window hypr-active inline-flex items-center gap-2 rounded-full px-3 py-1">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-hypr-mint opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-hypr-mint" />
            </span>
            <span className="font-hypr-mono text-[11px] text-zinc-700 dark:text-zinc-300">Presentaciones en tiempo real</span>
          </motion.div>

          <motion.h1
            {...enter(0.08)}
            id="hero-title"
            className="mt-6 font-hypr-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl lg:text-[3.6rem] dark:text-zinc-50"
          >
            Presenta en la pantalla. <span className="hypr-text-gradient">Controla desde el bolsillo.</span>
          </motion.h1>

          <motion.p {...enter(0.16)} className="mt-5 max-w-lg text-base text-pretty text-zinc-600 sm:text-lg dark:text-zinc-400">
            Diseña diapositivas en un editor visual, abre una sala con QR y dirige toda la presentación desde tu móvil: cambios de diapositiva, resaltados, preguntas y sorteos sincronizados al instante.
          </motion.p>

          <motion.div {...enter(0.24)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to={cta.to}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white shadow-[0_10px_40px_-12px_var(--color-hypr-cyan)] transition-all hover:-translate-y-0.5 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hypr-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-(--hypr-bg) dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              {cta.label}
              <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#flujo"
              className="hypr-window hover:hypr-active inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium text-zinc-800 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hypr-cyan dark:text-zinc-200"
            >
              <FiSmartphone />
              Cómo funciona
            </a>
          </motion.div>

          <motion.ul {...enter(0.32)} className="mt-10 flex flex-wrap gap-x-5 gap-y-2">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-2 font-hypr-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                <span className="size-1 rounded-full bg-hypr-cyan" />
                {item}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          className="lg:col-span-7"
          {...(reduceMotion ? {} : { initial: { opacity: 0, scale: 0.97, y: 24 }, animate: { opacity: 1, scale: 1, y: 0 }, transition: { duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] as const } })}
        >
          <HeroShowcase />
        </motion.div>
      </div>
    </section>
  );
}
