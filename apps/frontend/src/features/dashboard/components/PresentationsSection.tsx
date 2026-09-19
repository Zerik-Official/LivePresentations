import { FiPlus, FiUpload } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import { TooltipSimple } from "@/components/ui/Tooltip";
import type { Presentation } from "@/types/backend";

import { PresentationCard } from "./PresentationCard";

interface Props {
  /** Presentations list */
  presentations: Presentation[];
  /** Draft title */
  title: string;
  /** Title change */
  onTitleChange: (v: string) => void;
  /** Create handler */
  onCreate: () => void;
  /** Import modal trigger */
  onImport: () => void;
  /** Edit handler */
  onEdit: (p: Presentation) => void;
  /** Create room handler */
  onCreateRoom: (id: string) => void;
  /** Export handler */
  onExport: (p: Presentation) => void;
  /** Delete handler */
  onDelete: (id: string) => void;
  /** Preload handler */
  onPreload: (data: Record<string, unknown>) => void;
}

/**
 * Section listing presentations with creation form and grid.
 * @param presentations - List
 * @param title - Draft title
 * @param onTitleChange - Title setter
 * @param onCreate - Create callback
 * @param onImport - Import trigger
 * @param onEdit - Edit callback
 * @param onCreateRoom - Room callback
 * @param onExport - Export callback
 * @param onDelete - Delete callback
 * @param onPreload - Preload callback
 */
export function PresentationsSection({ presentations, title, onTitleChange, onCreate, onImport, onEdit, onCreateRoom, onExport, onDelete, onPreload }: Props): React.ReactNode {
  return (
    <section className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Mis presentaciones</h2>
        <div className="flex items-center gap-2">
          <TooltipSimple content="Importar presentación" side="top">
            <Button variant="secondary" size="sm" onClick={onImport} className="cursor-pointer text-xs">
              <FiUpload /> Importar
            </Button>
          </TooltipSimple>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Título de la presentación"
          className="flex-1 rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-300"
        />
        <TooltipSimple content="Crear nueva presentación" side="top">
          <Button variant="primary" size="md" onClick={() => void onCreate()} className="cursor-pointer">
            <FiPlus /> Crear
          </Button>
        </TooltipSimple>
      </div>

      {presentations.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-10 text-center">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sin presentaciones aún</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Crea tu primera presentación para empezar a diseñar.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {presentations.map((p) => (
            <PresentationCard key={p.id} presentation={p} onEdit={onEdit} onCreateRoom={onCreateRoom} onExport={onExport} onDelete={onDelete} onPreload={onPreload} />
          ))}
        </div>
      )}
    </section>
  );
}
