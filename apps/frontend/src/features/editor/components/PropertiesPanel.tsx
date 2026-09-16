import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";

import type { SlideElement } from "../../../types/presentation";

import { IconPickerModal } from "./IconPickerModal";

interface Props {
  selected: SlideElement | null;
  onPatch: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
  onDelete: () => void;
}

/**
 * Properties panel for selected element.
 * @param selected - Selected element
 */
export function PropertiesPanel({ selected, onPatch, onDelete }: Props): React.ReactNode {
  const [iconOpen, setIconOpen] = useState(false);

  if (!selected) return <p className="text-xs text-zinc-500">Selecciona un elemento en el canvas o en capas.</p>;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Elemento: {selected.type}</h4>
      <div className="grid grid-cols-4 gap-2">
        <label className="text-xs">
          X <input type="number" value={selected.x} onChange={(e) => onPatch({ x: Number(e.target.value) })} className="mt-1 w-full rounded border px-2 py-1" />
        </label>
        <label className="text-xs">
          Y <input type="number" value={selected.y} onChange={(e) => onPatch({ y: Number(e.target.value) })} className="mt-1 w-full rounded border px-2 py-1" />
        </label>
        <label className="text-xs">
          W <input type="number" value={selected.w} onChange={(e) => onPatch({ w: Number(e.target.value) })} className="mt-1 w-full rounded border px-2 py-1" />
        </label>
        <label className="text-xs">
          H <input type="number" value={selected.h} onChange={(e) => onPatch({ h: Number(e.target.value) })} className="mt-1 w-full rounded border px-2 py-1" />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs">
        Rotación
        <input type="range" min={-180} max={180} value={selected.rotation} onChange={(e) => onPatch({ rotation: Number(e.target.value) })} className="flex-1" />
        <span>{selected.rotation}°</span>
      </label>

      {selected.type === "text" && (
        <div className="space-y-2">
          <label className="block text-xs">
            Texto <input value={(selected.props as { text?: string }).text ?? ""} onChange={(e) => onPatch({ propsPatch: { text: e.target.value } })} className="mt-1 w-full rounded border px-2 py-1" />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs">
              Tamaño <input type="number" value={(selected.props as { fontSize?: number }).fontSize ?? 32} onChange={(e) => onPatch({ propsPatch: { fontSize: Number(e.target.value) } })} className="mt-1 w-full rounded border px-2 py-1" />
            </label>
            <label className="text-xs">
              Color <input type="color" value={(selected.props as { color?: string }).color ?? "#18181b"} onChange={(e) => onPatch({ propsPatch: { color: e.target.value } })} className="mt-1 h-8 w-full rounded border" />
            </label>
            <label className="flex items-end gap-2 text-xs">
              <input type="checkbox" checked={Boolean((selected.props as { bold?: boolean }).bold)} onChange={(e) => onPatch({ propsPatch: { bold: e.target.checked } })} /> Negrita
            </label>
          </div>
        </div>
      )}

      {selected.type === "image" && (
        <label className="block text-xs">
          URL imagen <input value={(selected.props as { src?: string }).src ?? ""} onChange={(e) => onPatch({ propsPatch: { src: e.target.value } })} className="mt-1 w-full rounded border px-2 py-1" />
        </label>
      )}

      {selected.type === "icon" && (
        <div className="space-y-2">
          <button type="button" onClick={() => setIconOpen(true)} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs">
            Icono: {(selected.props as { name?: string }).name ?? "FaStar"} — clic para cambiar
          </button>
          <IconPickerModal open={iconOpen} onClose={() => setIconOpen(false)} onSelect={(name) => onPatch({ propsPatch: { name } })} />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">
              Color <input type="color" value={(selected.props as { color?: string }).color ?? "#f59e0b"} onChange={(e) => onPatch({ propsPatch: { color: e.target.value } })} className="mt-1 h-8 w-full rounded border" />
            </label>
            <label className="text-xs">
              Tamaño <input type="number" value={(selected.props as { size?: number }).size ?? 48} onChange={(e) => onPatch({ propsPatch: { size: Number(e.target.value) } })} className="mt-1 w-full rounded border px-2 py-1" />
            </label>
            <label className="text-xs">
              Fondo
              <select value={(selected.props as { bg?: string }).bg ?? "transparent"} onChange={(e) => onPatch({ propsPatch: { bg: e.target.value } })} className="mt-1 w-full rounded border px-2 py-1">
                <option value="transparent">Sin fondo</option>
                <option value="solid">Con fondo</option>
              </select>
            </label>
            {(selected.props as { bg?: string }).bg !== "transparent" && (
              <label className="text-xs">
                Color fondo <input type="color" value={(selected.props as { bgColor?: string }).bgColor ?? "#ffffff"} onChange={(e) => onPatch({ propsPatch: { bgColor: e.target.value } })} className="mt-1 h-8 w-full rounded border" />
              </label>
            )}
          </div>
        </div>
      )}

      {selected.type === "code" && (
        <div className="space-y-2">
          <label className="block text-xs">
            Lenguaje <input value={(selected.props as { language?: string }).language ?? "javascript"} onChange={(e) => onPatch({ propsPatch: { language: e.target.value } })} className="mt-1 w-full rounded border px-2 py-1" />
          </label>
          <label className="block text-xs">
            Código <textarea value={(selected.props as { code?: string }).code ?? ""} onChange={(e) => onPatch({ propsPatch: { code: e.target.value } })} rows={5} className="mt-1 w-full rounded border px-2 py-1 font-mono text-xs" />
          </label>
        </div>
      )}

      <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100">
        <FiTrash2 /> Eliminar
      </button>
    </div>
  );
}
