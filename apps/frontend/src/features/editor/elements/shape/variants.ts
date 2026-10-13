/**
 * Shape variant catalog shared by the canvas, the player and the properties panel.
 */

/**
 * Describes how a shape variant is drawn.
 */
export interface ShapeVariant {
  /** Stored identifier */
  value: string;
  /** Label in Spanish */
  label: string;
  /** CSS polygon for clipped shapes */
  clipPath?: string;
  /** Fixed CSS radius for rounded shapes; rect uses the element radius instead */
  radius?: string | number;
}

/** Every shape variant, in menu order. */
export const SHAPE_VARIANTS: ShapeVariant[] = [
  { value: "rect", label: "Rectángulo" },
  { value: "circle", label: "Círculo", radius: "50%" },
  { value: "pill", label: "Píldora", radius: 9999 },
  { value: "triangle", label: "Triángulo", clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" },
  { value: "diamond", label: "Diamante", clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
  { value: "pentagon", label: "Pentágono", clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" },
  { value: "hexagon", label: "Hexágono", clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" },
  { value: "octagon", label: "Octágono", clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)" },
  { value: "star", label: "Estrella", clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" },
  { value: "parallelogram", label: "Paralelogramo", clipPath: "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)" },
  { value: "trapezoid", label: "Trapecio", clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)" },
  { value: "arrow-right", label: "Flecha derecha", clipPath: "polygon(0% 25%, 60% 25%, 60% 0%, 100% 50%, 60% 100%, 60% 75%, 0% 75%)" },
  { value: "arrow-left", label: "Flecha izquierda", clipPath: "polygon(40% 0%, 40% 25%, 100% 25%, 100% 75%, 40% 75%, 40% 100%, 0% 50%)" },
  { value: "chevron", label: "Galón", clipPath: "polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%)" },
  { value: "cross", label: "Cruz", clipPath: "polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)" },
  { value: "bubble", label: "Bocadillo", clipPath: "polygon(0% 0%, 100% 0%, 100% 75%, 45% 75%, 25% 100%, 28% 75%, 0% 75%)" },
];

/**
 * Props stored on a shape element.
 */
export interface ShapeProps {
  variant?: string;
  fill?: string;
  radius?: number;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
}

/**
 * Build the CSS style that draws a shape.
 * @param props - Shape props
 * @param defaultRadius - Radius used by rectangles without one
 * @returns Style for a full-size div
 */
export function buildShapeStyle(props: ShapeProps, defaultRadius = 12): React.CSSProperties {
  const variant = SHAPE_VARIANTS.find((v) => v.value === props.variant);
  const style: React.CSSProperties = {
    background: props.fill ?? "#e4e4e7",
    border: props.borderWidth ? `${props.borderWidth}px solid ${props.borderColor ?? "#18181b"}` : undefined,
    opacity: props.opacity ?? 1,
  };
  if (variant?.clipPath) style.clipPath = variant.clipPath;
  else style.borderRadius = variant?.radius ?? props.radius ?? defaultRadius;
  return style;
}
