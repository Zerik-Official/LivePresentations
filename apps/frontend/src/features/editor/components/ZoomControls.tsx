import { FiMaximize, FiMinus, FiPlus } from "react-icons/fi";

import { TooltipSimple } from "@/components/ui/Tooltip";

/** Canvas zoom: a fixed factor, or "fit" to follow the available space. */
export type ZoomMode = number | "fit";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

interface Props {
  /** Selected zoom mode */
  mode: ZoomMode;
  /** Factor currently applied to the canvas */
  scale: number;
  onChange: (mode: ZoomMode) => void;
}

/**
 * Floating zoom controls for the editor canvas.
 * @param mode - Selected zoom mode
 * @param scale - Applied factor
 * @param onChange - Zoom change handler
 * @returns Zoom controls
 */
export function ZoomControls({ mode, scale, onChange }: Props): React.ReactNode {
  /**
   * Step the zoom from the applied factor.
   * @param direction - 1 to zoom in, -1 to zoom out
   */
  function step(direction: 1 | -1): void {
    const next = Math.round((scale + direction * ZOOM_STEP) * 10) / 10;
    onChange(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next)));
  }

  const button = "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div data-tour="zoom" className="absolute bottom-4 left-4 z-30 flex items-center gap-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 shadow-sm">
      <TooltipSimple content="Alejar" side="top">
        <button type="button" aria-label="Alejar" className={button} disabled={scale <= MIN_ZOOM} onClick={() => step(-1)}>
          <FiMinus size={13} />
        </button>
      </TooltipSimple>
      <span className="w-11 text-center text-xs font-medium tabular-nums text-zinc-700 dark:text-zinc-200">{Math.round(scale * 100)}%</span>
      <TooltipSimple content="Acercar" side="top">
        <button type="button" aria-label="Acercar" className={button} disabled={scale >= MAX_ZOOM} onClick={() => step(1)}>
          <FiPlus size={13} />
        </button>
      </TooltipSimple>
      <TooltipSimple content="Ajustar a la ventana" side="top">
        <button type="button" aria-label="Ajustar a la ventana" aria-pressed={mode === "fit"} className={`${button} ${mode === "fit" ? "bg-zinc-100 dark:bg-zinc-800" : ""}`} onClick={() => onChange("fit")}>
          <FiMaximize size={13} />
        </button>
      </TooltipSimple>
    </div>
  );
}
