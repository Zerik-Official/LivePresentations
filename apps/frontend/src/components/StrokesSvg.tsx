import { HIGHLIGHTER_OPACITY, strokeToPath, type Stroke } from "@/lib/drawing/strokes";

interface Props {
  /** Strokes to paint, in drawing order */
  strokes: Stroke[];
  /** Logical width the stroke widths refer to */
  width: number;
  /** Logical height the stroke widths refer to */
  height: number;
  /** Extra classes for the svg element */
  className?: string;
}

/**
 * Paint freehand strokes as an SVG that stretches to its container.
 * @param strokes - Strokes to paint
 * @param width - Logical width
 * @param height - Logical height
 * @param className - Extra classes
 * @returns SVG element
 */
export function StrokesSvg({ strokes, width, height, className = "" }: Props): React.ReactNode {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={`h-full w-full ${className}`}>
      {strokes.map((stroke) => (
        <path
          key={stroke.id}
          d={strokeToPath(stroke.points, width, height)}
          fill="none"
          stroke={stroke.color}
          strokeWidth={stroke.width}
          strokeOpacity={stroke.tool === "highlighter" ? HIGHLIGHTER_OPACITY : 1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
