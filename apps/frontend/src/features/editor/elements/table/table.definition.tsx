import { FiMinus, FiPlus } from "react-icons/fi";

import { Checkbox } from "@/components/ui/Checkbox";
import type { SlideElement } from "@/types/presentation";
import type { ElementDefinition, ElementPropertiesProps, ElementRenderContext } from "../registry/types";
import { ColorField, NumberField } from "../shared/fields";

const MAX_ROWS = 12;
const MAX_COLUMNS = 8;

/**
 * Props stored on a table element.
 */
export interface TableProps {
  /** Cell texts by row; every row has the same length */
  rows?: string[][];
  /** Style the first row as a header */
  headerRow?: boolean;
  fontSize?: number;
  textColor?: string;
  headerBackground?: string;
  headerTextColor?: string;
  cellBackground?: string;
  borderColor?: string;
}

const DEFAULT_ROWS: string[][] = [
  ["Columna 1", "Columna 2", "Columna 3"],
  ["Dato", "Dato", "Dato"],
  ["Dato", "Dato", "Dato"],
];

/**
 * Read the rows of a table, tolerating malformed data.
 * @param element - Table element
 * @returns Rectangular matrix of cell texts
 */
function readRows(element: SlideElement): string[][] {
  const raw = (element.props as TableProps).rows;
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_ROWS;
  const columns = Math.max(1, ...raw.map((row) => (Array.isArray(row) ? row.length : 0)));
  return raw.map((row) => Array.from({ length: columns }, (_, i) => String((Array.isArray(row) ? row[i] : "") ?? "")));
}

/**
 * Render a table filling the element box.
 * @param element - Table element
 * @param scale - Font scale factor
 * @returns React node
 */
