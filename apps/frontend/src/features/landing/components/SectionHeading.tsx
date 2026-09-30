interface SectionHeadingProps {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  id?: string;
}

export function SectionHeading({ eyebrow, title, description, id }: SectionHeadingProps): React.ReactNode {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-hypr-mono text-xs tracking-[0.2em] text-sky-700 uppercase dark:text-hypr-cyan">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-hypr-display text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl dark:text-zinc-50">
        {title}
      </h2>
      {description && <p className="mt-4 text-base text-pretty text-zinc-600 dark:text-zinc-400">{description}</p>}
    </div>
  );
}
