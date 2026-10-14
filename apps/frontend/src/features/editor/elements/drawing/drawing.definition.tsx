import { StrokesSvg } from "@/components/StrokesSvg";
import type { Stroke } from "@/lib/drawing/strokes";
import type { SlideElement } from "@/types/presentation";
import type { ElementDefinition, ElementPropertiesProps, ElementRenderContext } from "../registry/types";
import { ColorField, NumberField } from "../shared/fields";

/**
 * Props stored on a drawing element.
 */
export interface DrawingProps {
  /** Strokes with points normalized to the element box */
  strokes?: Stroke[];
  /** Width of the box when it was drawn; stroke widths refer to it */
  baseWidth?: number;
  /** Height of the box when it was drawn */
  baseHeight?: number;
}

/**
 * Render the strokes of a drawing stretched to the element box.
 * @param element - Drawing element
 * @returns React node
 */
function renderDrawing(element: SlideElement): React.ReactNode {
  const p = element.props as DrawingProps;
  return <StrokesSvg strokes={p.strokes ?? []} width={p.baseWidth ?? element.w} height={p.baseHeight ?? element.h} className="overflow-visible" />;
}

/**
 * Properties for drawing elements: recolor or rescale every stroke at once.
 * @param element - Drawing element
 * @param onPatch - Patch handler
 * @returns Property editor
 */
function DrawingProperties({ element, onPatch }: ElementPropertiesProps): React.ReactNode {
  const strokes = (element.props as DrawingProps).strokes ?? [];
  const first = strokes[0];

  /**
   * Apply a change to every stroke.
   * @param change - Fields to overwrite on each stroke
   */
  function patchStrokes(change: Partial<Pick<Stroke, "color" | "width">>): void {
    onPatch({ propsPatch: { strokes: strokes.map((s) => ({ ...s, ...change })) } });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {strokes.length} {strokes.length === 1 ? "trazo" : "trazos"}. Usa «Dibujar» en Insertar para crear otro dibujo.
      </p>
      {first && (
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Color" value={first.color} onChange={(v) => patchStrokes({ color: v })} />
          <NumberField label="Grosor" value={first.width} min={1} max={60} onChange={(v) => patchStrokes({ width: v })} />
        </div>
      )}
    </div>
  );
}

/**
 * Definition for freehand drawing elements.
 */
export const drawingDefinition: ElementDefinition = {
  type: "drawing",
  label: "Dibujo",

  /**
   * Create an empty drawing; the editor fills it from the drawing layer.
   * @param id - Element id
   * @returns SlideElement
   */
  createDefault(id: string): SlideElement {
    return { id, type: "drawing", x: 80, y: 80, w: 300, h: 200, rotation: 0, zIndex: 1, highlightable: true, parentId: null, props: { strokes: [], baseWidth: 300, baseHeight: 200 } satisfies DrawingProps };
  },

  /**
   * Render for editor canvas.
   * @param element - Element instance
   * @returns React node
   */
  renderEditor(element: SlideElement): React.ReactNode {
    return renderDrawing(element);
  },

  /**
   * Render for player.
   * @param element - Element instance
   * @returns React node
   */
  renderPlayer(element: SlideElement, _ctx: ElementRenderContext): React.ReactNode {
    return renderDrawing(element);
  },

  /**
   * Render for thumbnail.
   * @param element - Element instance
   * @returns React node
   */
  renderThumbnail(element: SlideElement): React.ReactNode {
    return renderDrawing(element);
  },

  /**
   * Resolve property editor component.
   * @returns Component type
   */
  getPropertiesComponent(): React.ComponentType<ElementPropertiesProps> {
    return DrawingProperties;
  },

  /**
   * Drawings have no background.
   * @returns True
   */
  isTransparent(): boolean {
    return true;
  },
};
