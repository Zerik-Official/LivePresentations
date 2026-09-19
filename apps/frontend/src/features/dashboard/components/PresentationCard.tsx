import { FiDownload } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import { TooltipSimple } from "@/components/ui/Tooltip";
import { DashboardPreview } from "@/components/DashboardPreview";
import { parsePresentationData } from "@/lib/presentation/parser";
import type { Presentation } from "@/types/backend";

interface Props {
  /** Presentation entity */
  presentation: Presentation;
  /** Edit handler */
  onEdit: (p: Presentation) => void;
  /** Room creation handler */
  onCreateRoom: (id: string) => void;
  /** Export handler */
  onExport: (p: Presentation) => void;
  /** Delete handler */
  onDelete: (id: string) => void;
  /** Preload assets on hover */
  onPreload: (data: Record<string, unknown>) => void;
}

/**
 * Card rendering presentation preview and actions.
 * @param presentation - Presentation
 * @param onEdit - Edit callback
 * @param onCreateRoom - Create room callback
 * @param onExport - Export callback
 * @param onDelete - Delete callback
 * @param onPreload - Preload callback
 */
export function PresentationCard({ presentation, onEdit, onCreateRoom, onExport, onDelete, onPreload }: Props): React.ReactNode {
  const parsed = (() => {
    try {
      return parsePresentationData(presentation.data);
    } catch {
      return null;
    }
  })();
  const firstSlide = parsed?.slides[0] ?? null;
  const slidesCount = parsed?.slides.length ?? 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600">
      <div className="relative aspect-video overflow-hidden bg-zinc-50 dark:bg-zinc-900">
        {firstSlide ? (
          <>
            <DashboardPreview slide={firstSlide} />
            <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-zinc-900/80 dark:bg-white/90 px-2 py-0.5 text-[10px] font-medium text-white dark:text-zinc-900 backdrop-blur">
              {slidesCount} {slidesCount === 1 ? "slide" : "slides"}
            </span>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">Sin diapositivas</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100" title={presentation.title}>
          {presentation.title}
        </h3>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{new Date(presentation.updated_at).toLocaleDateString()}</span>
      </div>
      <div className="flex items-center gap-1.5 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/50 p-2">
        <TooltipSimple content="Editar presentación" side="top">
          <Button variant="secondary" size="sm" onClick={() => onEdit(presentation)} onMouseEnter={() => onPreload(presentation.data)} className="flex-1 cursor-pointer px-2 py-1 text-xs">
            Editar
          </Button>
        </TooltipSimple>
        <TooltipSimple content="Exportar" side="top">
          <Button variant="secondary" size="sm" onClick={() => onExport(presentation)} className="cursor-pointer px-2 py-1 text-xs">
            <FiDownload size={12} />
          </Button>
        </TooltipSimple>
        <TooltipSimple content="Crear sala" side="top">
          <Button variant="primary" size="sm" onClick={() => void onCreateRoom(presentation.id)} className="cursor-pointer px-2 py-1 text-xs">
            Crear sala
          </Button>
        </TooltipSimple>
        <TooltipSimple content="Borrar presentación" side="top">
          <Button variant="danger" size="sm" onClick={() => onDelete(presentation.id)} className="cursor-pointer px-2 py-1 text-xs">
            Borrar
          </Button>
        </TooltipSimple>
      </div>
    </div>
  );
}
