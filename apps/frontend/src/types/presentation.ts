/**
 * Presentation domain types.
 */

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

/**
 * Slide element with absolute layout and extensible props.
 */
export interface SlideElement {
  id: string;
  type: "text" | "image" | "shape" | "video" | "code" | "icon" | "specials";
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  zIndex: number;
  props: Record<string, unknown>;
  animation?: {
    type: "fadeIn" | "slideIn" | "scaleIn";
    delayMs: number;
    durationMs: number;
  };
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
