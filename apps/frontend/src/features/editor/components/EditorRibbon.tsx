import { useMemo, useState } from "react";
import { FaCode, FaFont, FaIcons, FaImage, FaShapes, FaStar, FaVideo } from "react-icons/fa";
import { FiCopy, FiDatabase, FiPlus, FiTrash2 } from "react-icons/fi";

import { Select } from "@/components/ui/Select";
import { TooltipSimple } from "@/components/ui/Tooltip";
import type { PresentationData, Slide, SlideElement } from "@/types/presentation";
import { elementRegistry } from "../elements/registry";
import { SpecialsPickerModal } from "../elements/specials/SpecialsPickerModal";
import { VariablesModal } from "./VariablesModal";

/**
 * Ribbon tab identifier.
 */
export type EditorRibbonTab = "insert" | "design" | "slides" | "data";

/**
 * Props for the editor ribbon.
 */
interface EditorRibbonProps {
  /** Handler to add a new element by type. */
  onAdd: (type: SlideElement["type"]) => void;
  /** Whether element insertion is disabled. */
  disabled: boolean;
  /** Active slide or null when none exists. */
  slide: Slide | null;
  /** Full presentation data. */
  data: PresentationData | null;
  /** Active slide index. */
  activeSlide: number;
  /** Handler to update active slide background. */
  onUpdateBackground: (color: string) => void;
  /** Handler to update active slide transition. */
  onUpdateTransition: (transition: Slide["transition"]) => void;
  /** Handler to replace full presentation data. */
  onUpdateData: (data: PresentationData) => void;
  /** Handler to append a new slide. */
  onAddSlide: () => void;
  /** Handler to duplicate a slide by index. */
  onDuplicateSlide: (idx: number) => void;
  /** Handler to request slide deletion by index. */
  onRequestDeleteSlide: (idx: number) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  text: FaFont,
  image: FaImage,
  icon: FaIcons,
  shape: FaShapes,
  code: FaCode,
  video: FaVideo,
  specials: FaStar,
};

const TABS: Array<{ id: EditorRibbonTab; label: string }> = [
  { id: "insert", label: "Insertar" },
  { id: "design", label: "Diseño" },
  { id: "slides", label: "Diapositivas" },
  { id: "data", label: "Datos" },
];

/**
 * PowerPoint-like ribbon with tabs grouping editor actions.
 * @param onAdd - Handler to add elements
 * @param disabled - Whether insertion is disabled
 * @param slide - Active slide
 * @param data - Presentation data
 * @param activeSlide - Active slide index
 * @param onUpdateBackground - Background update handler
 * @param onUpdateTransition - Transition update handler
 * @param onUpdateData - Full data update handler
 * @param onAddSlide - Add slide handler
 * @param onDuplicateSlide - Duplicate slide handler
 * @param onRequestDeleteSlide - Request slide deletion handler
 * @returns Ribbon element
 */