function renderTable(element: SlideElement, scale = 1): React.ReactNode {
  const p = element.props as TableProps;
  const rows = readRows(element);
  const border = `1px solid ${p.borderColor ?? "#d4d4d8"}`;
  return (
    <table style={{ fontSize: (p.fontSize ?? 18) * scale, color: p.textColor ?? "#18181b", borderCollapse: "collapse", tableLayout: "fixed" }} className="h-full w-full">
      <tbody>
        {rows.map((row, r) => {
          const isHeader = (p.headerRow ?? true) && r === 0;
          return (
            <tr key={r}>
              {row.map((cell, c) => (
                <td
                  key={c}
                  style={{
                    border,
                    padding: `${4 * scale}px ${10 * scale}px`,
                    background: isHeader ? (p.headerBackground ?? "#18181b") : (p.cellBackground ?? "#ffffff"),
                    color: isHeader ? (p.headerTextColor ?? "#ffffff") : undefined,
                    fontWeight: isHeader ? 600 : 400,
                  }}
                  className="overflow-hidden text-ellipsis"
                >
                  {cell}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/**
 * Properties for table elements: grid size, cell contents and colors.
 * @param element - Table element
 * @param onPatch - Patch handler
 * @returns Property editor
 */
function TableProperties({ element, onPatch }: ElementPropertiesProps): React.ReactNode {
  const p = element.props as TableProps;
  const rows = readRows(element);
  const columns = rows[0]?.length ?? 1;

  /**
   * Store a new cell matrix.
   * @param next - Rows to store
   */
  function setRows(next: string[][]): void {
    onPatch({ propsPatch: { rows: next } });
  }

  /**
   * Resize the grid, keeping existing cell texts.
   * @param nextRows - Target row count
   * @param nextColumns - Target column count
   */
  function resize(nextRows: number, nextColumns: number): void {
    const rowCount = Math.min(MAX_ROWS, Math.max(1, nextRows));
    const columnCount = Math.min(MAX_COLUMNS, Math.max(1, nextColumns));
    setRows(Array.from({ length: rowCount }, (_, r) => Array.from({ length: columnCount }, (_, c) => rows[r]?.[c] ?? "")));
  }

  const stepper = "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        <div className="flex items-center justify-between gap-1">
          <span>Filas · {rows.length}</span>
          <span className="flex gap-1">
            <button type="button" aria-label="Quitar fila" className={stepper} onClick={() => resize(rows.length - 1, columns)}>
              <FiMinus size={12} />
            </button>
            <button type="button" aria-label="Añadir fila" className={stepper} onClick={() => resize(rows.length + 1, columns)}>
              <FiPlus size={12} />
            </button>
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span>Columnas · {columns}</span>
          <span className="flex gap-1">
            <button type="button" aria-label="Quitar columna" className={stepper} onClick={() => resize(rows.length, columns - 1)}>
              <FiMinus size={12} />
            </button>
            <button type="button" aria-label="Añadir columna" className={stepper} onClick={() => resize(rows.length, columns + 1)}>
              <FiPlus size={12} />
            </button>
          </span>
        </div>
      </div>

      <div className="max-h-48 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-700 p-1">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(4.5rem, 1fr))` }}>
          {rows.map((row, r) =>
            row.map((cell, c) => (
              <input
                key={`${r}-${c}`}
                value={cell}
                aria-label={`Fila ${r + 1}, columna ${c + 1}`}
                onChange={(e) => setRows(rows.map((current, ri) => (ri === r ? current.map((value, ci) => (ci === c ? e.target.value : value)) : current)))}
                className="min-w-0 rounded-md border bg-(--input-bg) border-(--input-border) text-(--input-text) px-2 py-1 text-xs outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
              />
            )),
          )}
        </div>
      </div>

      <Checkbox checked={p.headerRow ?? true} onChange={(v) => onPatch({ propsPatch: { headerRow: v } })} label="Primera fila como cabecera" />

      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Tamaño de texto" value={p.fontSize ?? 18} min={8} max={72} onChange={(v) => onPatch({ propsPatch: { fontSize: v } })} />
        <ColorField label="Texto" value={p.textColor ?? "#18181b"} onChange={(v) => onPatch({ propsPatch: { textColor: v } })} />
        <ColorField label="Fondo cabecera" value={p.headerBackground ?? "#18181b"} onChange={(v) => onPatch({ propsPatch: { headerBackground: v } })} />
        <ColorField label="Texto cabecera" value={p.headerTextColor ?? "#ffffff"} onChange={(v) => onPatch({ propsPatch: { headerTextColor: v } })} />
        <ColorField label="Fondo celdas" value={p.cellBackground ?? "#ffffff"} onChange={(v) => onPatch({ propsPatch: { cellBackground: v } })} />
        <ColorField label="Bordes" value={p.borderColor ?? "#d4d4d8"} onChange={(v) => onPatch({ propsPatch: { borderColor: v } })} />
      </div>
    </div>
  );
}

/**
 * Definition for table elements.
 */
export const tableDefinition: ElementDefinition = {
  type: "table",
  label: "Tabla",

  /**
   * Create a default 3x3 table with a header row.
   * @param id - Element id
   * @returns SlideElement
   */
  createDefault(id: string): SlideElement {
    return {
      id,
      type: "table",
      x: 80,
      y: 80,
      w: 560,
      h: 180,
      rotation: 0,
      zIndex: 1,
      highlightable: true,
      parentId: null,
      props: { rows: DEFAULT_ROWS, headerRow: true, fontSize: 18, textColor: "#18181b", headerBackground: "#18181b", headerTextColor: "#ffffff", cellBackground: "#ffffff", borderColor: "#d4d4d8" } satisfies TableProps,
    };
  },

  /**
   * Render for editor canvas.
   * @param element - Element instance
   * @returns React node
   */
  renderEditor(element: SlideElement): React.ReactNode {
    return renderTable(element);
  },

  /**
   * Render for player, scaling the text in fullscreen.
   * @param element - Element instance
   * @param ctx - Render context
   * @returns React node
   */
  renderPlayer(element: SlideElement, ctx: ElementRenderContext): React.ReactNode {
    return renderTable(element, ctx.fullscreen && ctx.scale ? ctx.scale : 1);
  },

  /**
   * Render for thumbnail.
   * @param element - Element instance
   * @returns React node
   */
  renderThumbnail(element: SlideElement): React.ReactNode {
    return renderTable(element);
  },

  /**
   * Resolve property editor component.
   * @returns Component type
   */
  getPropertiesComponent(): React.ComponentType<ElementPropertiesProps> {
    return TableProperties;
  },
};
