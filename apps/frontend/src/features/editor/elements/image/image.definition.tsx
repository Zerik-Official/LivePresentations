import { ImageProperties } from "./ImageProperties";
import type { ImageElementProps, SlideElement } from "@/types/presentation";
import type { ElementDefinition, ElementPropertiesProps, ElementRenderContext } from "../registry/types";

/**
 * Definition for image elements.
 */
export const imageDefinition: ElementDefinition = {
  type: "image",
  label: "Imagen",

  /**
   * Create a default image element.
   * @param id - Element id
   * @returns SlideElement
   */
  createDefault(id: string): SlideElement {
    return {
      id,
      type: "image",
      x: 80,
      y: 80,
      w: 400,
      h: 250,
      rotation: 0,
      zIndex: 1,
      highlightable: true,
      parentId: null,
      props: { src: "https://picsum.photos/400/250", alt: "Imagen", fit: "cover" } satisfies ImageElementProps as unknown as Record<string, unknown>,
    };
  },

  /**
   * Render for editor canvas.
   * @param element - Element instance
   * @returns React node
   */
  renderEditor(element: SlideElement): React.ReactNode {
    const p = element.props as unknown as ImageElementProps;
    const fit = p.fit ?? "cover";
    const fitClass = fit === "contain" ? "object-contain" : fit === "fill" ? "object-fill" : fit === "none" ? "object-none" : "object-cover";
    return <img src={p.src ?? ""} alt={p.alt ?? ""} className={`h-full w-full rounded-md ${fitClass} bg-transparent`} draggable={false} />;
  },

  /**
   * Render for player.
   * @param element - Element instance
   * @returns React node
   */
  renderPlayer(element: SlideElement, _ctx: ElementRenderContext): React.ReactNode {
    const p = element.props as unknown as ImageElementProps;
    const fit = p.fit ?? "cover";
    const fitClass = fit === "contain" ? "object-contain" : fit === "fill" ? "object-fill" : fit === "none" ? "object-none" : "object-cover";
    const bgClass = fit === "contain" ? "bg-zinc-100" : "";
    return <img src={p.src ?? ""} alt={p.alt ?? ""} className={`h-full w-full rounded-md ${fitClass} ${bgClass}`} draggable={false} />;
  },

  /**
   * Render for thumbnail.
   * @param element - Element instance
   * @returns React node
   */
  renderThumbnail(element: SlideElement): React.ReactNode {
    const p = element.props as unknown as ImageElementProps;
    const fit = p.fit ?? "cover";
    const fitClass = fit === "contain" ? "object-contain" : fit === "fill" ? "object-fill" : fit === "none" ? "object-none" : "object-cover";
    return <img src={p.src ?? ""} alt="" className={`h-full w-full rounded-sm ${fitClass}`} draggable={false} />;
  },

  /**
   * Resolve property editor component.
   * @returns Component type
   */
  getPropertiesComponent(): React.ComponentType<ElementPropertiesProps> {
    return function ImageWrapper({ element, onPatch }: ElementPropertiesProps): React.ReactNode {
      return <ImageProperties element={element} onPatch={onPatch} />;
    };
  },

  /**
   * Determine transparency.
   * @returns True if transparent
   */
  isTransparent(): boolean {
    return true;
  },
};
