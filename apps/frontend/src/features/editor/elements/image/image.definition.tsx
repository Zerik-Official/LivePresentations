import { CroppedMedia, readCrop } from "@/components/CroppedMedia";
import { ImageProperties } from "./ImageProperties";
import type { ImageElementProps, SlideElement } from "@/types/presentation";
import type { ElementDefinition, ElementPropertiesProps, ElementRenderContext } from "../registry/types";

const FIT_CLASSES: Record<ImageElementProps["fit"], string> = { cover: "object-cover", contain: "object-contain", fill: "object-fill", none: "object-none" };

/**
 * Render an image, cropped to a region of the source when one is set.
 * A crop always fills the frame; the fit option applies to uncropped images.
 * @param element - Image element
 * @param rounding - Corner radius class
 * @param extraClass - Extra classes for uncropped images
 * @returns React node
 */
function renderImage(element: SlideElement, rounding: string, extraClass = ""): React.ReactNode {
  const p = element.props as unknown as ImageElementProps;
  const crop = readCrop(p.crop);
  if (crop) {
    return (
      <CroppedMedia crop={crop} className={rounding}>
        <img src={p.src ?? ""} alt={p.alt ?? ""} className="h-full w-full object-fill" draggable={false} />
      </CroppedMedia>
    );
  }
  return <img src={p.src ?? ""} alt={p.alt ?? ""} className={`h-full w-full ${rounding} ${FIT_CLASSES[p.fit] ?? "object-cover"} ${extraClass}`} draggable={false} />;
}

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
    return renderImage(element, "rounded-md", "bg-transparent");
  },

  /**
   * Render for player.
   * @param element - Element instance
   * @returns React node
   */
  renderPlayer(element: SlideElement, _ctx: ElementRenderContext): React.ReactNode {
    const fit = (element.props as unknown as ImageElementProps).fit ?? "cover";
    return renderImage(element, "rounded-md", fit === "contain" ? "bg-zinc-100" : "");
  },

  /**
   * Render for thumbnail.
   * @param element - Element instance
   * @returns React node
   */
  renderThumbnail(element: SlideElement): React.ReactNode {
    return renderImage(element, "rounded-sm");
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
