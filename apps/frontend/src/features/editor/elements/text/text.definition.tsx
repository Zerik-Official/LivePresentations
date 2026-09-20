import { SecretText } from "./SecretText";
import { TextProperties } from "./TextProperties";
import type { SlideElement, TextElementProps } from "@/types/presentation";
import type { ElementDefinition, ElementPropertiesProps, ElementRenderContext } from "../registry/types";

/**
 * Definition for text elements.
 */
export const textDefinition: ElementDefinition = {
  type: "text",
  label: "Texto",

  /**
   * Create a default text element.
   * @param id - Element id
   * @returns SlideElement
   */
  createDefault(id: string): SlideElement {
    return {
      id,
      type: "text",
      x: 80,
      y: 80,
      w: 300,
      h: 80,
      rotation: 0,
      zIndex: 1,
      highlightable: true,
      parentId: null,
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
  },

  /**
   * Render for editor canvas.
   * @param element - Element instance
   * @returns React node
   */
  renderEditor(element: SlideElement): React.ReactNode {
    const p = element.props as unknown as TextElementProps;
    const hasBg = Boolean(p.backgroundEnabled);
    return (
      <div
        style={{
          fontSize: p.fontSize ?? 24,
          color: p.color ?? "#18181b",
          fontWeight: p.bold ? 700 : 400,
          fontStyle: p.italic ? "italic" : "normal",
          textDecoration: p.underline ? "underline" : "none",
          textAlign: (p.align as React.CSSProperties["textAlign"]) ?? "left",
          fontFamily: p.fontFamily ? `"${p.fontFamily}", sans-serif` : undefined,
          lineHeight: p.lineHeight ?? 1.2,
          letterSpacing: p.letterSpacing ? `${p.letterSpacing}px` : undefined,
          opacity: p.opacity ?? 1,
          backgroundColor: hasBg ? (p.backgroundColor ?? "#ffffff") : "transparent",
          borderRadius: hasBg ? (p.backgroundRadius ?? 8) : undefined,
          padding: hasBg ? (p.backgroundPadding ?? 8) : 8,
        }}
        className="h-full w-full overflow-hidden text-sm"
      >
        <SecretText text={p.text ?? ""} />
      </div>
    );
  },

  /**
   * Render for player.
   * @param element - Element instance
   * @param ctx - Render context
   * @returns React node
   */
  renderPlayer(element: SlideElement, ctx: ElementRenderContext): React.ReactNode {
    const p = element.props as unknown as TextElementProps;
    const hasBg = Boolean(p.backgroundEnabled);
    const baseFont = p.fontSize ?? 32;
    const scaledFont = ctx.fullscreen && ctx.scale ? baseFont * ctx.scale : baseFont;
    const padding = hasBg ? (p.backgroundPadding ?? 8) * (ctx.fullscreen && ctx.scale ? ctx.scale : 1) : 8;
    return (
      <div
        style={{
          fontSize: scaledFont,
          color: p.color ?? "#18181b",
          textAlign: (p.align as React.CSSProperties["textAlign"]) ?? "left",
          fontWeight: p.bold ? 700 : 400,
          fontStyle: p.italic ? "italic" : "normal",
          textDecoration: p.underline ? "underline" : "none",
          fontFamily: p.fontFamily ? `"${p.fontFamily}", sans-serif` : undefined,
          lineHeight: p.lineHeight ?? 1.2,
          letterSpacing: p.letterSpacing ? `${p.letterSpacing}px` : undefined,
          opacity: p.opacity ?? 1,
          backgroundColor: hasBg ? (p.backgroundColor ?? "#ffffff") : "transparent",
          borderRadius: hasBg ? (p.backgroundRadius ?? 8) : undefined,
          padding,
        }}
        className="h-full w-full overflow-hidden"
      >
        <SecretText text={p.text ?? ""} />
      </div>
    );
  },

  /**
   * Render for thumbnail.
   * @param element - Element instance
   * @returns React node
   */
  renderThumbnail(element: SlideElement): React.ReactNode {
    const p = element.props as Partial<TextElementProps>;
    const hasBg = Boolean(p.backgroundEnabled);
    return (
      <div
        style={{
          fontSize: p.fontSize ?? 24,
          color: p.color ?? "#18181b",
          textAlign: (p.align as React.CSSProperties["textAlign"]) ?? "left",
          fontWeight: p.bold ? 700 : 400,
          fontFamily: p.fontFamily ? `"${p.fontFamily}", sans-serif` : undefined,
          overflow: "hidden",
          lineHeight: 1.2,
          backgroundColor: hasBg ? (p.backgroundColor ?? "#ffffff") : "transparent",
          borderRadius: hasBg ? (p.backgroundRadius ?? 4) : undefined,
        }}
        className="p-1"
      >
        <SecretText text={(p.text ?? "").slice(0, 80)} />
      </div>
    );
  },

  /**
   * Resolve property editor component.
   * @returns Component type
   */
  getPropertiesComponent(): React.ComponentType<ElementPropertiesProps> {
    return function TextWrapper({ element, onPatch }: ElementPropertiesProps): React.ReactNode {
      return <TextProperties element={element} onPatch={onPatch} />;
    };
  },

  /**
   * Determine transparency for border handling.
   * @param element - Element instance
   * @returns True if transparent
   */
  isTransparent(element: SlideElement): boolean {
    return !(element.props as Partial<TextElementProps>).backgroundEnabled;
  },
};
