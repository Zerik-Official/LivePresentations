import { LANDING_FEATURES } from "../constants";
import { GlowWindow } from "./GlowWindow";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

export function FeaturesSection(): React.ReactNode {
  return (
    <section id="funciones" aria-labelledby="funciones-title" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading
            id="funciones-title"
            eyebrow="Funciones"
            title="Todo lo que una charla en vivo necesita"
            description="Un editor, un reproductor y una sala sincronizada. Cada pieza pensada para presentar sin fricción."
          />
        </Reveal>

        <ul className="mt-14 grid gap-3 md:grid-cols-3">
          {LANDING_FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Reveal as="li" key={feature.title} delay={(i % 3) * 0.08} className={feature.span}>
                <GlowWindow hoverActive className="group h-full transition-transform duration-300 hover:-translate-y-1" bodyClassName="flex h-full flex-col p-6">
                    <div className="flex items-center justify-between">
                      <span className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-hypr-cyan/15 to-hypr-violet/15 text-sky-700 ring-1 ring-(--hypr-line) transition-colors group-hover:text-emerald-600 dark:text-hypr-cyan dark:group-hover:text-hypr-mint">
                        <Icon size={18} />
                      </span>
                      <span className="font-hypr-mono text-[10px] text-zinc-400 dark:text-zinc-500">{feature.tag}</span>
                    </div>
                    <h3 className="mt-5 font-hypr-display text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{feature.description}</p>
                </GlowWindow>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
