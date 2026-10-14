import { StrokesSvg } from "@/components/StrokesSvg";
import type { Stroke, StrokePoint } from "@/lib/drawing/strokes";

interface Props {
  /** Finished and in-progress strokes of the current slide */
  strokes: Stroke[];
  /** Laser pointer position, or null when hidden */
  pointer: StrokePoint | null;
  /** Logical slide width the stroke widths refer to */
  width: number;
  /** Logical slide height */
  height: number;
}

/**
 * Live annotations painted over the slide: freehand strokes and laser pointer.
 * Never intercepts pointer events, so slide content stays interactive.
 * @param strokes - Strokes to paint
 * @param pointer - Laser position
 * @param width - Logical slide width
 * @param height - Logical slide height
 * @returns Overlay element
 */
export function AnnotationLayer({ strokes, pointer, width, height }: Props): React.ReactNode {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5000]">
      <StrokesSvg strokes={strokes} width={width} height={height} />
      {pointer && (
        <span
          style={{ left: `${pointer[0] * 100}%`, top: `${pointer[1] * 100}%` }}
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_14px_6px_rgb(239_68_68/0.65)] ring-2 ring-white/80 transition-[left,top] duration-75 ease-linear"
        />
      )}
    </div>
  );
}
