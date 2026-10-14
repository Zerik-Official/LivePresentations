import { FiChevronDown } from "react-icons/fi";
import { Link } from "react-router-dom";

import { LANDING_QUESTIONS } from "../constants";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

/**
 * Frequently asked questions, as native disclosure widgets.
 * @returns FAQ section
 */
export function FaqSection(): React.ReactNode {
  return (
    <section id="preguntas" aria-labelledby="preguntas-title" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <SectionHeading id="preguntas-title" eyebrow="Preguntas" title="Lo que suelen preguntarnos" />
        </Reveal>
        <div className="mt-12 divide-y divide-(--hypr-line) rounded-2xl border border-(--hypr-line) bg-(--hypr-surface)">
          {LANDING_QUESTIONS.map((item) => (
            <details key={item.question} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-zinc-900 outline-none focus-visible:underline dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
                {item.question}
                <FiChevronDown className="shrink-0 text-zinc-500 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {item.answer}
                {item.question.includes("datos") && (
                  <>
                    {" "}
                    <Link to="/privacy" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
                      Leer la política de privacidad
                    </Link>
                  </>
                )}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
