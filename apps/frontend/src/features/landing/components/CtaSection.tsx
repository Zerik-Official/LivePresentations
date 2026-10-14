import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";

import { usePrimaryCta } from "../hooks/usePrimaryCta";
import { GlowWindow } from "./GlowWindow";
import { Reveal } from "./Reveal";

export function CtaSection(): React.ReactNode {
  const cta = usePrimaryCta();

  return (
    <section id="empezar" aria-labelledby="empezar-title" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
      <Reveal className="mx-auto max-w-4xl">
        <GlowWindow active label="~/livepresentations — nueva sala" bodyClassName="relative overflow-hidden px-6 py-14 text-center sm:px-12 sm:py-20">
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-64 w-xl -translate-x-1/2 rounded-full bg-zinc-900/5 blur-3xl dark:bg-white/5" />
          <h2 id="empezar-title" className="relative font-hypr-display text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl dark:text-zinc-50">
            Tu próxima presentación <span className="hypr-text-gradient">empieza aquí</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-base text-pretty text-zinc-600 dark:text-zinc-400">
            Crea tu cuenta, diseña tu primera diapositiva y abre una sala en menos de un minuto.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={cta.to}
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-7 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-(--hypr-bg) sm:w-auto dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:focus-visible:ring-white"
            >
              {cta.label}
              <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            {!cta.isAuthenticated && (
              <Link
                to="/login"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl px-6 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-900/5 sm:w-auto dark:text-zinc-300 dark:hover:bg-white/6"
              >
                Ya tengo cuenta
              </Link>
            )}
          </div>
        </GlowWindow>
      </Reveal>
    </section>
  );
}
