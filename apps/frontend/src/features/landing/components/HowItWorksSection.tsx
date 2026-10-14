import { LANDING_STEPS } from "../constants";
import { GlowWindow } from "./GlowWindow";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

export function HowItWorksSection(): React.ReactNode {
  return (
    <section id="flujo" aria-labelledby="flujo-title" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading id="flujo-title" eyebrow="Cómo funciona" title="De la idea al escenario en tres pasos" />
        </Reveal>

        <div className="relative mt-14">
          <div aria-hidden className="pointer-events-none absolute top-13 right-[16%] left-[16%] hidden h-px bg-zinc-200 md:block dark:bg-zinc-800" />
          <ol className="grid gap-3 md:grid-cols-3">
            {LANDING_STEPS.map((step, i) => (
              <Reveal as="li" key={step.index} delay={i * 0.1}>
                <GlowWindow hoverActive className="h-full" bodyClassName="flex h-full flex-col items-center p-6 text-center">
                  <span className="relative grid size-14 place-items-center rounded-2xl bg-(--hypr-bg) font-hypr-mono text-sm font-bold ring-1 ring-(--hypr-line)">
                    <span className="hypr-text-gradient">{step.index}</span>
                  </span>
                  <h3 className="mt-5 font-hypr-display text-lg font-semibold text-zinc-900 dark:text-zinc-100">{step.title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{step.description}</p>
                </GlowWindow>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
