import { Select, type SelectOption } from "@/components/ui/Select";
import type { SlideElement } from "@/types/presentation";

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
  const base = "h-4 w-6 shrink-0 border border-zinc-200 dark:border-zinc-600";
  const style: React.CSSProperties = { background: fill };
  if (variant === "circle") return <span className={`${base} rounded-full`} style={style} />;
  if (variant === "pill") return <span className={`${base} rounded-full`} style={{ ...style, borderRadius: 999 }} />;
  if (variant === "triangle") return <span className={base} style={{ ...style, clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />;
  if (variant === "diamond") return <span className={base} style={{ ...style, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />;
  if (variant === "hexagon") return <span className={base} style={{ ...style, clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }} />;
  return <span className={`${base} rounded-md`} style={style} />;
}

/**
 * Properties for shape elements.
 * @param element - Shape element
 * @param onPatch - Patch handler
 */
export function ShapeProperties({ element, onPatch }: Props): React.ReactNode {
  const props = element.props as { variant?: string; fill?: string; radius?: number; borderColor?: string; borderWidth?: number };
  const fill = props.fill ?? "#e4e4e7";
  const variant = props.variant ?? "rect";

  const options: SelectOption[] = [
    { value: "rect", label: "Rectángulo", thumb: <ShapeThumb variant="rect" fill={fill} /> },
    { value: "circle", label: "Círculo", thumb: <ShapeThumb variant="circle" fill={fill} /> },
    { value: "pill", label: "Píldora", thumb: <ShapeThumb variant="pill" fill={fill} /> },
    { value: "triangle", label: "Triángulo", thumb: <ShapeThumb variant="triangle" fill={fill} /> },
    { value: "diamond", label: "Diamante", thumb: <ShapeThumb variant="diamond" fill={fill} /> },
    { value: "hexagon", label: "Hexágono", thumb: <ShapeThumb variant="hexagon" fill={fill} /> },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Variante
        <Select value={variant} options={options} onChange={(v) => onPatch({ propsPatch: { variant: v } })} placeholder="Variante" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Relleno
          <input type="color" value={props.fill ?? "#e4e4e7"} onChange={(e) => onPatch({ propsPatch: { fill: e.target.value } })} className="h-9 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Radio
          <input type="number" value={props.radius ?? 12} onChange={(e) => onPatch({ propsPatch: { radius: Number(e.target.value) } })} className="rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Borde
          <input type="number" min={0} max={12} value={props.borderWidth ?? 0} onChange={(e) => onPatch({ propsPatch: { borderWidth: Number(e.target.value) } })} className="rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Color borde
          <input type="color" value={props.borderColor ?? "#18181b"} onChange={(e) => onPatch({ propsPatch: { borderColor: e.target.value } })} className="h-9 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1" />
        </label>
      </div>
    </div>
  );
}