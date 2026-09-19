import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiLink2, FiX } from "react-icons/fi";

import { Select } from "@/components/ui/Select";
import { TooltipSimple } from "@/components/ui/Tooltip";
import { buildElementTree, getDescendantIds } from "@/lib/presentation/hierarchy";
import type { Slide } from "@/types/presentation";

interface Props {
  slide: Slide | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (id: string, dir: 1 | -1) => void;
  onSort?: (activeId: string, overId: string) => void;
  onSetParent?: (childId: string, parentId: string | null) => void;
}

/**
 * Sortable layer item with hierarchy indent and parent controls.
 * @param id - Element id
 * @param type - Element type
 * @param selected - Whether selected
 * @param depth - Hierarchy depth
 * @param parentId - Parent id
 * @param hasChildren - Has children flag
 */
function SortableLayer({
  id,
  type,
  selected,
  onSelect,
  depth,
  parentId,
  hasChildren,
  childrenCount,
}: {
  id: string;
  type: string;
  selected: boolean;
  onSelect: (id: string) => void;
  depth: number;
  parentId: string | null | undefined;
  hasChildren: boolean;
  childrenCount: number;
}): React.ReactNode {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: depth * 14,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1" {...attributes}>
      {depth > 0 ? <span className="h-px w-3 shrink-0 bg-zinc-300 dark:bg-zinc-600" /> : null}
      <button type="button" {...listeners} className="cursor-grab rounded border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-1 text-[10px] text-zinc-500 dark:text-zinc-400">
        ≡
      </button>
      <button
        type="button"
        onClick={() => onSelect(id)}
        className={`flex flex-1 cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-xs ${selected ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"}`}
      >
        <span className="truncate">
          {type} · {id.slice(0, 6)}
        </span>
        {hasChildren ? <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-zinc-900">{childrenCount}</span> : null}
        {parentId ? <FiLink2 size={10} className="opacity-60" /> : null}
      </button>
    </div>
  );
}

/**
 * Recursive tree renderer for layered view.
 * @param nodes - Tree nodes
 * @param selectedId - Selected id
 * @param onSelect - Select handler
 * @param depth - Current depth
 */
function TreeLayers({
  nodes,
  selectedId,
  onSelect,
  depth = 0,
}: {
  nodes: Array<ReturnType<typeof buildElementTree>[number]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  depth?: number;
}): React.ReactNode {
  return (
    <>
      {nodes.map((node) => (
        <div key={node.id} className="flex flex-col gap-1">
          <SortableLayer
            id={node.id}
            type={node.type}
            selected={selectedId === node.id}
            onSelect={onSelect}
            depth={depth}
            parentId={node.parentId}
            hasChildren={node.children.length > 0}
            childrenCount={node.children.length}
          />
          {node.children.length > 0 ? <TreeLayers nodes={node.children as never} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} /> : null}
        </div>
      ))}
    </>
  );
}

/**
 * Layers panel with drag-reorder and parent/child management.
 * @param slide - Active slide
 * @param selectedId - Selected element id
 * @param onSelect - Select handler
 * @param onReorder - Reorder handler
 * @param onSort - Sort handler
 * @param onSetParent - Parent link handler
 */
export function Layers({ slide, selectedId, onSelect, onReorder, onSort, onSetParent }: Props): React.ReactNode {
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

  const selected = slide.elements.find((e) => e.id === selectedId) ?? null;
  const tree = buildElementTree(slide.elements);
  const descendantIds = selected ? new Set(getDescendantIds(slide.elements, selected.id)) : new Set<string>();
  const parentOptions = slide.elements
    .filter((e) => e.id !== selected?.id && !descendantIds.has(e.id))
    .map((e) => ({ value: e.id, label: `${e.type} · ${e.id}` }));
  const withEmpty = [{ value: "__none__", label: "Sin padre" }, ...parentOptions];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Capas (arrastra ≡ para reordenar)</h4>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slide.elements.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-2 flex flex-col gap-1">
            {slide.elements.length === 0 ? (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Sin elementos</span>
            ) : (
              <TreeLayers nodes={tree} selectedId={selectedId} onSelect={onSelect} />
            )}
          </div>
        </SortableContext>
      </DndContext>
      <div className="mt-2 flex gap-1">
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Usa ↑↓ o arrastra para cambiar zIndex</span>
      </div>

      {selected && onSetParent ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-3">
          <h5 className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Jerarquía</h5>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">Vincula este elemento a un padre. Al mover el padre, los hijos se desplazan con él.</p>
          <div className="mt-2 flex min-w-0 flex-col gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-zinc-600 dark:text-zinc-300">Padre</span>
              <div className="min-w-0 flex-1 overflow-hidden">
                <Select
                  value={selected.parentId ?? "__none__"}
                  options={withEmpty}
                  onChange={(v) => onSetParent(selected.id, v === "__none__" ? null : v)}
                  placeholder="Sin padre"
                />
              </div>
            </div>
            {selected.parentId ? (
              <TooltipSimple content="Desvincular del padre" side="top">
                <button
                  type="button"
                  onClick={() => onSetParent(selected.id, null)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
                >
                  <FiX size={12} /> Desvincular
                </button>
              </TooltipSimple>
            ) : null}
            {(() => {
              const children = slide.elements.filter((e) => e.parentId === selected.id);
              return children.length > 0 ? (
                <div className="mt-1">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Hijos ({children.length})</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {children.map((c) => (
                      <span key={c.id} className="inline-flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-700 dark:text-zinc-300">
                        {c.type} · {c.id.slice(0, 6)}
                        <button type="button" onClick={() => onSetParent(c.id, null)} className="cursor-pointer rounded-full p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                          <FiX size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}