export function EditorRibbon({
  onAdd,
  disabled,
  slide,
  data,
  activeSlide,
  onUpdateBackground,
  onUpdateTransition,
  onUpdateData,
  onAddSlide,
  onDuplicateSlide,
  onRequestDeleteSlide,
}: EditorRibbonProps): React.ReactNode {
  const [activeTab, setActiveTab] = useState<EditorRibbonTab>("insert");
  const [specialsOpen, setSpecialsOpen] = useState(false);
  const [variablesOpen, setVariablesOpen] = useState(false);

  const items = useMemo(() => elementRegistry.getAll().filter((d) => d.type !== "specials"), []);

  /**
   * Update canvas dimensions keeping the rest of the data intact.
   * @param field - Dimension field to update
   * @param value - New numeric value
   * @returns void
   */
  function handleCanvasSize(field: "width" | "height", value: number): void {
    if (!data || !Number.isFinite(value) || value <= 0) return;
    onUpdateData({ ...data, [field]: Math.round(value) });
  }

  /**
   * Update presentation theme colors.
   * @param field - Theme field to update
   * @param value - New CSS color value
   * @returns void
   */
  function handleThemeColor(field: "primary" | "accent", value: string): void {
    if (!data) return;
    onUpdateData({ ...data, theme: { ...data.theme, [field]: value } });
  }

  /**
   * Render the insert tab with element creation actions.
   * @returns Insert tab content
   */
  function renderInsert(): React.ReactNode {
    return (
      <div className="flex flex-wrap items-stretch gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Elementos</span>
          <div className="flex flex-wrap gap-1.5">
            {items.map((def) => {
              const Icon = ICON_MAP[def.type] ?? FaStar;
              return (
                <TooltipSimple key={def.type} content={`Añadir ${def.label.toLowerCase()}`} side="bottom">
                  <button
                    type="button"
                    onClick={() => onAdd(def.type)}
                    disabled={disabled}
                    className="flex min-w-17 cursor-pointer flex-col items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Icon size={15} />
                    <span className="text-[11px] font-medium">{def.label}</span>
                  </button>
                </TooltipSimple>
              );
            })}
          </div>
        </div>
        <div className="w-px self-stretch bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Especiales</span>
          <TooltipSimple content="Elementos especiales" side="bottom">
            <button
              type="button"
              onClick={() => setSpecialsOpen(true)}
              disabled={disabled}
              className="flex min-w-17 cursor-pointer flex-col items-center gap-1 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-3 py-2 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FaStar size={15} />
              <span className="text-[11px] font-medium">Especiales</span>
            </button>
          </TooltipSimple>
        </div>
      </div>
    );
  }

  /**
   * Render the design tab with slide and canvas styling controls.
   * @returns Design tab content
   */
  function renderDesign(): React.ReactNode {
    return (
      <div className="flex flex-wrap items-stretch gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Fondo</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={slide?.background ?? "#ffffff"}
              onChange={(e) => onUpdateBackground(e.target.value)}
              disabled={!slide}
              className="h-8 w-12 cursor-pointer rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            />
            <input
              value={slide?.background ?? ""}
              onChange={(e) => onUpdateBackground(e.target.value)}
              placeholder="#ffffff"
              disabled={!slide}
              className="w-24 rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-2 py-1.5 text-xs outline-none focus:border-zinc-900 dark:focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40"
            />
          </div>
        </div>
        <div className="w-px self-stretch bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Transición</span>
          <div className="w-32">
            <Select
              value={slide?.transition ?? "fade"}
              options={[
                { value: "fade", label: "Fade" },
                { value: "slide", label: "Slide" },
                { value: "zoom", label: "Zoom" },
              ]}
              onChange={(v) => onUpdateTransition(v as Slide["transition"])}
              placeholder="Transición"
            />
          </div>
        </div>
        <div className="w-px self-stretch bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Lienzo</span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <span>W</span>
              <input
                type="number"
                value={data?.width ?? 1280}
                min={320}
                max={3840}
                onChange={(e) => handleCanvasSize("width", Number(e.target.value))}
                disabled={!data}
                className="w-20 rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-2 py-1.5 text-xs outline-none focus:border-zinc-900 dark:focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40"
              />
            </label>
            <label className="flex items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <span>H</span>
              <input
                type="number"
                value={data?.height ?? 720}
                min={180}
                max={2160}
                onChange={(e) => handleCanvasSize("height", Number(e.target.value))}
                disabled={!data}
                className="w-20 rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-2 py-1.5 text-xs outline-none focus:border-zinc-900 dark:focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40"
              />
            </label>
          </div>
        </div>
        <div className="w-px self-stretch bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Tema</span>
          <div className="flex items-center gap-2">
            <TooltipSimple content="Color primario" side="bottom">
              <input
                type="color"
                value={data?.theme.primary ?? "#18181b"}
                onChange={(e) => handleThemeColor("primary", e.target.value)}
                disabled={!data}
                className="h-8 w-10 cursor-pointer rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              />
            </TooltipSimple>
            <TooltipSimple content="Color de acento" side="bottom">
              <input
                type="color"
                value={data?.theme.accent ?? "#71717a"}
                onChange={(e) => handleThemeColor("accent", e.target.value)}
                disabled={!data}
                className="h-8 w-10 cursor-pointer rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              />
            </TooltipSimple>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render the slides tab with slide lifecycle actions.
   * @returns Slides tab content
   */
  function renderSlides(): React.ReactNode {
    const total = data?.slides.length ?? 0;
    return (
      <div className="flex flex-wrap items-stretch gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Diapositivas · {total} · actual {total === 0 ? 0 : activeSlide + 1}
          </span>
          <div className="flex flex-wrap gap-1.5">
            <TooltipSimple content="Añadir diapositiva" side="bottom">
              <button
                type="button"
                onClick={onAddSlide}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                <FiPlus size={13} /> Nueva
              </button>
            </TooltipSimple>
            <TooltipSimple content="Duplicar diapositiva actual" side="bottom">
              <button
                type="button"
                onClick={() => onDuplicateSlide(activeSlide)}
                disabled={!slide}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiCopy size={13} /> Duplicar
              </button>
            </TooltipSimple>
            <TooltipSimple content="Eliminar diapositiva actual" side="bottom">
              <button
                type="button"
                onClick={() => onRequestDeleteSlide(activeSlide)}
                disabled={!slide}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiTrash2 size={13} /> Eliminar
              </button>
            </TooltipSimple>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render the data tab with variables management.
   * @returns Data tab content
   */
  function renderData(): React.ReactNode {
    const variablesCount = data?.variables.length ?? 0;
    return (
      <div className="flex flex-wrap items-stretch gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Variables · {variablesCount}</span>
          <TooltipSimple content="Gestionar variables de la presentación" side="bottom">
            <button
              type="button"
              onClick={() => setVariablesOpen(true)}
              disabled={!data}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiDatabase size={13} /> Variables
            </button>
          </TooltipSimple>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
      <div role="tablist" aria-label="Editor ribbon" className="flex gap-1 overflow-x-auto px-3 pt-2 sm:px-4">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                  : "border-transparent text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-950/40 px-3 py-2.5 sm:px-4">
        {activeTab === "insert" ? renderInsert() : null}
        {activeTab === "design" ? renderDesign() : null}
        {activeTab === "slides" ? renderSlides() : null}
        {activeTab === "data" ? renderData() : null}
      </div>
      <SpecialsPickerModal open={specialsOpen} onClose={() => setSpecialsOpen(false)} onSelect={() => onAdd("specials")} />
      <VariablesModal
        open={variablesOpen}
        onClose={() => setVariablesOpen(false)}
        variables={data?.variables ?? []}
        onChange={(variables) => {
          if (!data) return;
          onUpdateData({ ...data, variables });
        }}
      />
    </div>
  );
}
