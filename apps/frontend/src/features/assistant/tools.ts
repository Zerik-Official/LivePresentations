import { elementRegistry } from "@/features/editor/elements/registry";
import { createDefaultElement, createEmptySlide } from "@/lib/presentation/factory";
import { getSubtree } from "@/lib/presentation/hierarchy";
import { createId, insertElements, patchElement, removeElement, updateSlideAt } from "@/lib/presentation/operations";
import { elementSchema } from "@/schemas/presentation.schema";
import type { PresentationData, Slide, SlideElement } from "@/types/presentation";
import type { AiChange, ChangeDetail } from "./changes";

/**
 * Editor capabilities the assistant tools act through. Reads must return the
 * latest state even between renders, since several tools run back to back.
 */
export interface EditorBridge {
  getData: () => PresentationData | null;
  setData: (next: PresentationData) => void;
  getTitle: () => string;
  setTitle: (title: string) => void;
  getActiveSlide: () => number;
  setActiveSlide: (index: number) => void;
}

/**
 * Outcome of one tool call.
 */
export interface ToolOutcome {
  /** Whether the tool applied its change */
  ok: boolean;
  /** Text returned to the model */
  result: string;
  /** Short label shown to the user in Spanish */
  summary: string;
  /** Edits made, for the user to accept or discard */
  changes: AiChange[];
}

/**
 * Options for running a tool.
 */
export interface ToolRunOptions {
  /** Pause between elements so the user can watch them appear; 0 applies everything at once */
  paceMs?: number;
}

/**
 * Tools are defined for the model on the server
 * (`apps/backend/app/services/assistant/tools.py`); the handlers below must
 * keep the same names and arguments.
 */
const CREATABLE_TYPES = ["text", "shape", "line", "table", "code", "icon", "image"] as const;
const TRANSITIONS = ["fade", "slide", "zoom"] as const;
const MAX_STRING_PREVIEW = 300;
const DEFAULT_PACE_MS = 140;

const TYPE_LABELS: Record<string, string> = { text: "Texto", shape: "Forma", line: "Línea", table: "Tabla", code: "Código", icon: "Icono", image: "Imagen" };

/**
 * Error whose message is safe and useful to send back to the model.
 */
class ToolError extends Error {}

/**
 * Wait before the next visible step.
 * @param ms - Milliseconds to wait
 * @returns Promise resolved after the pause
 */
function pause(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => window.setTimeout(resolve, ms)) : Promise.resolve();
}

/**
 * Build a reviewable change.
 * @param label - Description in Spanish
 * @param detail - What was touched
 * @returns Change with a fresh id
 */
function change(label: string, detail: ChangeDetail): AiChange {
  return { ...detail, id: createId("chg"), label };
}

/**
 * Describe an element for the review list.
 * @param element - Element to describe
 * @returns Type name with a hint of its content
 */
function describeElement(element: SlideElement): string {
  const name = TYPE_LABELS[element.type] ?? element.type;
  const text = typeof element.props.text === "string" ? element.props.text.split("\n")[0]!.trim() : "";
  return text ? `${name} «${text.length > 32 ? `${text.slice(0, 32)}…` : text}»` : name;
}

/**
 * Read a finite number from tool arguments.
 * @param value - Raw argument
 * @param name - Argument name for the error message
 * @returns Finite number
 */
function requireNumber(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new ToolError(`"${name}" must be a number`);
  return value;
}

/**
 * Resolve a slide index argument against the presentation.
 * @param data - Presentation data
 * @param value - Raw argument
 * @returns Valid slide index
 */
function requireSlideIndex(data: PresentationData, value: unknown): number {
  const index = requireNumber(value, "slide_index");
  if (!Number.isInteger(index) || index < 0 || index >= data.slides.length) {
    throw new ToolError(`slide_index ${index} is out of range; the presentation has ${data.slides.length} slides (0-based)`);
  }
  return index;
}

/**
 * Build a validated element from a model-provided spec.
 * Unknown props are kept so future element features need no tool change.
 * @param raw - Element spec from the model
 * @returns Element ready to insert
 */
