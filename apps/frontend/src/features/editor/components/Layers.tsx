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
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Capas</h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {slide.elements.map((el) => (
          <div key={el.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelect(el.id)}
              className={`rounded-full border px-3 py-1 text-xs ${selectedId === el.id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white"}`}
            >
              {el.type} · {el.id.slice(0, 6)}
            </button>
            <button type="button" onClick={() => onReorder(el.id, 1)} className="rounded border px-1 text-[10px]">
              ↑
            </button>
            <button type="button" onClick={() => onReorder(el.id, -1)} className="rounded border px-1 text-[10px]">
              ↓
            </button>
          </div>
        ))}
        {slide.elements.length === 0 && <span className="text-xs text-zinc-500">Sin elementos</span>}
      </div>
    </div>
  );
}
