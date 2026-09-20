import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiPlus } from "react-icons/fi";

import { TooltipSimple } from "@/components/ui/Tooltip";
import type { PresentationData, Slide } from "@/types/presentation";
import { SlideCard } from "./SlideCard";

interface Props {
  data: PresentationData;
  activeSlide: number;
  onSelect: (idx: number) => void;
  onAdd: () => void;
  onDelete: (idx: number) => void;
  onDuplicate: (idx: number) => void;
  onReorder: (activeId: string, overId: string) => void;
  onUpdateSlide?: (idx: number, nextSlide: Slide) => boolean;
}

/**
 * Single sortable wrapper for a slide card.
 * @param id - Slide id
 * @param index - Position
 */
function SortableSlide({
  id,
  index,
  data,
  activeSlide,
  onSelect,
  onDelete,
  onDuplicate,
  onUpdateSlide,
}: {
  id: string;
  index: number;
  data: PresentationData;
  activeSlide: number;
  onSelect: (idx: number) => void;
  onDelete: (idx: number) => void;
  onDuplicate: (idx: number) => void;
  onUpdateSlide?: (idx: number, nextSlide: Slide) => boolean;
}): React.ReactNode {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const slide = data.slides[index];
  if (!slide) return null;
  return (
    <div ref={setNodeRef} style={style}>
      <SlideCard
        slide={slide}
        index={index}
        active={index === activeSlide}
        onSelect={() => onSelect(index)}
        onDuplicate={() => onDuplicate(index)}
        onDelete={() => onDelete(index)}
        onUpdateSlide={onUpdateSlide ? (next) => onUpdateSlide(index, next) : undefined}
        dragListeners={listeners as unknown as Record<string, unknown>}
        dragAttributes={attributes as unknown as Record<string, unknown>}
      />
    </div>
  );
}

/**
 * Sidebar list of slide thumbnails supporting drag reorder.
 * @param data - Presentation data
 * @param activeSlide - Active index
 * @param onSelect - Select handler
 * @param onAdd - Add handler
 * @param onDelete - Delete handler
 * @param onDuplicate - Duplicate handler
 * @param onReorder - Reorder handler
 */
export function SlidesList({ data, activeSlide, onSelect, onAdd, onDelete, onDuplicate, onReorder, onUpdateSlide }: Props): React.ReactNode {
  /**
   * Handle drag end to reorder slides.
   * @param event - Drag end event
   */
  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-3 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Diapositivas</h3>
        <TooltipSimple content="Añadir diapositiva" side="right">
          <button type="button" onClick={onAdd} className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700">
            <FiPlus size={12} />
          </button>
        </TooltipSimple>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={data.slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {data.slides.map((s, idx) => (
                <SortableSlide key={s.id} id={s.id} index={idx} data={data} activeSlide={activeSlide} onSelect={onSelect} onDelete={onDelete} onDuplicate={onDuplicate} onUpdateSlide={onUpdateSlide} />
              ))}
              {data.slides.length === 0 && <p className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">Sin diapositivas. Crea una.</p>}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </aside>
  );
}