function buildElement(raw: unknown): SlideElement {
  const spec = (raw ?? {}) as Record<string, unknown>;
  const type = spec.type as (typeof CREATABLE_TYPES)[number];
  if (!CREATABLE_TYPES.includes(type) || !elementRegistry.has(type)) throw new ToolError(`Unsupported element type "${String(spec.type)}"; use one of ${CREATABLE_TYPES.join(", ")}`);
  const base = createDefaultElement(type, createId("el"));
  const props = spec.props && typeof spec.props === "object" ? (spec.props as Record<string, unknown>) : {};
  const parsed = elementSchema.safeParse({
    ...base,
    x: Math.round(requireNumber(spec.x, "x")),
    y: Math.round(requireNumber(spec.y, "y")),
    w: Math.max(1, Math.round(requireNumber(spec.w, "w"))),
    h: Math.max(1, Math.round(requireNumber(spec.h, "h"))),
    rotation: typeof spec.rotation === "number" ? spec.rotation : 0,
    props: { ...base.props, ...props },
  });
  if (!parsed.success) throw new ToolError(`Invalid element: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
  return parsed.data as SlideElement;
}

/**
 * Shorten long strings and bulky drawings so the snapshot stays small.
 * @param value - Any props value
 * @returns Compact copy
 */
function compact(value: unknown): unknown {
  if (typeof value === "string") return value.length > MAX_STRING_PREVIEW ? `${value.slice(0, MAX_STRING_PREVIEW)}… (${value.length} chars)` : value;
  if (Array.isArray(value)) return value.map(compact);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, key === "strokes" && Array.isArray(inner) ? `[${inner.length} freehand strokes]` : compact(inner)]));
  }
  return value;
}

/**
 * Describe a slide for the model.
 * @param slide - Slide to describe
 * @param index - Slide index
 * @returns Serializable description
 */
function describeSlide(slide: Slide, index: number): Record<string, unknown> {
  return {
    index,
    background: slide.background,
    transition: slide.transition,
    notes: slide.notes ?? "",
    elements: slide.elements
      .slice()
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((el) => ({ id: el.id, type: el.type, x: el.x, y: el.y, w: el.w, h: el.h, rotation: el.rotation, props: compact(el.props) })),
  };
}

/**
 * Add elements to a slide one at a time so they visibly appear in order.
 * The slide is looked up by id before each step because the document can
 * change while the tool is pacing itself.
 * @param bridge - Editor capabilities
 * @param slideId - Target slide id
 * @param elements - Elements to add
 * @param paceMs - Pause between elements
 */
async function addElementsPaced(bridge: EditorBridge, slideId: string, elements: SlideElement[], paceMs: number): Promise<void> {
  for (const element of elements) {
    await pause(paceMs);
    const current = bridge.getData();
    const index = current?.slides.findIndex((slide) => slide.id === slideId) ?? -1;
    if (!current || index === -1) throw new ToolError("The slide was removed while elements were being added");
    bridge.setData(insertElements(current, index, [element]));
  }
}

type HandlerResult = { result: unknown; summary: string; changes?: AiChange[] };
type ToolHandler = (bridge: EditorBridge, data: PresentationData, args: Record<string, unknown>, paceMs: number) => HandlerResult | Promise<HandlerResult>;

const HANDLERS: Record<string, ToolHandler> = {
  get_presentation(bridge, data, args) {
    const only = args.slide_index === undefined ? null : requireSlideIndex(data, args.slide_index);
    const slides = data.slides.map(describeSlide).filter((slide) => only === null || slide.index === only);
    return {
      result: { title: bridge.getTitle(), width: data.width, height: data.height, theme: data.theme, slide_count: data.slides.length, active_slide: bridge.getActiveSlide(), slides },
      summary: only === null ? "Presentación leída" : `Diapositiva ${only + 1} leída`,
    };
  },

  async add_slide(bridge, data, args, paceMs) {
    const elements = (Array.isArray(args.elements) ? args.elements : []).map(buildElement);
    const slide: Slide = {
      ...createEmptySlide(createId("slide")),
      background: typeof args.background === "string" ? args.background : "#ffffff",
      transition: TRANSITIONS.includes(args.transition as Slide["transition"]) ? (args.transition as Slide["transition"]) : "fade",
      notes: typeof args.notes === "string" ? args.notes : undefined,
    };
    const index = typeof args.index === "number" ? Math.min(data.slides.length, Math.max(0, Math.round(args.index))) : data.slides.length;
    const slides = [...data.slides];
    slides.splice(index, 0, slide);
    bridge.setData({ ...data, slides });
    bridge.setActiveSlide(index);
    await addElementsPaced(bridge, slide.id, elements, paceMs);
    return {
      result: { slide_index: index, element_ids: elements.map((el) => el.id) },
      summary: `Diapositiva ${index + 1} creada con ${elements.length} elementos`,
      changes: [change(`Nueva diapositiva ${index + 1} (${elements.length} elementos)`, { kind: "slide-added", slideId: slide.id })],
    };
  },

  update_slide(bridge, data, args) {
    const index = requireSlideIndex(data, args.slide_index);
    const before = data.slides[index]!;
    bridge.setData(
      updateSlideAt(data, index, (slide) => ({
        ...slide,
        background: typeof args.background === "string" ? args.background : slide.background,
        transition: TRANSITIONS.includes(args.transition as Slide["transition"]) ? (args.transition as Slide["transition"]) : slide.transition,
        notes: typeof args.notes === "string" ? args.notes : slide.notes,
      })),
    );
    bridge.setActiveSlide(index);
    return {
      result: { slide_index: index },
      summary: `Diapositiva ${index + 1} actualizada`,
      changes: [change(`Fondo, transición o notas de la diapositiva ${index + 1}`, { kind: "slide-updated", slideId: before.id, before: { background: before.background, transition: before.transition, notes: before.notes } })],
    };
  },

  delete_slide(bridge, data, args) {
    const index = requireSlideIndex(data, args.slide_index);
    const before = data.slides[index]!;
    const slides = data.slides.filter((_, i) => i !== index);
    bridge.setData({ ...data, slides });
    bridge.setActiveSlide(Math.max(0, Math.min(bridge.getActiveSlide(), slides.length - 1)));
    return { result: { slide_count: slides.length }, summary: `Diapositiva ${index + 1} eliminada`, changes: [change(`Diapositiva ${index + 1} eliminada`, { kind: "slide-removed", index, before })] };
  },

  move_slide(bridge, data, args) {
    const from = requireSlideIndex(data, args.from_index);
    const to = requireSlideIndex(data, args.to_index);
    const slides = [...data.slides];
    const [moved] = slides.splice(from, 1);
    slides.splice(to, 0, moved!);
    bridge.setData({ ...data, slides });
    bridge.setActiveSlide(to);
    return {
      result: { slide_index: to },
      summary: `Diapositiva ${from + 1} movida a la posición ${to + 1}`,
      changes: from === to ? [] : [change(`Diapositiva movida de la posición ${from + 1} a la ${to + 1}`, { kind: "slide-moved", slideId: moved!.id, fromIndex: from })],
    };
  },

  async add_elements(bridge, data, args, paceMs) {
    const index = requireSlideIndex(data, args.slide_index);
    if (!Array.isArray(args.elements) || args.elements.length === 0) throw new ToolError('"elements" must be a non-empty array');
    const elements = args.elements.map(buildElement);
    const slideId = data.slides[index]!.id;
    bridge.setActiveSlide(index);
    await addElementsPaced(bridge, slideId, elements, paceMs);
    return {
      result: { element_ids: elements.map((el) => el.id) },
      summary: `${elements.length} ${elements.length === 1 ? "elemento añadido" : "elementos añadidos"} a la diapositiva ${index + 1}`,
      changes: elements.map((el) => change(`Añadido: ${describeElement(el)} · diapositiva ${index + 1}`, { kind: "element-added", slideId, elementId: el.id })),
    };
  },

  update_element(bridge, data, args) {
    const index = requireSlideIndex(data, args.slide_index);
    const slide = data.slides[index]!;
    const element = slide.elements.find((el) => el.id === args.element_id);
    if (!element) throw new ToolError(`No element with id "${String(args.element_id)}" on slide ${index}; call get_presentation to list ids`);
    const layout: Partial<SlideElement> = {};
    for (const key of ["x", "y", "w", "h", "rotation"] as const) {
      if (args[key] !== undefined) layout[key] = Math.round(requireNumber(args[key], key));
    }
    const props = args.props && typeof args.props === "object" ? (args.props as Record<string, unknown>) : undefined;
    bridge.setData(patchElement(data, index, element.id, layout, props));
    bridge.setActiveSlide(index);
    return {
      result: { element_id: element.id },
      summary: `Elemento ${element.type} actualizado en la diapositiva ${index + 1}`,
      changes: [change(`Modificado: ${describeElement(element)} · diapositiva ${index + 1}`, { kind: "element-updated", slideId: slide.id, elementId: element.id, before: element })],
    };
  },

  delete_element(bridge, data, args) {
    const index = requireSlideIndex(data, args.slide_index);
    const slide = data.slides[index]!;
    const element = slide.elements.find((el) => el.id === args.element_id);
    if (!element) throw new ToolError(`No element with id "${String(args.element_id)}" on slide ${index}`);
    const removed = getSubtree(slide.elements, element.id);
    bridge.setData(removeElement(data, index, element.id));
    bridge.setActiveSlide(index);
    return {
      result: { deleted: element.id },
      summary: `Elemento ${element.type} eliminado de la diapositiva ${index + 1}`,
      changes: [change(`Eliminado: ${describeElement(element)} · diapositiva ${index + 1}`, { kind: "element-removed", slideId: slide.id, before: removed })],
    };
  },

  set_title(bridge, _data, args) {
    if (typeof args.title !== "string" || !args.title.trim()) throw new ToolError('"title" must be a non-empty string');
    const before = bridge.getTitle();
    bridge.setTitle(args.title.trim().slice(0, 200));
    return { result: { title: bridge.getTitle() }, summary: "Título actualizado", changes: [change(`Título cambiado a «${bridge.getTitle()}»`, { kind: "title", before })] };
  },
};

/**
 * Run one tool call from the model against the editor.
 * Failures are reported back as text so the model can correct itself.
 * @param bridge - Editor capabilities
 * @param name - Tool name
 * @param rawArguments - Arguments as the JSON string produced by the model
 * @param options - Pacing options
 * @returns Outcome with the text for the model, a label and the changes made
 */
export async function executeTool(bridge: EditorBridge, name: string, rawArguments: string, options: ToolRunOptions = {}): Promise<ToolOutcome> {
  const handler = HANDLERS[name];
  if (!handler) return { ok: false, result: `Unknown tool "${name}"`, summary: `Herramienta desconocida: ${name}`, changes: [] };
  const data = bridge.getData();
  if (!data) return { ok: false, result: "The editor has no presentation loaded", summary: "Editor no disponible", changes: [] };
  try {
    const parsed: unknown = rawArguments.trim() ? JSON.parse(rawArguments) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new ToolError("Arguments must be a JSON object");
    const { result, summary, changes } = await handler(bridge, data, parsed as Record<string, unknown>, options.paceMs ?? DEFAULT_PACE_MS);
    return { ok: true, result: JSON.stringify(result), summary, changes: changes ?? [] };
  } catch (error) {
    const message = error instanceof SyntaxError ? "Arguments are not valid JSON; they may have been cut off. Retry with a smaller call." : error instanceof ToolError ? error.message : "The tool failed unexpectedly";
    return { ok: false, result: `Error: ${message}`, summary: `No se pudo ejecutar ${name}`, changes: [] };
  }
}

/** Names of the tools that have a handler, for consistency checks. */
export const TOOL_NAMES = Object.keys(HANDLERS);
