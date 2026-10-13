import { Select } from "@/components/ui/Select";
import type { SlideElement } from "@/types/presentation";
import type { ElementDefinition, ElementPropertiesProps, ElementRenderContext } from "../registry/types";
import { ColorField, NumberField } from "../shared/fields";

/**
 * Props stored on a line element.
 */
export interface LineProps {
  /** Which ends carry an arrowhead */
  variant?: "line" | "arrow" | "double-arrow";
  color?: string;
  /** Stroke width in logical slide pixels */
  width?: number;
  dash?: "solid" | "dashed" | "dotted";
}

/**
 * Render a horizontal line across the element box; rotate the element to angle it.
 * Lengths are percentages so the arrowheads keep their proportions at any size.
 * @param element - Line element
 * @param scale - Stroke scale factor
 * @returns React node
 */
function renderLine(element: SlideElement, scale = 1): React.ReactNode {
  const p = element.props as LineProps;
  const color = p.color ?? "#18181b";
  const width = Math.max(1, (p.width ?? 4) * scale);
  const variant = p.variant ?? "line";
  const dash = p.dash === "dashed" ? `${width * 3} ${width * 2}` : p.dash === "dotted" ? `0 ${width * 2}` : undefined;
  const markerId = `arrowhead-${element.id}`;
  const inset = variant === "line" ? width / 2 : width * 2;
  return (
    <svg className="h-full w-full overflow-visible">
      <defs>
        <marker id={markerId} markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth">
          <path d="M 0 0 L 4 2 L 0 4 z" fill={color} />
        </marker>
      </defs>
      <svg x={inset} width={`calc(100% - ${inset * 2}px)`} height="100%" overflow="visible">
        <line
          x1="0"
          y1="50%"
          x2="100%"
          y2="50%"
          stroke={color}
          strokeWidth={width}
          strokeDasharray={dash}
          strokeLinecap={p.dash === "dotted" ? "round" : "butt"}
          markerEnd={variant === "line" ? undefined : `url(#${markerId})`}
          markerStart={variant === "double-arrow" ? `url(#${markerId})` : undefined}
        />
      </svg>
    </svg>
  );
}

/**
 * Properties for line elements.
 * @param element - Line element
 * @param onPatch - Patch handler
 * @returns Property editor
 */
function LineProperties({ element, onPatch }: ElementPropertiesProps): React.ReactNode {
  const p = element.props as LineProps;
  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Tipo
        <Select
          value={p.variant ?? "line"}
          options={[
            { value: "line", label: "Línea" },
            { value: "arrow", label: "Flecha" },
            { value: "double-arrow", label: "Flecha doble" },
          ]}
          onChange={(v) => onPatch({ propsPatch: { variant: v } })}
        />
      </label>
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Trazo
        <Select
          value={p.dash ?? "solid"}
          options={[
            { value: "solid", label: "Continuo" },
            { value: "dashed", label: "Discontinuo" },
            { value: "dotted", label: "Punteado" },
          ]}
          onChange={(v) => onPatch({ propsPatch: { dash: v } })}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <ColorField label="Color" value={p.color ?? "#18181b"} onChange={(v) => onPatch({ propsPatch: { color: v } })} />
        <NumberField label="Grosor" value={p.width ?? 4} min={1} max={40} onChange={(v) => onPatch({ propsPatch: { width: v } })} />
      </div>
      <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">Usa la rotación para inclinar la línea.</p>
    </div>
  );
}

/**
 * Definition for line and arrow elements.
 */
export const lineDefinition: ElementDefinition = {
  type: "line",
  label: "Línea",

  /**
   * Create a default arrow.
   * @param id - Element id
   * @returns SlideElement
   */
  createDefault(id: string): SlideElement {
    return { id, type: "line", x: 80, y: 80, w: 320, h: 40, rotation: 0, zIndex: 1, highlightable: true, parentId: null, props: { variant: "arrow", color: "#18181b", width: 4, dash: "solid" } satisfies LineProps };
  },

  /**
   * Render for editor canvas.
   * @param element - Element instance
   * @returns React node
   */
  renderEditor(element: SlideElement): React.ReactNode {
    return renderLine(element);
  },

  /**
   * Render for player, scaling the stroke in fullscreen.
   * @param element - Element instance
   * @param ctx - Render context
   * @returns React node
   */
  renderPlayer(element: SlideElement, ctx: ElementRenderContext): React.ReactNode {
    return renderLine(element, ctx.fullscreen && ctx.scale ? ctx.scale : 1);
  },

  /**
   * Render for thumbnail.
   * @param element - Element instance
   * @returns React node
   */
  renderThumbnail(element: SlideElement): React.ReactNode {
    return renderLine(element);
  },

  /**
   * Resolve property editor component.
   * @returns Component type
   */
  getPropertiesComponent(): React.ComponentType<ElementPropertiesProps> {
    return LineProperties;
  },

  /**
   * Lines have no background.
   * @returns True
   */
  isTransparent(): boolean {
    return true;
  },
};
