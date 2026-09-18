import { z } from "zod";

/**
 * Variable type for presentation-level variables.
 */
export const variableSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  varType: z.enum(["number", "boolean", "string", "array", "object"]),
  arrayType: z.enum(["string", "number", "boolean", "array", "object", "any"]).optional(),
  value: z.unknown(),
});

export type Variable = z.infer<typeof variableSchema>;

/**
 * Schema for a slide element.
 */
export const elementSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "image", "shape", "video", "code", "icon", "specials"]),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  rotation: z.number().default(0),
  zIndex: z.number().default(0),
  props: z.record(z.string(), z.unknown()).default({}),
  animation: z
    .object({
      type: z.enum(["fadeIn", "slideIn", "scaleIn"]).default("fadeIn"),
      delayMs: z.number().default(0),
      durationMs: z.number().default(300),
    })
    .optional(),
  highlightable: z.boolean().default(true),
  parentId: z.string().nullable().optional().default(null),
});

export type SlideElement = z.infer<typeof elementSchema>;

/**
 * Schema for a slide.
 */
export const slideSchema = z.object({
  id: z.string(),
  background: z.string().default("#ffffff"),
  elements: z.array(elementSchema).default([]),
  transition: z.enum(["fade", "slide", "zoom"]).default("fade"),
  notes: z.string().optional(),
});

export type Slide = z.infer<typeof slideSchema>;

/**
 * Schema for a full presentation.
 */
export const presentationDataSchema = z.object({
  slides: z.array(slideSchema).default([]),
  theme: z
    .object({
      primary: z.string().default("#18181b"),
      accent: z.string().default("#18181b"),
    })
    .default({ primary: "#18181b", accent: "#18181b" }),
  width: z.number().default(1280),
  height: z.number().default(720),
  variables: z.array(variableSchema).default([]),
});

export type PresentationData = z.infer<typeof presentationDataSchema>;

/**
 * Parse unknown data into validated presentation data.
 * @param data - Raw JSON data
 * @returns Validated presentation data
 */
export function parsePresentationData(data: unknown): PresentationData {
  const parsed = presentationDataSchema.safeParse(data);
  if (parsed.success) return parsed.data;
  return { slides: [], theme: { primary: "#18181b", accent: "#18181b" }, width: 1280, height: 720, variables: [] };
}

/**
 * Create an empty slide with a unique id.
 * @param id - Slide id
 * @returns Slide object
 */
export function createEmptySlide(id: string): Slide {
  return { id, background: "#ffffff", elements: [], transition: "fade" };
}

/**
 * Text element props typing helper.
 */
export interface TextElementProps {
  text: string;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right" | "justify";
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontFamily: string;
  lineHeight: number;
  letterSpacing: number;
  opacity: number;
  backgroundEnabled: boolean;
  backgroundColor: string;
  backgroundRadius: number;
  backgroundPadding: number;
}

/**
 * Image element props typing helper.
 */
export interface ImageElementProps {
  src: string;
  alt: string;
  fit: "cover" | "contain" | "fill" | "none";
}

/**
 * Specials element props typing helper (e.g., specials-answers).
 */
export interface SpecialsElementProps {
  text: string;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  backgroundColor: string;
  textColor: string;
  kind: string;
  questionId: string;
  variableId?: string;
  randomSelection: boolean;
  discardAfterPick: boolean;
  selectorType: "strip" | "wheel";
  selectorDuration: number;
  questionText: string;
  questionColor: string;
  questionAlign: "left" | "center" | "right" | "justify";
  answersCount: number;
  answersFormat: "letters" | "numbers" | "text";
  answers: string[];
  correctAnswerIndex: number | null;
  extraCodeBlocks: Array<{ language: string; code: string }>;
}

/**
 * Get direct children of an element.
 * @param elements - All slide elements
 * @param parentId - Parent element id
 * @returns Child elements
 */
export function getChildren(elements: SlideElement[], parentId: string): SlideElement[] {
  return elements.filter((e) => e.parentId === parentId);
}

/**
 * Get all descendant ids of a parent recursively.
 * @param elements - All slide elements
 * @param parentId - Parent id
 * @returns List of descendant ids
 */
export function getDescendantIds(elements: SlideElement[], parentId: string): string[] {
  const direct = elements.filter((e) => e.parentId === parentId);
  const ids: string[] = direct.map((e) => e.id);
  for (const child of direct) ids.push(...getDescendantIds(elements, child.id));
  return ids;
}

/**
 * Get ancestor ids for cycle detection.
 * @param elements - All slide elements
 * @param elementId - Starting element id
 * @returns Ancestor ids
 */
