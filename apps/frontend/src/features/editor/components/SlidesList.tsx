import { FiPlus, FiTrash2 } from "react-icons/fi";

import type { PresentationData } from "../../../types/presentation";

interface Props {
  data: PresentationData;
  activeSlide: number;
  onSelect: (idx: number) => void;
  onAdd: () => void;
  onDelete: (idx: number) => void;
  onDuplicate: (idx: number) => void;
}

/**
 * List of slides with actions.
 * @param data - Presentation data
 * @param activeSlide - Active index
 */
export function SlidesList({ data, activeSlide, onSelect, onAdd, onDelete, onDuplicate }: Props): React.ReactNode {
  return (
    <aside className="w-56 border-r border-zinc-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Diapositivas</h3>
        <button type="button" onClick={onAdd} className="rounded-md border border-zinc-200 p-1.5 hover:bg-zinc-50">
          <FiPlus />
        </button>
      </div>
      <div className="space-y-2">
        {data.slides.map((s, idx) => (
          <div
            key={s.id}
            className={`rounded-lg border p-2 text-xs ${idx === activeSlide ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-zinc-50"}`}
          >
            <button type="button" onClick={() => onSelect(idx)} className="w-full text-left">
              <div className="font-medium">Diapositiva {idx + 1}</div>
              <div className="truncate text-[10px] opacity-70">{s.elements.length} elementos</div>
            </button>
            <div className="mt-1 flex gap-1">
              <button type="button" onClick={() => onDuplicate(idx)} className="rounded bg-white px-1.5 py-0.5 text-[10px] text-zinc-700">
                Duplicar
              </button>
              <button type="button" onClick={() => onDelete(idx)} className="rounded bg-white px-1.5 py-0.5 text-[10px] text-red-600">
                <FiTrash2 className="inline" />
              </button>
            </div>
          </div>
        ))}
        {data.slides.length === 0 && <p className="text-xs text-zinc-500">Sin diapositivas. Crea una.</p>}
      </div>
    </aside>
  );
}
