import { FiTrash2 } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import { TooltipSimple } from "@/components/ui/Tooltip";
import type { PresentationData, SlideElement } from "@/types/presentation";
import { CodeProperties } from "../elements/code/CodeProperties";
import { IconProperties } from "../elements/icon/IconProperties";
import { ImageProperties } from "../elements/image/ImageProperties";
import { ShapeProperties } from "../elements/shape/ShapeProperties";
import { SpecialsProperties } from "../elements/specials/SpecialsProperties";
import { TextProperties } from "../elements/text/TextProperties";
import { VideoProperties } from "../elements/video/VideoProperties";

interface Props {
  selected: SlideElement | null;
  onPatch: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
  onDelete: () => void;
  data?: PresentationData | null;
}

/**
 * Dispatcher panel that delegates to per-type property editors.
 * @param selected - Selected element
 * @param onPatch - Patch handler
 * @param onDelete - Delete handler
 */
export function PropertiesPanel({ selected, onPatch, onDelete, data }: Props): React.ReactNode {
  if (!selected) return <p className="text-xs text-zinc-500 dark:text-zinc-400">Selecciona un elemento en el canvas o en capas.</p>;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Elemento: {selected.type}</h4>

      <div className="grid grid-cols-4 gap-2">
        <TooltipSimple content="Posición en X" side="top">
          <label className="flex flex-col items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <span>X</span>
            <input type="number" value={selected.x} onChange={(e) => onPatch({ x: Number(e.target.value) })} className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-2 py-1.5 text-center text-xs outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
          </label>
        </TooltipSimple>
        <TooltipSimple content="Posición en Y" side="top">
          <label className="flex flex-col items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <span>Y</span>
            <input type="number" value={selected.y} onChange={(e) => onPatch({ y: Number(e.target.value) })} className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-2 py-1.5 text-center text-xs outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
          </label>
        </TooltipSimple>
        <TooltipSimple content="Anchura" side="top">
          <label className="flex flex-col items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <span>W</span>
            <input type="number" value={selected.w} onChange={(e) => onPatch({ w: Number(e.target.value) })} className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-2 py-1.5 text-center text-xs outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
          </label>
        </TooltipSimple>
        <TooltipSimple content="Altura" side="top">
          <label className="flex flex-col items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <span>H</span>
            <input type="number" value={selected.h} onChange={(e) => onPatch({ h: Number(e.target.value) })} className="w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-2 py-1.5 text-center text-xs outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
          </label>
        </TooltipSimple>
      </div>

      <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Rotación
        <input type="range" min={-180} max={180} value={selected.rotation} onChange={(e) => onPatch({ rotation: Number(e.target.value) })} className="flex-1 cursor-pointer accent-zinc-900 dark:accent-white" />
        <span className="w-10 text-right text-zinc-500 dark:text-zinc-400">{selected.rotation}°</span>
      </label>

      {selected.type === "text" && <TextProperties element={selected} onPatch={onPatch} />}
      {selected.type === "image" && <ImageProperties element={selected} onPatch={onPatch} />}
      {selected.type === "video" && <VideoProperties element={selected} onPatch={onPatch} />}
      {selected.type === "icon" && <IconProperties element={selected} onPatch={onPatch} />}
      {selected.type === "shape" && <ShapeProperties element={selected} onPatch={onPatch} />}
      {selected.type === "code" && <CodeProperties element={selected} onPatch={onPatch} />}
      {selected.type === "specials" && <SpecialsProperties element={selected} onPatch={onPatch} data={data} />}

      <Button variant="danger" size="sm" onClick={onDelete} className="cursor-pointer">
        <FiTrash2 /> Eliminar
      </Button>
    </div>
  );
}