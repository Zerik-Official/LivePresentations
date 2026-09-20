import { DndContext, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiDownload, FiSave, FiUpload } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { TooltipSimple } from "@/components/ui/Tooltip";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ExportPresentationModal } from "@/components/ExportPresentationModal";
import { ImportPresentationModal } from "@/components/ImportPresentationModal";
import { presentationsApi } from "@/lib/api";
import { getDescendantIds } from "@/lib/presentation/hierarchy";
import { parsePresentationData } from "@/lib/presentation/parser";
import type { Presentation } from "@/types/backend";
import type { PresentationData, Slide } from "@/types/presentation";
import { DraggableElement } from "./DraggableElement";
import { EditorSidebar } from "./components/EditorSidebar";
import { PropertiesOverlay } from "./components/PropertiesOverlay";
import { SlidesList } from "./components/SlidesList";
import { Toolbar } from "./components/Toolbar";
import { useCanvasDrop } from "./hooks/useCanvasDrop";
import { useElements } from "./hooks/useElements";
import { useKeyboardDelete } from "./hooks/useKeyboardDelete";
import { useSlides } from "./hooks/useSlides";

/**
 * Modular editor with drag, resize, code/icon support and per-type property editors.
 */
export function EditorPage(): React.ReactNode {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PresentationData | null>(null);
  const [title, setTitle] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSlideIdx, setConfirmSlideIdx] = useState<number | null>(null);
  const [confirmElementOpen, setConfirmElementOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [dragDelta, setDragDelta] = useState<{ x: number; y: number } | null>(null);

  const slide = useMemo(() => (data ? (data.slides[activeSlide] ?? null) : null), [data, activeSlide]);
  const selected = useMemo(() => slide?.elements.find((e) => e.id === selectedId) ?? null, [slide, selectedId]);
  const exportPres = useMemo(() => {
    if (!id || !data) return null;
    return { id, title, data: data as unknown as Record<string, unknown>, owner_id: "", created_at: "", updated_at: "" } as unknown as Presentation;
  }, [id, title, data]);

  const { addSlide, deleteSlide, duplicateSlide, updateBackground, updateTransition, reorderSlides, updateSlide } = useSlides(data, setData, activeSlide, setActiveSlide, setSelectedId);
  const { addElement, patchSelected, patchSelectedId, replaceSelected, replaceSubtree, deleteSelected, handleDragEnd, handleResize, handleReorder, handleSortLayer, setParent } = useElements(
    data,
    setData,
    activeSlide,
    selectedId,
    setSelectedId,
  );
  const { handleCanvasDrop } = useCanvasDrop(data, activeSlide, setData, setSelectedId, setError);

  const descendantIdsForDrag = useMemo(() => {
    if (!slide || !dragActiveId) return new Set<string>();
    return new Set(getDescendantIds(slide.elements, dragActiveId));
  }, [slide, dragActiveId]);

  /**
   * Handle drag start to track active id for descendant follow.
   * @param event - Drag start event
   */
  function onDragStart(event: DragStartEvent): void {
    setDragActiveId(String(event.active.id));
    setDragDelta({ x: 0, y: 0 });
  }

  /**
   * Handle drag move to sync children.
   * @param event - Drag move event
   */
  function onDragMove(event: DragMoveEvent): void {
    setDragDelta({ x: event.delta.x, y: event.delta.y });
  }

  /**
   * Handle drag end and reset tracking.
   * @param event - Drag end event
   */
  function onDragEnd(event: DragEndEvent): void {
    setDragActiveId(null);
    setDragDelta(null);
    handleDragEnd(event);
  }

  useKeyboardDelete(selectedId, () => setConfirmElementOpen(true));

  useEffect(() => {
    if (!id) return;
    void presentationsApi
      .get(id)
      .then((p) => {
        setTitle(p.title);
        const parsed = parsePresentationData(p.data);
        setData(parsed);
        void import("@/lib/prism").then(({ highlight, resolveLang }) => {
          const langs = new Set<string>();
          for (const sl of parsed.slides) for (const el of sl.elements) if (el.type === "code") langs.add(resolveLang((el.props as { language?: string }).language));
          for (const l of langs) highlight("const a = 1", l);
          if (langs.size === 0) highlight("const a = 1", "javascript");
        });
        void import("@monaco-editor/react").then(({ loader }) => {
          void loader.init().catch(() => null);
        });
      })
      .catch(() => setError("No se pudo cargar la presentación"));
  }, [id]);

  /**
   * Persist presentation.
   */
  async function handleSave(): Promise<void> {
    if (!id || !data) return;
    setSaving(true);
    setError(null);
    try {
      await presentationsApi.update(id, { title, data: data as unknown as Record<string, unknown> });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }



  if (error && !data)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-950 p-6">
        <p className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  if (!data)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-950">
        <Spinner className="size-7 text-zinc-900 dark:text-white" />
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Cargando editor...</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-500">Preparando diapositivas y resaltado de código</p>
      </div>
    );

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3">
        <TooltipSimple content="Volver al dashboard" side="bottom">
          <Link to="/dashboard" className="inline-flex cursor-pointer rounded-lg border border-zinc-200 dark:border-zinc-700 p-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <FiArrowLeft />
          </Link>
        </TooltipSimple>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
        <ThemeToggle />
        <TooltipSimple content="Importar presentación" side="bottom">
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)} className="cursor-pointer">
            <FiUpload /> Importar
          </Button>
        </TooltipSimple>
        <TooltipSimple content="Exportar presentación" side="bottom">
          <Button variant="secondary" size="sm" onClick={() => setExportOpen(true)} className="cursor-pointer">
            <FiDownload /> Exportar
          </Button>
        </TooltipSimple>
        <TooltipSimple content="Guardar presentación" side="bottom">
          <Button variant="primary" size="md" onClick={() => void handleSave()} disabled={saving} className="cursor-pointer">
            <FiSave /> {saving ? "Guardando..." : "Guardar"}
          </Button>
        </TooltipSimple>
      </header>

      {error && <div className="mx-4 mt-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</div>}

      <div className="flex flex-1 overflow-hidden">
        <SlidesList
          data={data}
          activeSlide={activeSlide}
          onSelect={(i) => {
            setActiveSlide(i);
            setSelectedId(null);
          }}
          onAdd={addSlide}
          onDelete={(idx) => setConfirmSlideIdx(idx)}
          onDuplicate={duplicateSlide}
          onReorder={reorderSlides}
          onUpdateSlide={updateSlide}
        />

        <main className="flex flex-1 flex-col items-center overflow-auto p-4 bg-zinc-50 dark:bg-zinc-950">
          <Toolbar onAdd={addElement} disabled={!slide} />
          {slide && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Fondo</span>
              <input type="color" value={slide.background} onChange={(e) => updateBackground(e.target.value)} className="h-7 w-12 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800" />
              <input value={slide.background} onChange={(e) => updateBackground(e.target.value)} placeholder="#ffffff" className="w-24 rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-2 py-1.5 text-xs outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
              <span className="ml-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">Transición</span>
              <div className="w-28">
                <Select value={slide.transition} options={[{ value: "fade", label: "Fade" }, { value: "slide", label: "Slide" }, { value: "zoom", label: "Zoom" }]} onChange={(v) => updateTransition(v as Slide["transition"])} placeholder="Transición" />
              </div>
            </div>
          )}

          <DndContext onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd}>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => void handleCanvasDrop(e)}
              style={{ width: data.width, height: data.height, background: slide?.background ?? "#ffffff" }}
              className="relative mt-4 origin-top scale-[0.55] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white shadow-sm sm:scale-[0.75] lg:scale-100"
            >
              {slide ? (
                slide.elements
                  .slice()
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map((el) => (
                    <DraggableElement
                      key={el.id}
                      element={el}
                      selected={selectedId === el.id}
                      onSelect={setSelectedId}
                      onResize={handleResize}
                      dragDelta={dragDelta}
                      isDescendantOfDragging={descendantIdsForDrag.has(el.id)}
                    />
                  ))
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">Crea una diapositiva</div>
              )}
            </div>
          </DndContext>

          <PropertiesOverlay
            selected={selected}
            onPatch={patchSelected}
            onPatchId={patchSelectedId}
            onReplace={replaceSelected}
            onReplaceSubtree={replaceSubtree}
            onDelete={() => setConfirmElementOpen(true)}
            data={data}
            slide={slide}
          />
        </main>

        <EditorSidebar slide={slide} selectedId={selectedId} onSelect={setSelectedId} onReorder={handleReorder} onSort={handleSortLayer} data={data} onUpdateData={setData} onSetParent={setParent} />
      </div>

      <ConfirmDialog
        open={confirmSlideIdx !== null}
        title="Eliminar diapositiva"
        description={`¿Seguro que quieres borrar la diapositiva ${confirmSlideIdx !== null ? confirmSlideIdx + 1 : ""}? Se eliminarán todos sus elementos.`}
        confirmLabel="Borrar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmSlideIdx(null)}
        onConfirm={() => {
          if (confirmSlideIdx !== null) deleteSlide(confirmSlideIdx);
          setConfirmSlideIdx(null);
        }}
      />
      <ConfirmDialog
        open={confirmElementOpen}
        title="Eliminar elemento"
        description={`¿Seguro que quieres borrar el elemento ${selected?.type ?? ""}? Esta acción no se puede deshacer.`}
        confirmLabel="Borrar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmElementOpen(false)}
        onConfirm={() => {
          deleteSelected();
          setConfirmElementOpen(false);
        }}
      />
      <ExportPresentationModal open={exportOpen} onClose={() => setExportOpen(false)} presentation={exportPres} />
      <ImportPresentationModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(pres) => {
          setTitle(pres.title);
          setData(parsePresentationData(pres.data));
          setActiveSlide(0);
          setSelectedId(null);
        }}
      />
    </div>
  );
}