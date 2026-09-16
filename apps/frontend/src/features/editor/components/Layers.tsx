import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Slide } from "../../../types/presentation";

interface Props {
  slide: Slide | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (id: string, dir: 1 | -1) => void;
  onSort?: (activeId: string, overId: string) => void;
}

/**
 * Sortable layer item.
 * @param id - Element id
 * @param type - Element type
 * @param selected - Whether selected
 */
function SortableLayer({ id, type, selected, onSelect }: { id: string; type: string; selected: boolean; onSelect: (id: string) => void }): React.ReactNode {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1" {...attributes}>
      <button type="button" {...listeners} className="cursor-grab rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-1 text-[10px] text-zinc-500 dark:text-zinc-400">
        ≡
      </button>
      <button
        type="button"
        onClick={() => onSelect(id)}
        className={`flex-1 rounded-full border px-3 py-1 text-xs ${selected ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"}`}
      >
        {type} · {id.slice(0, 6)}
      </button>
    </div>
  );
}

/**
 * Layers panel with drag-reorder.
 * @param slide - Active slide
 * @param selectedId - Selected element id
 */
export function Layers({ slide, selectedId, onSelect, onReorder, onSort }: Props): React.ReactNode {
  if (!slide) return null;

  /**
   * Handle sortable drag end to reorder.
   * @param event - Drag end event
   */
  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (onSort) {
      onSort(String(active.id), String(over.id));
      return;
    }
    const oldIndex = slide!.elements.findIndex((e) => e.id === active.id);
    const newIndex = slide!.elements.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const dir = newIndex > oldIndex ? 1 : -1;
    onReorder(slide!.elements[oldIndex]!.id, dir);
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Capas (arrastra ≡ para reordenar)</h4>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slide.elements.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-2 flex flex-col gap-1">
            {slide.elements.map((el) => (
              <SortableLayer key={el.id} id={el.id} type={el.type} selected={selectedId === el.id} onSelect={onSelect} />
            ))}
            {slide.elements.length === 0 && <span className="text-xs text-zinc-500 dark:text-zinc-400">Sin elementos</span>}
          </div>
        </SortableContext>
      </DndContext>
      <div className="mt-2 flex gap-1">
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Usa ↑↓ o arrastra para cambiar zIndex</span>
      </div>
    </div>
  );
}
