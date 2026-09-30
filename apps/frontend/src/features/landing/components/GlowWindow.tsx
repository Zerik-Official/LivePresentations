import type { ReactNode } from "react";

interface GlowWindowProps {
  label?: string;
  active?: boolean;
  hoverActive?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function GlowWindow({ label, active = false, hoverActive = false, className = "", bodyClassName = "", children }: GlowWindowProps): React.ReactNode {
  const state = active ? "hypr-active" : hoverActive ? "hover:hypr-active focus-within:hypr-active" : "";

  return (
    <div className={`hypr-window flex flex-col rounded-2xl ${state} ${className}`}>
      {label && (
        <div className="flex items-center justify-between border-b border-(--hypr-line) px-4 py-2.5">
          <span className="font-hypr-mono text-[11px] tracking-wide text-zinc-500 dark:text-zinc-400">{label}</span>
          <span className={`size-1.5 rounded-full ${active ? "bg-hypr-mint shadow-[0_0_10px_var(--color-hypr-mint)]" : "bg-zinc-300 dark:bg-zinc-700"}`} />
        </div>
      )}
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