export function getAncestorIds(elements: SlideElement[], elementId: string): string[] {
  const map = new Map(elements.map((e) => [e.id, e]));
  const ancestors: string[] = [];
  let current = map.get(elementId);
  const seen = new Set<string>();
  while (current?.parentId) {
    if (seen.has(current.parentId)) break;
    seen.add(current.parentId);
    ancestors.push(current.parentId);
    current = map.get(current.parentId);
  }
  return ancestors;
}

/**
 * Check whether linking child -> parent would create a cycle.
 * @param elements - All slide elements
 * @param childId - Child id
 * @param parentId - Proposed parent id
 * @returns True if valid (no cycle)
 */
export function canLink(elements: SlideElement[], childId: string, parentId: string | null): boolean {
  if (!parentId) return true;
  if (childId === parentId) return false;
  const descendants = getDescendantIds(elements, childId);
  if (descendants.includes(parentId)) return false;
  return elements.some((e) => e.id === parentId);
}

/**
 * Build a tree structure from flat elements.
 * @param elements - Flat elements
 * @returns Roots with nested children
 */
export function buildElementTree(elements: SlideElement[]): Array<SlideElement & { children: SlideElement[] }> {
  const map = new Map<string, SlideElement & { children: SlideElement[] }>();
  for (const el of elements) map.set(el.id, { ...el, children: [] });
  const roots: Array<SlideElement & { children: SlideElement[] }> = [];
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) map.get(node.parentId)!.children.push(node);
    else roots.push(node);
  }
  const sortByZ = (a: SlideElement, b: SlideElement): number => a.zIndex - b.zIndex;
  for (const n of map.values()) n.children.sort(sortByZ);
  roots.sort(sortByZ);
  return roots;
}

/**
 * Collect subtree (node + all descendants) as flat list.
 * @param elements - All elements
 * @param rootId - Root id
 * @returns Flat subtree including root
 */
export function getSubtree(elements: SlideElement[], rootId: string): SlideElement[] {
  const ids = new Set([rootId, ...getDescendantIds(elements, rootId)]);
  return elements.filter((e) => ids.has(e.id));
}

/**
 * Create a default element of a given type.
 * @param type - Element type
 * @param id - Element id
 * @returns SlideElement
 */
export function createDefaultElement(type: SlideElement["type"], id: string): SlideElement {
  const base = { id, type, x: 80, y: 80, w: 300, h: 80, rotation: 0, zIndex: 1, highlightable: true, parentId: null } as const;
  switch (type) {
    case "text":
      return {
        ...base,
        props: {
          text: "Texto de ejemplo",
          fontSize: 32,
          color: "#18181b",
          align: "left",
          bold: false,
          italic: false,
          underline: false,
          fontFamily: "Inter",
          lineHeight: 1.2,
          letterSpacing: 0,
          opacity: 1,
          backgroundEnabled: false,
          backgroundColor: "#ffffff",
          backgroundRadius: 8,
          backgroundPadding: 8,
        } satisfies TextElementProps as unknown as Record<string, unknown>,
      };
    case "image":
      return {
        ...base,
        w: 400,
        h: 250,
        props: { src: "https://picsum.photos/400/250", alt: "Imagen", fit: "cover" } satisfies ImageElementProps as unknown as Record<string, unknown>,
      };
    case "shape":
      return { ...base, w: 200, h: 120, props: { variant: "rect", fill: "#e4e4e7", radius: 12, borderColor: "#18181b", borderWidth: 0 } };
    case "video":
      return { ...base, w: 480, h: 270, props: { src: "", poster: "", autoplay: false, loop: false, muted: true, controls: true } };
    case "code":
      return {
        ...base,
        w: 520,
        h: 200,
        props: { code: "console.log('Hola mundo')", language: "javascript", theme: "vscDarkPlus", fontSize: 12, lineNumbers: true },
      };
    case "icon":
      return { ...base, w: 80, h: 80, props: { name: "FaStar", color: "#f59e0b", size: 48, bg: "transparent", bgColor: "#ffffff", rounded: 12 } };
    case "specials":
      return {
        ...base,
        w: 400,
        h: 80,
        props: {
          text: "Respuesta especial",
          icon: "FaStar",
          iconColor: "#f59e0b",
          iconBgColor: "#ffffff",
          backgroundColor: "#fffbeb",
          textColor: "#18181b",
          kind: "specials-answers",
          questionId: `q-${Date.now()}`,
          variableId: undefined,
          randomSelection: true,
          discardAfterPick: true,
          selectorType: "strip",
          selectorDuration: 5,
          questionText: "¿Pregunta de ejemplo?",
          questionColor: "#18181b",
          questionAlign: "center",
          answersCount: 4,
          answersFormat: "letters",
          answers: ["Respuesta A", "Respuesta B", "Respuesta C", "Respuesta D"],
          correctAnswerIndex: 0,
          extraCodeBlocks: [],
        } satisfies SpecialsElementProps as unknown as Record<string, unknown>,
      };
    default:
      return { ...base, props: {} };
  }
}