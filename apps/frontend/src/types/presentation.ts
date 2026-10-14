/**
 * Presentation domain types.
 */

import type { ElementAnimation } from "@/lib/animations/effects";

/**
 * Variable definition for presentation-level state.
 */
export interface Variable {
  id: string;
  name: string;
  varType: "number" | "boolean" | "string" | "array" | "object";
  arrayType?: "string" | "number" | "boolean" | "array" | "object" | "any";
  value: unknown;
}

/** Element types supported by the editor, in schema order. */
export const ELEMENT_TYPES = ["text", "image", "shape", "video", "code", "icon", "specials", "line", "drawing", "table"] as const;

/** Discriminator of a slide element. */
export type ElementType = (typeof ELEMENT_TYPES)[number];

/**
 * Slide element with absolute layout and extensible props.
 */
export interface SlideElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  zIndex: number;
  props: Record<string, unknown>;
  /** Legacy entrance animation, kept for presentations created before `animations` */
  animation?: {
    type: "fadeIn" | "slideIn" | "scaleIn";
    delayMs: number;
    durationMs: number;
  };
  /** Animations played when the slide appears or when the controller triggers them */
  animations?: ElementAnimation[];
  highlightable: boolean;
  parentId: string | null;
}

/**
 * Single slide containing elements.
 */
export interface Slide {
  id: string;
  background: string;
  elements: SlideElement[];
  transition: "fade" | "slide" | "zoom";
  notes?: string;
}

/**
 * Full presentation payload persisted on backend.
 */
export interface PresentationData {
  slides: Slide[];
  theme: {
    primary: string;
    accent: string;
  };
  width: number;
  height: number;
  variables: Variable[];
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
  /** Part of the source to show, as fractions of its size */
  crop?: MediaCrop;
}

/**
 * Region of an image or video source, as fractions (0-1) of its width and height.
 */
export interface MediaCrop {
  x: number;
  y: number;
  w: number;
  h: number;
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
