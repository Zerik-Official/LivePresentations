import { Select, type SelectOption } from "@/components/ui/Select";
import type { SlideElement } from "@/types/presentation";
import { ColorField, NumberField } from "../shared/fields";
import { buildShapeStyle, SHAPE_VARIANTS, type ShapeProps } from "./variants";

interface Props {
  element: SlideElement;
  onPatch: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
}

/**
 * Build thumbnail for shape variant using current fill.
 * @param variant - Shape variant
 * @param fill - Fill color
 */
function ShapeThumb({ variant, fill }: { variant: string; fill: string }): React.ReactNode {
  return <span className="h-4 w-6 shrink-0" style={buildShapeStyle({ variant, fill }, 4)} />;
}

/**
 * Properties for shape elements.
 * @param element - Shape element
 * @param onPatch - Patch handler
 */
export function ShapeProperties({ element, onPatch }: Props): React.ReactNode {
  const props = element.props as ShapeProps;
  const fill = props.fill ?? "#e4e4e7";
  const variant = props.variant ?? "rect";

  const options: SelectOption[] = SHAPE_VARIANTS.map((v) => ({ value: v.value, label: v.label, thumb: <ShapeThumb variant={v.value} fill={fill} /> }));

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Variante
        <Select value={variant} options={options} onChange={(v) => onPatch({ propsPatch: { variant: v } })} placeholder="Variante" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <ColorField label="Relleno" value={fill} onChange={(v) => onPatch({ propsPatch: { fill: v } })} />
        <NumberField label="Radio" value={props.radius ?? 12} min={0} onChange={(v) => onPatch({ propsPatch: { radius: v } })} />
        <NumberField label="Borde" value={props.borderWidth ?? 0} min={0} max={12} onChange={(v) => onPatch({ propsPatch: { borderWidth: v } })} />
        <ColorField label="Color borde" value={props.borderColor ?? "#18181b"} onChange={(v) => onPatch({ propsPatch: { borderColor: v } })} />
        <NumberField label="Opacidad" value={props.opacity ?? 1} min={0} max={1} step={0.05} onChange={(v) => onPatch({ propsPatch: { opacity: v } })} />
      </div>
    </div>
  );
}
