import type { SlideElement } from "@/types/presentation";

/**
 * Context for element rendering with scale and layout info.
 */
export interface ElementRenderContext {
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
  /** Fullscreen active flag */
  fullscreen?: boolean;
  /** Scale factor for fullscreen */
  scale?: number;
  /** Highlight state */
  highlighted?: boolean;
}

/**
 * Props for per-type property editors.
 */
export interface ElementPropertiesProps {
  /** Selected element */
  element: SlideElement;
  /**
   * Patch handler for element changes.
   * @param patch - Partial element with optional propsPatch
   */
  onPatch: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
  /** Full presentation data for variables */
  data?: unknown;
}

/**
 * Contract for element type handlers.
 */
export interface ElementDefinition {
  /** Discriminator type */
  readonly type: SlideElement["type"];
  /** Human-readable label in Spanish */
  readonly label: string;
  /**
   * Create a default element instance.
   * @param id - Unique element id
   * @returns SlideElement with defaults
   */
  createDefault(id: string): SlideElement;
  /**
   * Validate props object.
   * @param props - Raw props
   * @returns True if valid
   */
  validateProps?(props: unknown): boolean;
  /**
   * Render for editor canvas.
   * @param element - Element instance
   * @param ctx - Render context
   * @returns React node
   */
  renderEditor(element: SlideElement, ctx?: ElementRenderContext): React.ReactNode;
  /**
   * Render for player.
   * @param element - Element instance
   * @param ctx - Render context
   * @returns React node
   */
  renderPlayer(element: SlideElement, ctx: ElementRenderContext): React.ReactNode;
  /**
   * Render for thumbnail or preview.
   * @param element - Element instance
   * @param ctx - Render context
   * @returns React node
   */
  renderThumbnail(element: SlideElement, ctx?: ElementRenderContext): React.ReactNode;
  /**
   * Resolve property editor component for this type.
   * @returns Component or null
   */
  getPropertiesComponent(): React.ComponentType<ElementPropertiesProps> | null;
  /**
   * Determine if element is visually transparent for border handling.
   * @param element - Element instance
   * @returns True if transparent
   */
  isTransparent?(element: SlideElement): boolean;
}
