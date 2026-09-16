import type { Slide } from "../../../types/presentation";

interface Props {
  slide: Slide | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (id: string, dir: 1 | -1) => void;
}

/**
 * Layers panel for current slide.
 * @param slide - Active slide
 * @param selectedId - Selected element id
 */
export function Layers({ slide, selectedId, onSelect, onReorder }: Props): React.ReactNode {
  if (!slide) return null;
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Capas</h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {slide.elements.map((el) => (
          <div key={el.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelect(el.id)}
              className={`rounded-full border px-3 py-1 text-xs ${selectedId === el.id ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"}`}
            >
              {el.type} · {el.id.slice(0, 6)}
            </button>
            <button type="button" onClick={() => onReorder(el.id, 1)} className="rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-1 text-[10px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700">
              ↑
            </button>
            <button type="button" onClick={() => onReorder(el.id, -1)} className="rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-1 text-[10px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700">
              ↓
            </button>
          </div>
        ))}
        {slide.elements.length === 0 && <span className="text-xs text-zinc-500 dark:text-zinc-400">Sin elementos</span>}
      </div>
    </div>
  );
}
