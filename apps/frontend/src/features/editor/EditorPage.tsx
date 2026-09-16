import { DndContext } from "@dnd-kit/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiDownload, FiSave, FiUpload } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";

import { Select } from "../../components/ui/Select";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ThemeToggle } from "../../components/ThemeToggle";
import { getPresentation, updatePresentation } from "../../lib/api";
import { parsePresentationData, type PresentationData, type Slide } from "../../types/presentation";
import { Layers } from "./components/Layers";
import { PropertiesOverlay } from "./components/PropertiesOverlay";
import { SlidesList } from "./components/SlidesList";
import { Toolbar } from "./components/Toolbar";
import { DraggableElement } from "./DraggableElement";
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
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [confirmSlideIdx, setConfirmSlideIdx] = useState<number | null>(null);
  const [confirmElementOpen, setConfirmElementOpen] = useState(false);

  const slide = useMemo(() => (data ? (data.slides[activeSlide] ?? null) : null), [data, activeSlide]);
  const selected = useMemo(() => slide?.elements.find((e) => e.id === selectedId) ?? null, [slide, selectedId]);

  const { addSlide, deleteSlide, duplicateSlide, updateBackground, updateTransition } = useSlides(data, setData, activeSlide, setActiveSlide, setSelectedId);
  const { addElement, patchSelected, deleteSelected, handleDragEnd, handleResize, handleReorder, handleSortLayer } = useElements(data, setData, activeSlide, selectedId, setSelectedId);
  const { handleCanvasDrop } = useCanvasDrop(data, activeSlide, setData, setSelectedId, setError);

  useKeyboardDelete(selectedId, () => setConfirmElementOpen(true));

  useEffect(() => {
    if (!id) return;
    void getPresentation(id)
      .then((p) => {
        setTitle(p.title);
        setData(parsePresentationData(p.data));
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
      await updatePresentation(id, { title, data: data as unknown as Record<string, unknown> });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  /**
   * Export current presentation as JSON.
   */
  function handleExport(): void {
    if (!data) return;
    const blob = new Blob([JSON.stringify({ title, data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_") || "presentacion"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import JSON to replace current presentation data.
   * @param e - File input event
   */
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text) as { title?: string; data?: unknown };
      const parsed = parsePresentationData((json.data ?? json) as unknown);
      setData(parsed);
      if (json.title && typeof json.title === "string") setTitle(json.title);
      setActiveSlide(0);
      setSelectedId(null);
    } catch {
      setError("Error al importar JSON");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (error && !data) return <div className="p-6 text-sm text-red-600 dark:text-red-400">{error}</div>;
  if (!data) return <div className="p-6 text-sm text-zinc-500 dark:text-zinc-400">Cargando editor...</div>;

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3">
        <Link to="/dashboard" className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
          <FiArrowLeft />
        </Link>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
        <ThemeToggle />
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={(e) => void handleImport(e)} />
        <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700">
          <FiUpload /> Importar
        </button>
        <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700">
          <FiDownload /> Exportar
        </button>
        <button type="button" onClick={() => void handleSave()} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50">
          <FiSave /> {saving ? "Guardando..." : "Guardar"}
        </button>
      </header>

      {error && <div className="mx-4 mt-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</div>}

      <div className="flex flex-1 overflow-hidden">
        <SlidesList data={data} activeSlide={activeSlide} onSelect={(i) => { setActiveSlide(i); setSelectedId(null); }} onAdd={addSlide} onDelete={(idx) => setConfirmSlideIdx(idx)} onDuplicate={duplicateSlide} />

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

          <DndContext onDragEnd={handleDragEnd}>
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
                  .map((el) => <DraggableElement key={el.id} element={el} selected={selectedId === el.id} onSelect={setSelectedId} onResize={handleResize} />)
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">Crea una diapositiva</div>
              )}
            </div>
          </DndContext>

          <PropertiesOverlay selected={selected} onPatch={patchSelected} onDelete={() => setConfirmElementOpen(true)} />

          <div className="mt-4 w-full max-w-160">
            <Layers slide={slide} selectedId={selectedId} onSelect={setSelectedId} onReorder={handleReorder} onSort={handleSortLayer} />
          </div>
        </main>

        <aside className="hidden w-64 border-l border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 lg:block">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Consejos</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-600 dark:text-zinc-400">
            <li>Arrastra desde el centro para mover.</li>
            <li>Usa los tiradores de borde para redimensionar.</li>
            <li>Texto: elige fuente, alineación, negrita/cursiva/subrayado.</li>
            <li>Iconos: usa el selector con fondo opcional.</li>
            <li>Código: elige lenguaje para resaltado Prism.</li>
            <li>Pulsa Supr para borrar elemento seleccionado.</li>
          </ul>
        </aside>
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
    </div>
  );
}
