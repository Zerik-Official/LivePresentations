import { DndContext, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiCheck, FiDownload, FiSave, FiUpload, FiX } from "react-icons/fi";
import { LuGraduationCap } from "react-icons/lu";
import { Link, useParams } from "react-router-dom";

import { DrawingSurface, type DrawingTool } from "@/components/DrawingSurface";
import { DrawingToolbar } from "@/components/DrawingToolbar";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { TooltipSimple } from "@/components/ui/Tooltip";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ExportPresentationModal } from "@/components/ExportPresentationModal";
import { ImportPresentationModal } from "@/components/ImportPresentationModal";
import { AssistantPanel } from "@/features/assistant/AssistantPanel";
import { locateChange, type AiChange } from "@/features/assistant/changes";
import { ReviewBar } from "@/features/assistant/ReviewBar";
import type { EditorBridge } from "@/features/assistant/tools";
import { useAssistant } from "@/features/assistant/useAssistant";
import { usePendingChanges } from "@/features/assistant/usePendingChanges";
import { TourOverlay } from "@/features/tutorials/TourOverlay";
import { TutorialsModal } from "@/features/tutorials/TutorialsModal";
import type { Tutorial } from "@/features/tutorials/tutorials";
import { useTutorialProgress } from "@/features/tutorials/useTutorialProgress";
import { useHistoryState } from "@/hooks/useHistoryState";
import { useHotkeys, type HotkeyMap } from "@/hooks/useHotkeys";
import { useStoredFlag } from "@/hooks/useStoredFlag";
import { presentationsApi } from "@/lib/api";
import { fitStrokesToBox, type Stroke } from "@/lib/drawing/strokes";
import { createDefaultElement } from "@/lib/presentation/factory";
import { getDescendantIds } from "@/lib/presentation/hierarchy";
import { cloneSubtree, createId } from "@/lib/presentation/operations";
import { parsePresentationData } from "@/lib/presentation/parser";
import { snapDrag, type Guide } from "@/lib/presentation/snapping";
import { selectActiveCredential, useAiStore } from "@/stores/aiStore";
import type { Presentation } from "@/types/backend";
import type { PresentationData, SlideElement } from "@/types/presentation";
import { AnimationStyles } from "@/components/AnimatedFrame";
import { DraggableElement } from "./DraggableElement";
import { EditorRibbon } from "./components/EditorRibbon";
import { EditorSidebar } from "./components/EditorSidebar";
import { PropertiesOverlay } from "./components/PropertiesOverlay";
import { SlidesList } from "./components/SlidesList";
import { ZoomControls, type ZoomMode } from "./components/ZoomControls";
import { useCanvasDrop } from "./hooks/useCanvasDrop";
import { useElements } from "./hooks/useElements";
import { useKeyboardDelete } from "./hooks/useKeyboardDelete";
import { useSlides } from "./hooks/useSlides";

const CANVAS_MARGIN = 48;
const NUDGE_STEP = 1;
const NUDGE_STEP_LARGE = 10;
/** Distance, in screen pixels, at which a dragged element snaps to a guide. */
const SNAP_DISTANCE_PX = 6;
/** Quiet time after the last change before the document saves itself. */
const AUTOSAVE_DELAY_MS = 2000;

/**
 * Modular editor with drag, resize, undo history, autosave, freehand drawing,
 * guided tutorials, an AI assistant with reviewable edits and per-type
 * property editors.
 */
