import { FiCornerUpLeft, FiTrash2 } from "react-icons/fi";
import { LuHighlighter, LuPen, LuPointer } from "react-icons/lu";

import type { DrawingTool } from "@/components/DrawingSurface";

/** Ink colors offered by the toolbar. */
export const INK_COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#18181b", "#ffffff"];

/** Stroke widths offered by the toolbar, in logical slide pixels. */
const INK_WIDTHS = [3, 6, 12];

const TOOL_OPTIONS: Array<{ tool: DrawingTool; label: string; Icon: React.ComponentType<{ size?: number }> }> = [
  { tool: "pen", label: "Bolígrafo", Icon: LuPen },
  { tool: "highlighter", label: "Marcador", Icon: LuHighlighter },
  { tool: "laser", label: "Puntero láser", Icon: LuPointer },
];

interface Props {
  /** Active tool */
  tool: DrawingTool;
  /** Active ink color */
  color: string;
  /** Active ink width */
  strokeWidth: number;
  /** Tools to offer; the laser only makes sense during a live presentation */
  tools?: DrawingTool[];
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  /** Remove the last stroke */
  onUndo: () => void;
  /** Remove every stroke */
  onClear: () => void;
  /** Whether there are strokes to undo or clear */
  hasStrokes: boolean;
  /** Extra actions rendered at the end, e.g. finish/cancel */
  children?: React.ReactNode;
}

/**
 * Tool, color and width picker for freehand drawing.
 * @param tool - Active tool
 * @param color - Active color
 * @param strokeWidth - Active width
 * @param tools - Tools to offer
 * @param onToolChange - Tool change handler
 * @param onColorChange - Color change handler
 * @param onWidthChange - Width change handler
 * @param onUndo - Undo handler
 * @param onClear - Clear handler
 * @param hasStrokes - Whether undo/clear are available
 * @param children - Extra actions
 * @returns Toolbar element
 */
export function DrawingToolbar({ tool, color, strokeWidth, tools = ["pen", "highlighter"], onToolChange, onColorChange, onWidthChange, onUndo, onClear, hasStrokes, children }: Props): React.ReactNode {
  const chip = "inline-flex h-9 min-w-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const idle = "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700";
  const active = "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1" role="group" aria-label="Herramienta">
        {TOOL_OPTIONS.filter((option) => tools.includes(option.tool)).map(({ tool: value, label, Icon }) => (
          <button key={value} type="button" aria-label={label} title={label} aria-pressed={tool === value} onClick={() => onToolChange(value)} className={`${chip} ${tool === value ? active : idle}`}>
            <Icon size={16} />
          </button>
        ))}
      </div>
      {tool !== "laser" && (
        <>
          <div className="flex gap-1" role="group" aria-label="Color">
            {INK_COLORS.map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`Color ${value}`}
                aria-pressed={color === value}
                onClick={() => onColorChange(value)}
                style={{ background: value }}
                className={`h-7 w-7 cursor-pointer rounded-full border border-zinc-300 dark:border-zinc-600 transition-transform ${color === value ? "scale-110 ring-2 ring-zinc-900 ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-zinc-900" : ""}`}
              />
            ))}
          </div>
          <div className="flex gap-1" role="group" aria-label="Grosor">
            {INK_WIDTHS.map((value) => (
              <button key={value} type="button" aria-label={`Grosor ${value}`} aria-pressed={strokeWidth === value} onClick={() => onWidthChange(value)} className={`${chip} ${strokeWidth === value ? active : idle}`}>
                <span className="rounded-full bg-current" style={{ width: value + 3, height: value + 3 }} />
              </button>
            ))}
          </div>
        </>
      )}
      <div className="flex gap-1">
        <button type="button" aria-label="Deshacer trazo" title="Deshacer trazo" onClick={onUndo} disabled={!hasStrokes} className={`${chip} ${idle}`}>
          <FiCornerUpLeft size={15} />
        </button>
        <button type="button" aria-label="Borrar todo" title="Borrar todo" onClick={onClear} disabled={!hasStrokes} className={`${chip} ${idle}`}>
          <FiTrash2 size={15} />
        </button>
      </div>
      {children}
    </div>
  );
}
