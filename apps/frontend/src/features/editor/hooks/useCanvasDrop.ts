import { createDefaultElement, type PresentationData, type SlideElement } from "../../../types/presentation";
import { uploadFile } from "../../../lib/api";

/**
 * Hook for handling file drops on the canvas.
 * @param data - Presentation data
 * @param activeSlide - Active slide index
 * @param setData - Data setter
 * @param setSelectedId - Selected element setter
 * @param onError - Error handler
 */
export function useCanvasDrop(
  data: PresentationData | null,
  activeSlide: number,
  setData: (d: PresentationData) => void,
  setSelectedId: (id: string | null) => void,
  onError: (msg: string) => void,
): {
  handleCanvasDrop: (e: React.DragEvent) => Promise<void>;
} {
  /**
   * Handle file drop on canvas to create image/video element.
   * @param e - Drag event
   */
  async function handleCanvasDrop(e: React.DragEvent): Promise<void> {
    e.preventDefault();
    if (!data) return;
    const slide = data.slides[activeSlide];
    if (!slide) return;
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      onError("Archivo excede 100MB");
      return;
    }
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
    try {
      const { url } = await uploadFile(file);
      const type: SlideElement["type"] = file.type.startsWith("image/") ? "image" : "video";
      const el = createDefaultElement(type, `el-${Date.now()}`);
      el.props = { ...el.props, src: url };
      el.x = Math.max(0, 80);
      el.y = Math.max(0, 80);
      const slides = [...data.slides];
      slides[activeSlide] = { ...slide, elements: [...slide.elements, el] };
      setData({ ...data, slides });
      setSelectedId(el.id);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error al subir archivo");
    }
  }

  return { handleCanvasDrop };
}