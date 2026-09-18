import { useEffect, useMemo, useState } from "react";
import { FiCopy, FiEdit3, FiTrash2 } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import { CodeEditorModal } from "@/components/ui/CodeEditorModal";
import { TooltipSimple } from "@/components/ui/Tooltip";
import type { PresentationData, Slide, SlideElement } from "@/types/presentation";
import { elementSchema, getSubtree } from "@/types/presentation";
import { CodeProperties } from "../elements/code/CodeProperties";
import { IconProperties } from "../elements/icon/IconProperties";
import { ImageProperties } from "../elements/image/ImageProperties";
import { ShapeProperties } from "../elements/shape/ShapeProperties";
import { SpecialsProperties } from "../elements/specials/SpecialsProperties";
import { TextProperties } from "../elements/text/TextProperties";
import { VideoProperties } from "../elements/video/VideoProperties";

type Tab = "general" | "code";

interface Props {
  selected: SlideElement | null;
  onPatch: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
  onPatchId?: (newId: string) => boolean;
  onReplace?: (next: SlideElement) => boolean;
  onDelete: () => void;
  data?: PresentationData | null;
  slide?: Slide | null;
}

/**
 * Dispatcher panel that delegates to per-type property editors with tabs.
 * @param selected - Selected element
 * @param onPatch - Patch handler
 * @param onPatchId - Id change handler
 * @param onReplace - Full replace handler for JSON editing
 * @param onDelete - Delete handler
 * @param data - Full presentation data
 * @param slide - Active slide for subtree resolution
 */
export function PropertiesPanel({ selected, onPatch, onPatchId, onReplace, onDelete, data, slide }: Props): React.ReactNode {
  const [tab, setTab] = useState<Tab>("general");
  const [idDraft, setIdDraft] = useState(selected?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setIdDraft(selected?.id ?? "");
    setJsonError(null);
  }, [selected?.id]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  const subtreeJson = useMemo(() => {
    if (!selected) return "";
    if (slide) {
      const subtree = getSubtree(slide.elements, selected.id);
      if (subtree.length > 1) return JSON.stringify({ element: selected, children: subtree.filter((e) => e.id !== selected.id) }, null, 2);
    }
    return JSON.stringify(selected, null, 2);
  }, [selected, slide]);

  const jsonForEditor = useMemo(() => {
    if (!selected) return "";
    return JSON.stringify(selected, null, 2);
  }, [selected]);

  if (!selected) return <p className="text-xs text-zinc-500 dark:text-zinc-400">Selecciona un elemento en el canvas o en capas.</p>;

  /**
   * Handle id change commit.
   */
  function handleIdCommit(): void {
    if (!onPatchId || !selected) return;
    const ok = onPatchId(idDraft);
    if (!ok) {
      setIdDraft(selected.id);
      setJsonError("ID inválido o ya existe");
    } else setJsonError(null);
  }

  /**
   * Copy element and its children to clipboard.
   */
  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(subtreeJson);
      setCopied(true);
    } catch {
      setJsonError("No se pudo copiar");
    }
  }

  /**
   * Save JSON from modal editor.
   * @param value - Raw JSON string
   */
  function handleJsonSave(value: string): void {
    try {
      const parsed: unknown = JSON.parse(value);
      const result = elementSchema.safeParse(parsed);
      if (!result.success) {
        setJsonError(result.error.issues.map((i) => i.message).join(", "));
        return;
      }
      if (onReplace) {
        const ok = onReplace(result.data);
        if (!ok) setJsonError("ID duplicado");
        else setJsonError(null);
      }
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "JSON inválido");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1">
        <button
          type="button"
          onClick={() => setTab("general")}
          className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === "general" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setTab("code")}
          className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === "code" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
        >
          Código
        </button>
      </div>

      {tab === "general" ? (
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
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Código</h4>

          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <span>ID del elemento</span>
            <div className="flex gap-2">
              <input
                value={idDraft}
                onChange={(e) => setIdDraft(e.target.value)}
                onBlur={handleIdCommit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleIdCommit();
                }}
                placeholder="el-123"
                className="flex-1 rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-xs outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
              />
              <Button variant="secondary" size="sm" onClick={handleIdCommit} className="cursor-pointer">
                Guardar
              </Button>
            </div>
          </label>

          {jsonError ? <p className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2 text-xs text-red-700 dark:text-red-300">{jsonError}</p> : null}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => void handleCopy()} className="cursor-pointer">
              <FiCopy /> {copied ? "Copiado" : "Copiar propiedades"}
            </Button>
            <Button variant="primary" size="sm" onClick={() => setJsonOpen(true)} className="cursor-pointer">
              <FiEdit3 /> Editar propiedades
            </Button>
          </div>

          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
            <div className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5">
              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">JSON · incluye hijos si existen</span>
            </div>
            <pre className="max-h-64 overflow-auto p-3 text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300">{subtreeJson}</pre>
          </div>

          <CodeEditorModal open={jsonOpen} value={jsonForEditor} language="json" onClose={() => setJsonOpen(false)} onSave={(v) => handleJsonSave(v)} />
        </div>
      )}
    </div>
  );
}