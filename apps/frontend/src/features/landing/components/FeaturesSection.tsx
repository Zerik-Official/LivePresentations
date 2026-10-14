import { LANDING_FEATURE_GROUPS } from "../constants";
import { GlowWindow } from "./GlowWindow";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

/**
 * Product capabilities grouped by moment: creating, presenting and sharing.
 * @returns Features section
 */
export function FeaturesSection(): React.ReactNode {
  return (
    <section id="funciones" aria-labelledby="funciones-title" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading
            id="funciones-title"
            eyebrow="Funciones"
            title="Del primer borrador a la sala llena"
            description="Todo ocurre en el navegador: diseñas, presentas y compartes con la misma herramienta."
          />
        </Reveal>

        <div className="mt-14 grid gap-3 lg:grid-cols-3">
          {LANDING_FEATURE_GROUPS.map((group, i) => (
            <Reveal key={group.title} delay={i * 0.08}>
              <GlowWindow hoverActive className="h-full" bodyClassName="flex h-full flex-col p-6">
                <h3 className="font-hypr-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{group.title}</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{group.summary}</p>
                <ul className="mt-6 flex flex-col gap-5">
                  {group.features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <li key={feature.title} className="flex gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-zinc-900/5 text-zinc-900 ring-1 ring-(--hypr-line) dark:bg-white/10 dark:text-zinc-100">
                          <Icon size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{feature.title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{feature.description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </GlowWindow>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
