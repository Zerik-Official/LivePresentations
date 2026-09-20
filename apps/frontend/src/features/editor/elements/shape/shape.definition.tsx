import { ShapeProperties } from "./ShapeProperties";
import type { SlideElement } from "@/types/presentation";
import type { ElementDefinition, ElementPropertiesProps, ElementRenderContext } from "../registry/types";

/**
 * Definition for shape elements.
 */
export const shapeDefinition: ElementDefinition = {
  type: "shape",
  label: "Forma",

  /**
   * Create a default shape element.
   * @param id - Element id
   * @returns SlideElement
   */
  createDefault(id: string): SlideElement {
    return { id, type: "shape", x: 80, y: 80, w: 200, h: 120, rotation: 0, zIndex: 1, highlightable: true, parentId: null, props: { variant: "rect", fill: "#e4e4e7", radius: 12, borderColor: "#18181b", borderWidth: 0 } };
  },

  /**
   * Build shape style from props.
   * @param element - Element instance
   * @returns Style object
   */
  renderEditor(element: SlideElement): React.ReactNode {
    const p = element.props as { fill?: string; radius?: number; borderColor?: string; borderWidth?: number; variant?: string };
    const variant = p.variant ?? "rect";
    const shapeStyle: React.CSSProperties = {
      background: p.fill ?? "#e4e4e7",
      border: p.borderWidth ? `${p.borderWidth}px solid ${p.borderColor ?? "#18181b"}` : undefined,
    };
    if (variant === "circle") shapeStyle.borderRadius = "50%";
    else if (variant === "pill") shapeStyle.borderRadius = 9999;
    else if (variant === "triangle") shapeStyle.clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)";
    else if (variant === "diamond") shapeStyle.clipPath = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
    else if (variant === "hexagon") shapeStyle.clipPath = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
    else shapeStyle.borderRadius = p.radius ?? 12;
    return <div style={shapeStyle} className="h-full w-full" />;
  },

  /**
   * Render for player.
   * @param element - Element instance
   * @returns React node
   */
  renderPlayer(element: SlideElement, _ctx: ElementRenderContext): React.ReactNode {
    const p = element.props as { variant?: string; fill?: string; radius?: number; borderColor?: string; borderWidth?: number };
    const variant = p.variant ?? "rect";
    const shapeStyle: React.CSSProperties = {
      background: p.fill ?? "#e4e4e7",
      border: p.borderWidth ? `${p.borderWidth}px solid ${p.borderColor ?? "#18181b"}` : undefined,
    };
    if (variant === "circle") shapeStyle.borderRadius = "50%";
    else if (variant === "pill") shapeStyle.borderRadius = 9999;
    else if (variant === "triangle") shapeStyle.clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)";
    else if (variant === "diamond") shapeStyle.clipPath = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
    else if (variant === "hexagon") shapeStyle.clipPath = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
    else shapeStyle.borderRadius = p.radius ?? 12;
    return <div style={shapeStyle} className="h-full w-full" />;
  },

  /**
   * Render for thumbnail.
   * @param element - Element instance
   * @returns React node
   */
  renderThumbnail(element: SlideElement): React.ReactNode {
    const p = element.props as { fill?: string; radius?: number; variant?: string; borderColor?: string; borderWidth?: number };
    const variant = p.variant ?? "rect";
    const s: React.CSSProperties = {
      background: p.fill ?? "#e4e4e7",
      border: p.borderWidth ? `${p.borderWidth}px solid ${p.borderColor ?? "#18181b"}` : undefined,
    };
    if (variant === "circle") s.borderRadius = "50%";
    else if (variant === "pill") s.borderRadius = 9999;
    else if (variant === "triangle") s.clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)";
    else if (variant === "diamond") s.clipPath = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
    else if (variant === "hexagon") s.clipPath = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
    else s.borderRadius = p.radius ?? 8;
    return <div style={s} className="h-full w-full" />;
  },

  /**
   * Resolve property editor component.
   * @returns Component type
   */
  getPropertiesComponent(): React.ComponentType<ElementPropertiesProps> {
    return function ShapeWrapper({ element, onPatch }: ElementPropertiesProps): React.ReactNode {
      return <ShapeProperties element={element} onPatch={onPatch} />;
    };
  },
};
