import { useState } from "react";
import { FiTrash2, FiUpload } from "react-icons/fi";

import { Select } from "../../../components/ui/Select";
import { uploadFile } from "../../../lib/api";
import type { SlideElement } from "../../../types/presentation";
import { LANGUAGES, resolveLang } from "../../../lib/prism";

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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
        <div className="space-y-2">
          <label className="block text-xs">
            URL imagen <input value={(selected.props as { src?: string }).src ?? ""} onChange={(e) => onPatch({ propsPatch: { src: e.target.value } })} className="mt-1 w-full rounded border bg-(--input-bg) border-(--input-border) text-(--input-text) px-2 py-1" />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700">
            <FiUpload /> {uploading ? "Subiendo..." : "Subir imagen (max 100MB)"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 100 * 1024 * 1024) {
                  setUploadError("Archivo excede 100MB");
                  return;
                }
                setUploading(true);
                setUploadError(null);
                try {
                  const { url } = await uploadFile(file);
                  onPatch({ propsPatch: { src: url } });
                } catch (err) {
                  setUploadError(err instanceof Error ? err.message : "Error al subir");
                } finally {
                  setUploading(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
          {(selected.props as { src?: string }).src && <img src={(selected.props as { src: string }).src} alt="" className="mt-1 max-h-32 w-full rounded border object-cover" />}
        </div>
      )}

      {selected.type === "video" && (
        <div className="space-y-2">
          <label className="block text-xs">
            URL video <input value={(selected.props as { src?: string }).src ?? ""} onChange={(e) => onPatch({ propsPatch: { src: e.target.value } })} className="mt-1 w-full rounded border bg-(--input-bg) border-(--input-border) text-(--input-text) px-2 py-1" />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700">
            <FiUpload /> {uploading ? "Subiendo..." : "Subir video (max 100MB)"}
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 100 * 1024 * 1024) {
                  setUploadError("Archivo excede 100MB");
                  return;
                }
                setUploading(true);
                setUploadError(null);
                try {
                  const { url } = await uploadFile(file);
                  onPatch({ propsPatch: { src: url } });
                } catch (err) {
                  setUploadError(err instanceof Error ? err.message : "Error al subir");
                } finally {
                  setUploading(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        </div>
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
              <Select value={(selected.props as { bg?: string }).bg ?? "transparent"} options={[{ value: "transparent", label: "Sin fondo" },{ value: "solid", label: "Con fondo" }]} onChange={(v) => onPatch({ propsPatch: { bg: v } })} placeholder="Fondo" />
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
            Lenguaje
            <Select value={resolveLang((selected.props as { language?: string }).language)} options={LANGUAGES} onChange={(v) => onPatch({ propsPatch: { language: v } })} placeholder="Lenguaje" />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={Boolean((selected.props as { lineNumbers?: boolean }).lineNumbers)}
              onChange={(e) => onPatch({ propsPatch: { lineNumbers: e.target.checked } })}
            />
            Números de línea
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
