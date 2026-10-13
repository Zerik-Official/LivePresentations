import { useState } from "react";

import type { AiUsageDay, AiUsageModel, AiUsageSummary } from "@/types/backend";

const COMPACT = new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 });
const FULL = new Intl.NumberFormat("es-ES");
const DAY_LABEL = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });
const PLOT_HEIGHT = 160;

/** Token series, in fixed order so each keeps its color. */
const SERIES = [
  { key: "input_tokens", label: "Entrada", color: "var(--chart-1)" },
  { key: "output_tokens", label: "Salida", color: "var(--chart-2)" },
] as const;

/**
 * Round a maximum up to a tidy axis bound.
 * @param value - Largest value to fit
 * @returns Axis maximum of the form 1, 2 or 5 times a power of ten
 */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return ([1, 2, 5, 10].find((step) => step * magnitude >= value) ?? 10) * magnitude;
}

/**
 * Format an ISO date as a short day label.
 * @param isoDate - Date as YYYY-MM-DD
 * @returns Label such as "3 oct"
 */
function formatDay(isoDate: string): string {
  return DAY_LABEL.format(new Date(`${isoDate}T00:00:00Z`));
}

/**
 * Headline figure with its caption.
 * @param label - Caption
 * @param value - Figure
 * @returns Stat tile
 */
function StatTile({ label, value }: { label: string; value: number }): React.ReactNode {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2.5">
      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100" title={FULL.format(value)}>
        {COMPACT.format(value)}
      </p>
    </div>
  );
}

/**
 * Stacked bars of input and output tokens per day, with a hover tooltip.
 * @param days - One entry per day, oldest first
 * @returns Chart element
 */
function DailyTokensChart({ days }: { days: AiUsageDay[] }): React.ReactNode {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = niceMax(Math.max(...days.map((d) => d.input_tokens + d.output_tokens)));
  const ticks = [1, 0.5, 0];
  const labelEvery = Math.ceil(days.length / 6);
  const active = hovered === null ? null : (days[hovered] ?? null);

  return (
    <figure>
      <figcaption className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Tokens por día</span>
        <span className="flex gap-3">
          {SERIES.map((series) => (
            <span key={series.key} className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: series.color }} />
              {series.label}
            </span>
          ))}
        </span>
      </figcaption>

      <div className="mt-3 flex gap-2">
        <div className="flex flex-col justify-between text-right text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400" style={{ height: PLOT_HEIGHT }}>
          {ticks.map((tick) => (
            <span key={tick} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {COMPACT.format(max * tick)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative border-b border-zinc-300 dark:border-zinc-600" style={{ height: PLOT_HEIGHT }} onPointerLeave={() => setHovered(null)}>
            {ticks.slice(0, -1).map((tick) => (
              <span key={tick} className="absolute inset-x-0 border-t border-zinc-200 dark:border-zinc-700/70" style={{ top: `${(1 - tick) * 100}%` }} />
            ))}
            <div className="absolute inset-0 flex items-end">
              {days.map((day, index) => (
                <div
                  key={day.date}
                  onPointerEnter={() => setHovered(index)}
                  className={`flex h-full min-w-0 flex-1 flex-col-reverse items-center gap-[2px] px-[1px] ${hovered === index ? "bg-zinc-900/5 dark:bg-white/5" : ""}`}
                >
                  {SERIES.map((series, position) => {
                    const value = day[series.key];
                    if (value <= 0) return null;
                    const isTop = position === SERIES.length - 1 || SERIES.slice(position + 1).every((above) => day[above.key] <= 0);
                    return <span key={series.key} className={`w-full max-w-6 ${isTop ? "rounded-t-[4px]" : ""}`} style={{ height: `${(value / max) * 100}%`, minHeight: 2, background: series.color }} />;
                  })}
                </div>
              ))}
            </div>
            {active && hovered !== null && (
              <div
                role="status"
                className="pointer-events-none absolute top-1 z-10 w-40 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-xs shadow-lg"
                style={hovered < days.length / 2 ? { left: `calc(${((hovered + 1) / days.length) * 100}% + 6px)` } : { right: `calc(${((days.length - hovered) / days.length) * 100}% + 6px)` }}
              >
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatDay(active.date)}</p>
                {SERIES.map((series) => (
                  <p key={series.key} className="mt-1 flex items-center justify-between gap-2 text-zinc-600 dark:text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm" style={{ background: series.color }} />
                      {series.label}
                    </span>
                    <span className="tabular-nums text-zinc-900 dark:text-zinc-100">{FULL.format(active[series.key])}</span>
                  </p>
                ))}
                <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                  {active.requests} {active.requests === 1 ? "petición" : "peticiones"}
                </p>
              </div>
            )}
          </div>
          <div className="mt-1 flex text-[10px] text-zinc-500 dark:text-zinc-400">
            {days.map((day, index) => (
              <span key={day.date} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center">
                {index % labelEvery === 0 ? formatDay(day.date) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}

/**
 * Horizontal bars ranking models by total tokens, with exact values.
 * @param models - Usage per model, largest first
 * @returns Chart element
 */
function ModelTokensChart({ models }: { models: AiUsageModel[] }): React.ReactNode {
  const max = Math.max(...models.map((m) => m.input_tokens + m.output_tokens), 1);
  return (
    <figure>
      <figcaption className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Tokens por modelo</figcaption>
      <ul className="mt-3 flex flex-col gap-2.5">
        {models.map((model) => {
          const total = model.input_tokens + model.output_tokens;
          return (
            <li key={`${model.provider}/${model.model}`} title={`${FULL.format(model.input_tokens)} de entrada · ${FULL.format(model.output_tokens)} de salida · ${model.requests} peticiones`}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-zinc-700 dark:text-zinc-200">
                  {model.model} <span className="text-zinc-500 dark:text-zinc-400">· {model.provider}</span>
                </span>
                <span className="shrink-0 tabular-nums font-medium text-zinc-900 dark:text-zinc-100">{FULL.format(total)}</span>
              </div>
              <div className="mt-1 h-2">
                <div className="h-full rounded-r-[4px]" style={{ width: `${Math.max(1, (total / max) * 100)}%`, background: "var(--chart-1)" }} />
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

/**
 * Token usage dashboard: headline totals, tokens per day and tokens per model.
 * @param summary - Usage summary for the selected period
 * @returns Dashboard element
 */
export function UsageCharts({ summary }: { summary: AiUsageSummary }): React.ReactNode {
  if (summary.requests === 0) {
    return <p className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">Aún no hay consumo en este periodo. Abre el asistente en el editor para empezar.</p>;
  }
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Tokens totales" value={summary.input_tokens + summary.output_tokens} />
        <StatTile label="Entrada" value={summary.input_tokens} />
        <StatTile label="Salida" value={summary.output_tokens} />
        <StatTile label="Peticiones" value={summary.requests} />
      </div>
      <DailyTokensChart days={summary.by_day} />
      <ModelTokensChart models={summary.by_model} />
      {summary.has_estimates && <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">Algunas cifras son estimadas porque el proveedor no informó del consumo exacto de esas peticiones.</p>}
    </div>
  );
}
