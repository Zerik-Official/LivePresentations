import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import { FiArrowLeft, FiDownload, FiSave, FiUpload } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";

import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ThemeToggle } from "../../components/ThemeToggle";

import { getPresentation, updatePresentation } from "../../lib/api";
import { createDefaultElement, createEmptySlide, parsePresentationData, type PresentationData, type SlideElement } from "../../types/presentation";

import { Layers } from "./components/Layers";
import { PropertiesOverlay } from "./components/PropertiesOverlay";
import { SlidesList } from "./components/SlidesList";
import { Toolbar } from "./components/Toolbar";
import { DraggableElement } from "./DraggableElement";

/**
 * Modular editor with drag, resize and code/icon support.
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

  useEffect(() => {
    if (!id) return;
    void getPresentation(id)
      .then((p) => {
        setTitle(p.title);
        setData(parsePresentationData(p.data));
      })
      .catch(() => setError("No se pudo cargar la presentación"));
  }, [id]);

  useEffect(() => {
    /**
     * Handle Delete/Sup key for selected element.
     * @param e - Keyboard event
     */
    function handleKey(e: KeyboardEvent): void {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
        e.preventDefault();
        setConfirmElementOpen(true);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId]);

  const slide = useMemo(() => (data ? (data.slides[activeSlide] ?? null) : null), [data, activeSlide]);
  const selected = useMemo(() => slide?.elements.find((e) => e.id === selectedId) ?? null, [slide, selectedId]);

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
   * Add a new slide.
   */
  function addSlide(): void {
    if (!data) return;
    const s = createEmptySlide(`slide-${Date.now()}`);
    setData({ ...data, slides: [...data.slides, s] });
    setActiveSlide(data.slides.length);
  }

  /**
   * Delete a slide by index.
   * @param idx - Slide index
   */
  function deleteSlide(idx: number): void {
    if (!data) return;
    const slides = data.slides.filter((_, i) => i !== idx);
    setData({ ...data, slides });
    setActiveSlide(Math.max(0, Math.min(activeSlide, slides.length - 1)));
    setSelectedId(null);
  }

  /**
   * Duplicate a slide.
   * @param idx - Slide index
   */
  function duplicateSlide(idx: number): void {
    if (!data) return;
    const src = data.slides[idx];
    if (!src) return;
    const copy = { ...src, id: `slide-${Date.now()}`, elements: src.elements.map((e) => ({ ...e, id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })) };
    const slides = [...data.slides];
    slides.splice(idx + 1, 0, copy);
    setData({ ...data, slides });
  }

  /**
   * Add element to current slide.
   * @param type - Element type
   */
  function addElement(type: SlideElement["type"]): void {
    if (!data || !slide) return;
    const el = createDefaultElement(type, `el-${Date.now()}`);
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements: [...slide.elements, el] };
    setData({ ...data, slides });
    setSelectedId(el.id);
  }

  /**
   * Patch selected element.
   * @param patch - Patch object
   */
  function patchSelected(patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }): void {
    if (!data || !slide || !selected) return;
    const elements = slide.elements.map((e) => {
      if (e.id !== selected.id) return e;
      const next = { ...e, ...patch } as SlideElement;
      if (patch.propsPatch) next.props = { ...e.props, ...patch.propsPatch };
      delete (next as unknown as { propsPatch?: unknown }).propsPatch;
      return next;
    });
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements };
    setData({ ...data, slides });
  }

  /**
   * Delete selected element.
   */
  function deleteSelected(): void {
    if (!data || !slide || !selected) return;
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements: slide.elements.filter((e) => e.id !== selected.id) };
    setData({ ...data, slides });
    setSelectedId(null);
  }

  /**
   * Handle drag end for @dnd-kit.
   * @param event - Drag end event
   */
  function handleDragEnd(event: DragEndEvent): void {
    const { active, delta } = event;
    if (!data || !slide || !delta) return;
    const elements = slide.elements.map((el) => (el.id === active.id ? { ...el, x: Math.round(el.x + delta.x), y: Math.round(el.y + delta.y) } : el));
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements };
    setData({ ...data, slides });
  }

  /**
   * Handle resize from handles.
   * @param elemId - Element id
   * @param w - New width
   * @param h - New height
   */
  function handleResize(elemId: string, w: number, h: number): void {
    if (!data || !slide) return;
    const elements = slide.elements.map((el) => (el.id === elemId ? { ...el, w, h } : el));
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements };
    setData({ ...data, slides });
  }

  /**
   * Reorder zIndex.
   * @param elemId - Element id
   * @param dir - Direction
   */
  function handleReorder(elemId: string, dir: 1 | -1): void {
    if (!data || !slide) return;
    const elements = [...slide.elements];
    const idx = elements.findIndex((e) => e.id === elemId);
    if (idx === -1) return;
    const target = idx + dir;
    if (target < 0 || target >= elements.length) return;
    const [moved] = elements.splice(idx, 1);
    if (!moved) return;
    elements.splice(target, 0, moved);
    const withZ = elements.map((e, i) => ({ ...e, zIndex: i }));
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, elements: withZ };
    setData({ ...data, slides });
  }

  /**
   * Update slide background color.
   * @param color - CSS color
   */
  function handleBackgroundChange(color: string): void {
    if (!data || !slide) return;
    const slides = [...data.slides];
    slides[activeSlide] = { ...slide, background: color };
    setData({ ...data, slides });
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

  if (error && !data) return <div className="p-6 text-sm text-red-600">{error}</div>;
  if (!data) return <div className="p-6 text-sm text-zinc-500">Cargando editor...</div>;

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3">
        <Link to="/dashboard" className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
          <FiArrowLeft />
        </Link>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:focus:border-zinc-400 text-zinc-900 dark:text-zinc-100" />
        <ThemeToggle />
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={(e) => void handleImport(e)} />
        <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300">
          <FiUpload /> Importar
        </button>
        <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300">
          <FiDownload /> Exportar
        </button>
        <button type="button" onClick={() => void handleSave()} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50">
          <FiSave /> {saving ? "Guardando..." : "Guardar"}
        </button>
      </header>

      {error && <div className="mx-4 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex flex-1 overflow-hidden">
        <SlidesList data={data} activeSlide={activeSlide} onSelect={(i) => { setActiveSlide(i); setSelectedId(null); }} onAdd={addSlide} onDelete={(idx) => setConfirmSlideIdx(idx)} onDuplicate={duplicateSlide} />

        <main className="flex flex-1 flex-col items-center overflow-auto p-4 bg-zinc-50 dark:bg-zinc-950">
          <Toolbar onAdd={addElement} disabled={!slide} />
          {slide && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2">
              <span className="text-xs text-zinc-600 dark:text-zinc-300">Fondo canvas</span>
              <input type="color" value={slide.background} onChange={(e) => handleBackgroundChange(e.target.value)} className="h-7 w-12 rounded border border-zinc-200 dark:border-zinc-700" />
              <input value={slide.background} onChange={(e) => handleBackgroundChange(e.target.value)} placeholder="#ffffff" className="w-24 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100" />
            </div>
          )}

          <DndContext onDragEnd={handleDragEnd}>
            <div style={{ width: data.width, height: data.height, background: slide?.background ?? "#ffffff" }} className="relative mt-4 origin-top scale-[0.55] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm sm:scale-[0.75] lg:scale-100">
              {slide ? (
                slide.elements
                  .slice()
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map((el) => <DraggableElement key={el.id} element={el} selected={selectedId === el.id} onSelect={setSelectedId} onResize={handleResize} />)
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">Crea una diapositiva</div>
              )}
            </div>
          </DndContext>

          <PropertiesOverlay selected={selected} onPatch={patchSelected} onDelete={() => setConfirmElementOpen(true)} />

          <div className="mt-4 w-full max-w-160">
            <Layers slide={slide} selectedId={selectedId} onSelect={setSelectedId} onReorder={handleReorder} />
          </div>
        </main>

        <aside className="hidden w-64 border-l border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 lg:block">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Consejos</h3>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-600">
            <li>Arrastra desde el centro para mover.</li>
            <li>Usa los tiradores de borde para redimensionar (esquina y laterales).</li>
            <li>Iconos: usa el selector con fondo opcional.</li>
            <li>Código: elige lenguaje para resaltado Prism (js, python, css...).</li>
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