export function EditorPage(): React.ReactNode {
  const { id } = useParams<{ id: string }>();
  const history = useHistoryState<PresentationData>();
  const data = history.value;
  const setData = history.set;
  const [title, setTitle] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const failedSnapshot = useRef<{ data: PresentationData | null; title: string } | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<{ data: PresentationData | null; title: string }>({ data: null, title: "" });
  const [error, setError] = useState<string | null>(null);
  const [confirmSlideIdx, setConfirmSlideIdx] = useState<number | null>(null);
  const [confirmElementOpen, setConfirmElementOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [dragDelta, setDragDelta] = useState<{ x: number; y: number } | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [smartGuides, setSmartGuides] = useStoredFlag("editor_smart_guides", true);
  const snappedDelta = useRef<{ x: number; y: number } | null>(null);
  const [zoomMode, setZoomMode] = useState<ZoomMode>("fit");
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [sketch, setSketch] = useState<Stroke[] | null>(null);
  const [ink, setInk] = useState<{ tool: DrawingTool; color: string; width: number }>({ tool: "pen", color: "#ef4444", width: 6 });
  const [tutorialsOpen, setTutorialsOpen] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const { completed, markCompleted } = useTutorialProgress();
  const mainRef = useRef<HTMLElement | null>(null);
  const clipboard = useRef<SlideElement[]>([]);
  const loadAi = useAiStore((s) => s.load);
  const activeCredential = useAiStore(selectActiveCredential);

  const slide = useMemo(() => (data ? (data.slides[activeSlide] ?? null) : null), [data, activeSlide]);
  const selected = useMemo(() => slide?.elements.find((e) => e.id === selectedId) ?? null, [slide, selectedId]);
  const exportPres = useMemo(() => {
    if (!id || !data) return null;
    return { id, title, data: data as unknown as Record<string, unknown>, owner_id: "", created_at: "", updated_at: "" } as unknown as Presentation;
  }, [id, title, data]);
  const dirty = data !== null && (data !== savedSnapshot.data || title !== savedSnapshot.title);
  const drawing = sketch !== null;

  const fitScale = data && viewport.width > 0 ? Math.min(1, (viewport.width - CANVAS_MARGIN) / data.width, (viewport.height - CANVAS_MARGIN) / data.height) : 1;
  const scale = zoomMode === "fit" ? Math.max(0.1, fitScale) : zoomMode;

  const { addSlide, deleteSlide, duplicateSlide, updateBackground, updateTransition, reorderSlides, updateSlide } = useSlides(data, setData, activeSlide, setActiveSlide, setSelectedId);
  const {
    addElement,
    addElements,
    patchSelected,
    patchSelectedId,
    replaceSelected,
    replaceSubtree,
    deleteSelected,
    handleDragEnd,
    handleResize,
    handleReorder,
    handleSortLayer,
    setParent,
    duplicateWithChildren,
    nudgeSelected,
    alignSelected,
    layerSelected,
  } = useElements(data, setData, activeSlide, selectedId, setSelectedId);
  const { handleCanvasDrop } = useCanvasDrop(data, activeSlide, setData, setSelectedId, setError);

  // The assistant runs several tools between renders, so it reads the editor
  // through refs that always hold the latest values.
  const liveState = useRef({ title, activeSlide });
  liveState.current = { title, activeSlide };
  const bridge = useRef<EditorBridge>({
    getData: () => history.valueRef.current,
    setData: (next) => history.set(next),
    getTitle: () => liveState.current.title,
    setTitle: (next) => {
      liveState.current.title = next;
      setTitle(next);
    },
    getActiveSlide: () => liveState.current.activeSlide,
    setActiveSlide: (index) => {
      liveState.current.activeSlide = index;
      setActiveSlide(index);
      setSelectedId(null);
    },
  });

  const review = usePendingChanges(id, data, bridge);
  const chat = useAssistant(bridge, activeCredential ? id : undefined, review.add);

  /** How each element of the active slide is affected by a pending assistant edit. */
  const reviewMarks = useMemo(() => {
    const marks = new Map<string, "added" | "updated">();
    if (!slide) return marks;
    for (const change of review.changes) {
      if (change.kind === "element-added" && change.slideId === slide.id) marks.set(change.elementId, "added");
      else if (change.kind === "element-updated" && change.slideId === slide.id) marks.set(change.elementId, "updated");
      else if (change.kind === "slide-added" && change.slideId === slide.id) for (const el of slide.elements) marks.set(el.id, "added");
    }
    return marks;
  }, [review.changes, slide]);

  /**
   * Bring the target of an assistant edit into view.
   * @param change - Edit to show
   */
  function focusChange(change: AiChange): void {
    const target = data ? locateChange(data, change) : null;
    if (!target) return;
    setActiveSlide(target.slideIndex);
    setSelectedId(target.elementId);
  }

  const descendantIdsForDrag = useMemo(() => {
    if (!slide || !dragActiveId) return new Set<string>();
    return new Set(getDescendantIds(slide.elements, dragActiveId));
  }, [slide, dragActiveId]);

  /**
   * Handle drag start to track active id for descendant follow.
   * @param event - Drag start event
   */
  function onDragStart(event: DragStartEvent): void {
    snappedDelta.current = null;
    setDragActiveId(String(event.active.id));
    setDragDelta({ x: 0, y: 0 });
  }

  /**
   * Handle drag move to sync children.
   * @param event - Drag move event
   */
  function onDragMove(event: DragMoveEvent): void {
    const raw = { x: event.delta.x / scale, y: event.delta.y / scale };
    const moving = slide?.elements.find((el) => el.id === String(event.active.id));
    if (!smartGuides || !moving || !slide || !data) {
      snappedDelta.current = raw;
      setDragDelta(raw);
      return;
    }
    // Elements that travel with the dragged one are not alignment targets.
    const carried = new Set([moving.id, ...getDescendantIds(slide.elements, moving.id)]);
    const others = slide.elements.filter((el) => !carried.has(el.id));
    const snap = snapDrag(moving, raw.x, raw.y, others, data, SNAP_DISTANCE_PX / scale);
    snappedDelta.current = { x: snap.dx, y: snap.dy };
    setDragDelta(snappedDelta.current);
    setGuides(snap.guides);
  }

  /**
   * Handle drag end and reset tracking.
   * @param event - Drag end event
   */
  function onDragEnd(event: DragEndEvent): void {
    const final = snappedDelta.current;
    snappedDelta.current = null;
    setDragActiveId(null);
    setDragDelta(null);
    setGuides([]);
    // Commit the position the user saw, including the smart-guide adjustment.
    handleDragEnd(final ? { ...event, delta: { x: final.x * scale, y: final.y * scale } } : event, scale);
  }

  useKeyboardDelete(drawing ? null : selectedId, () => setConfirmElementOpen(true));

  useEffect(() => {
    void loadAi();
  }, [loadAi]);

  const slideCount = data?.slides.length ?? 0;
  useEffect(() => {
    // Undoing a slide creation can leave the active index past the end.
    if (slideCount > 0 && activeSlide >= slideCount) setActiveSlide(slideCount - 1);
  }, [slideCount, activeSlide]);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(main);
    return () => observer.disconnect();
  }, [data === null]);

  const resetHistory = history.reset;
  useEffect(() => {
    if (!id) return;
    void presentationsApi
      .get(id)
      .then((p) => {
        setTitle(p.title);
        const parsed = parsePresentationData(p.data);
        resetHistory(parsed);
        setSavedSnapshot({ data: parsed, title: p.title });
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
  }, [id, resetHistory]);

  /**
   * Persist presentation.
   */
  const handleSave = useCallback(async (): Promise<void> => {
    const current = history.valueRef.current;
    if (!id || !current) return;
    const currentTitle = liveState.current.title;
    setSaving(true);
    setError(null);
    try {
      await presentationsApi.update(id, { title: currentTitle, data: current as unknown as Record<string, unknown> });
      setSavedSnapshot({ data: current, title: currentTitle });
      failedSnapshot.current = null;
      setSaveFailed(false);
    } catch (e) {
      // Remember what failed so autosave does not retry the same state in a loop.
      failedSnapshot.current = { data: current, title: currentTitle };
      setSaveFailed(true);
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }, [id, history.valueRef]);

  useEffect(() => {
    if (!dirty || saving) return;
    const failed = failedSnapshot.current;
    if (failed && failed.data === data && failed.title === title) return;
    const timer = window.setTimeout(() => void handleSave(), AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [data, title, dirty, saving, handleSave]);

  useEffect(() => {
    if (!dirty) return;
    /**
     * Ask before leaving while the last changes are still being saved.
     * @param event - Unload event
     */
    function warnBeforeLeaving(event: BeforeUnloadEvent): void {
      event.preventDefault();
    }
    /**
     * Save right away when the tab is hidden or the device goes to sleep.
     */
    function saveWhenHidden(): void {
      if (document.visibilityState === "hidden") void handleSave();
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    document.addEventListener("visibilitychange", saveWhenHidden);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeLeaving);
      document.removeEventListener("visibilitychange", saveWhenHidden);
    };
  }, [dirty, handleSave]);

  /**
   * Copy the selected element and its children to the editor clipboard.
   */
  function copySelected(): void {
    if (!slide || !selectedId) return;
    clipboard.current = cloneSubtree(slide.elements, selectedId, 0);
  }

  /**
   * Paste the clipboard into the active slide, offset from the original.
   */
  function pasteClipboard(): void {
    const root = clipboard.current[0];
    if (!root || !slide) return;
    addElements(cloneSubtree(clipboard.current, root.id));
  }

  /**
   * Turn the freehand sketch into a drawing element and leave drawing mode.
   */
  function finishSketch(): void {
    const fitted = data && sketch ? fitStrokesToBox(sketch, data.width, data.height) : null;
    setSketch(null);
    if (!fitted) return;
    const base = createDefaultElement("drawing", createId("el"));
    addElements([{ ...base, x: fitted.x, y: fitted.y, w: fitted.w, h: fitted.h, props: { strokes: fitted.strokes, baseWidth: fitted.w, baseHeight: fitted.h } }]);
  }

  /**
   * Enter or leave freehand drawing mode.
   */
  function toggleDrawing(): void {
    if (drawing) finishSketch();
    else {
      setSelectedId(null);
      setSketch([]);
    }
  }

  const hotkeys: HotkeyMap = {
    "ctrl+z": history.undo,
    "meta+z": history.undo,
    "ctrl+y": history.redo,
    "ctrl+shift+z": history.redo,
    "meta+shift+z": history.redo,
    "ctrl+s": () => void handleSave(),
    "meta+s": () => void handleSave(),
    escape: () => (drawing ? setSketch(null) : setSelectedId(null)),
  };
  if (selectedId && !drawing) {
    hotkeys["ctrl+d"] = () => duplicateWithChildren(selectedId);
    hotkeys["ctrl+c"] = copySelected;
    hotkeys["meta+c"] = copySelected;
    hotkeys.arrowleft = () => nudgeSelected(-NUDGE_STEP, 0);
    hotkeys.arrowright = () => nudgeSelected(NUDGE_STEP, 0);
    hotkeys.arrowup = () => nudgeSelected(0, -NUDGE_STEP);
    hotkeys.arrowdown = () => nudgeSelected(0, NUDGE_STEP);
    hotkeys["shift+arrowleft"] = () => nudgeSelected(-NUDGE_STEP_LARGE, 0);
    hotkeys["shift+arrowright"] = () => nudgeSelected(NUDGE_STEP_LARGE, 0);
    hotkeys["shift+arrowup"] = () => nudgeSelected(0, -NUDGE_STEP_LARGE);
    hotkeys["shift+arrowdown"] = () => nudgeSelected(0, NUDGE_STEP_LARGE);
  }
  if (clipboard.current.length > 0 && !drawing) {
    hotkeys["ctrl+v"] = pasteClipboard;
    hotkeys["meta+v"] = pasteClipboard;
  }
  useHotkeys(hotkeys, { enabled: data !== null && activeTutorial === null });

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
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="min-w-0 flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
        <ThemeToggle />
        <TooltipSimple content="Biblioteca de tutoriales" side="bottom">
          <Button variant="secondary" size="sm" onClick={() => setTutorialsOpen(true)} className="relative cursor-pointer">
            <LuGraduationCap size={14} /> Tutoriales
            {completed.length === 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />}
          </Button>
        </TooltipSimple>
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
        <span role="status" className={`hidden shrink-0 text-xs md:block ${saveFailed && dirty ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}>
          {saving ? "Guardando..." : saveFailed && dirty ? "No se pudo guardar" : dirty ? "Cambios sin guardar" : "Guardado"}
        </span>
        <TooltipSimple content={dirty ? "Guardar ahora (Ctrl+S)" : "Los cambios se guardan automáticamente"} side="bottom">
          <Button variant="primary" size="md" onClick={() => void handleSave()} disabled={saving} className="relative cursor-pointer" data-tour="save">
            <FiSave /> {saving ? "Guardando..." : "Guardar"}
            {dirty && !saving && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-900" />}
          </Button>
        </TooltipSimple>
      </header>

      {error && <div className="mx-4 mt-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</div>}

      <EditorRibbon
        onAdd={addElement}
        disabled={!slide}
        slide={slide}
        data={data}
        activeSlide={activeSlide}
        onUpdateBackground={updateBackground}
        onUpdateTransition={updateTransition}
        onUpdateData={setData}
        onAddSlide={addSlide}
        onDuplicateSlide={duplicateSlide}
        onRequestDeleteSlide={(idx) => setConfirmSlideIdx(idx)}
        hasSelection={selected !== null}
        drawing={drawing}
        onToggleDrawing={toggleDrawing}
        onUndo={history.undo}
        onRedo={history.redo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onDuplicate={() => selectedId && duplicateWithChildren(selectedId)}
        onAlign={alignSelected}
        onLayer={layerSelected}
        smartGuides={smartGuides}
        onToggleSmartGuides={() => setSmartGuides(!smartGuides)}
      />

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

        <div className="relative flex min-w-0 flex-1 flex-col">
          {drawing && (
            <div className="flex shrink-0 justify-center border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2">
              <DrawingToolbar
                tool={ink.tool}
                color={ink.color}
                strokeWidth={ink.width}
                onToolChange={(tool) => setInk({ ...ink, tool })}
                onColorChange={(color) => setInk({ ...ink, color })}
                onWidthChange={(width) => setInk({ ...ink, width })}
                onUndo={() => setSketch((strokes) => strokes?.slice(0, -1) ?? null)}
                onClear={() => setSketch([])}
                hasStrokes={sketch.length > 0}
              >
                <Button variant="ghost" size="sm" onClick={() => setSketch(null)}>
                  <FiX size={13} /> Cancelar
                </Button>
                <Button variant="primary" size="sm" onClick={finishSketch} disabled={sketch.length === 0}>
                  <FiCheck size={13} /> Listo
                </Button>
              </DrawingToolbar>
            </div>
          )}

          <main ref={mainRef} className="flex-1 overflow-auto bg-zinc-50 dark:bg-zinc-950">
            <div className="flex min-h-full min-w-full items-center justify-center p-6" style={{ width: "max-content" }}>
              <DndContext onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd}>
                <div style={{ width: data.width * scale, height: data.height * scale }} className="relative shrink-0" data-tour="canvas">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => void handleCanvasDrop(e)}
                    onPointerDown={(e) => {
                      if (e.target === e.currentTarget) setSelectedId(null);
                    }}
                    style={{ width: data.width, height: data.height, background: slide?.background ?? "#ffffff", transform: `scale(${scale})`, transformOrigin: "top left" }}
                    className="absolute left-0 top-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white shadow-sm"
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
                            scale={scale}
                            review={reviewMarks.get(el.id)}
                          />
                        ))
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">Crea una diapositiva</div>
                    )}
                    <AnimationStyles />
                    {guides.map((guide) => (
                      <span
                        key={`${guide.orientation}-${guide.position}`}
                        aria-hidden="true"
                        style={
                          guide.orientation === "vertical"
                            ? { left: guide.position, top: guide.start, height: guide.end - guide.start, width: 0, borderLeftWidth: 1 / scale }
                            : { top: guide.position, left: guide.start, width: guide.end - guide.start, height: 0, borderTopWidth: 1 / scale }
                        }
                        className="pointer-events-none absolute z-[1900] border-dashed border-fuchsia-500"
                      />
                    ))}
                    {drawing && slide && (
                      <DrawingSurface
                        width={data.width}
                        height={data.height}
                        strokes={sketch}
                        tool={ink.tool}
                        color={ink.color}
                        strokeWidth={ink.tool === "highlighter" ? ink.width * 3 : ink.width}
                        onStrokeEnd={(stroke) => setSketch((strokes) => [...(strokes ?? []), stroke])}
                        className="z-[2000]"
                      />
                    )}
                  </div>
                </div>
              </DndContext>
            </div>
          </main>

          <ZoomControls mode={zoomMode} scale={scale} onChange={setZoomMode} />
          <ReviewBar review={review} busy={chat.busy} onFocus={focusChange} />
        </div>

        {!drawing && (
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
        )}

        <EditorSidebar slide={slide} selectedId={selectedId} onSelect={setSelectedId} onReorder={handleReorder} onSort={handleSortLayer} data={data} onUpdateData={setData} onSetParent={setParent} />
      </div>

      {activeCredential && <AssistantPanel chat={chat} credential={activeCredential} pendingChanges={review.changes.length} />}

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
        description={`¿Seguro que quieres borrar el elemento ${selected?.type ?? ""}? Puedes recuperarlo con Deshacer.`}
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
      <TutorialsModal
        open={tutorialsOpen}
        onClose={() => setTutorialsOpen(false)}
        completed={completed}
        onStart={(tutorial) => {
          setTutorialsOpen(false);
          setSketch(null);
          setActiveTutorial(tutorial);
        }}
      />
      {activeTutorial && (
        <TourOverlay
          key={activeTutorial.id}
          tutorial={activeTutorial}
          onExit={() => setActiveTutorial(null)}
          onFinish={() => {
            markCompleted(activeTutorial.id);
            setActiveTutorial(null);
          }}
        />
      )}
    </div>
  );
}
