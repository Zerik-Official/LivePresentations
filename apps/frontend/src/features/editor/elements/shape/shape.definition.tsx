import { ShapeProperties } from "./ShapeProperties";
import { buildShapeStyle, type ShapeProps } from "./variants";
import type { SlideElement } from "@/types/presentation";
import type { ElementDefinition, ElementPropertiesProps, ElementRenderContext } from "../registry/types";

/**
 * Render a shape filling its container.
 * @param element - Shape element
 * @param defaultRadius - Radius used by rectangles without one
 * @returns React node
 */
function renderShape(element: SlideElement, defaultRadius = 12): React.ReactNode {
  return <div style={buildShapeStyle(element.props as ShapeProps, defaultRadius)} className="h-full w-full" />;
}

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
    return { id, type: "shape", x: 80, y: 80, w: 200, h: 120, rotation: 0, zIndex: 1, highlightable: true, parentId: null, props: { variant: "rect", fill: "#e4e4e7", radius: 12, borderColor: "#18181b", borderWidth: 0, opacity: 1 } };
  },

  /**
   * Render for editor canvas.
   * @param element - Element instance
   * @returns React node
   */
  renderEditor(element: SlideElement): React.ReactNode {
    return renderShape(element);
  },

  /**
   * Render for player.
   * @param element - Element instance
   * @returns React node
   */
  renderPlayer(element: SlideElement, _ctx: ElementRenderContext): React.ReactNode {
    return renderShape(element);
  },

  /**
   * Render for thumbnail.
   * @param element - Element instance
   * @returns React node
   */
  renderThumbnail(element: SlideElement): React.ReactNode {
    return renderShape(element, 8);
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

  /**
   * Shapes paint their own background, so the canvas frame stays transparent.
   * @returns True
   */
  isTransparent(): boolean {
    return true;
  },
};
