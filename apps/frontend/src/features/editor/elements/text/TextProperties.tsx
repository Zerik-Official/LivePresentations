import { useState } from "react";
import { FiAlignCenter, FiAlignJustify, FiAlignLeft, FiAlignRight, FiBold, FiItalic, FiType, FiUnderline } from "react-icons/fi";

import type { SlideElement, TextElementProps } from "../../../../types/presentation";
import { FONT_OPTIONS } from "./constants";
import { FontPickerModal } from "./FontPickerModal";

interface Props {
  /** Selected element (must be type text) */
  element: SlideElement;
  /** Patch handler */
  onPatch: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
}

/**
 * Properties editor for text elements with alignment, font and style controls.
 * @param element - Text element
 * @param onPatch - Patch handler
 */
export function TextProperties({ element, onPatch }: Props): React.ReactNode {
  const props = element.props as Partial<TextElementProps>;
  const [fontOpen, setFontOpen] = useState(false);

  const align = (props.align ?? "left") as TextElementProps["align"];
  const fontFamily = props.fontFamily ?? "Inter";
  const selectedFont = FONT_OPTIONS.find((f) => f.value === fontFamily);

  /**
   * Toggle alignment.
   * @param next - Alignment value
   */
  function setAlign(next: TextElementProps["align"]): void {
    onPatch({ propsPatch: { align: next } });
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Texto
        <textarea
          value={props.text ?? ""}
          onChange={(e) => onPatch({ propsPatch: { text: e.target.value } })}
          rows={3}
          placeholder="Escribe tu texto..."
          className="mt-1 w-full resize-none rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setFontOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
        >
          <FiType /> <span className="truncate" style={{ fontFamily: `"${fontFamily}", sans-serif` }}>{selectedFont?.label ?? fontFamily}</span>
        </button>
        <label className="flex flex-col text-xs font-medium text-zinc-700 dark:text-zinc-300">
          <span>Tamaño</span>
          <input type="number" value={props.fontSize ?? 32} onChange={(e) => onPatch({ propsPatch: { fontSize: Number(e.target.value) } })} className="mt-1 w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-2 py-2 text-sm outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
        </label>
      </div>

      <FontPickerModal open={fontOpen} onClose={() => setFontOpen(false)} value={fontFamily} onSelect={(f) => onPatch({ propsPatch: { fontFamily: f } })} />

      <div className="space-y-1.5">
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Alineación</span>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setAlign("left")} aria-label="Alinear izquierda" className={`flex h-8 flex-1 items-center justify-center rounded-lg border text-sm ${align === "left" ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}>
            <FiAlignLeft />
          </button>
          <button type="button" onClick={() => setAlign("center")} aria-label="Centrar" className={`flex h-8 flex-1 items-center justify-center rounded-lg border text-sm ${align === "center" ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}>
            <FiAlignCenter />
          </button>
          <button type="button" onClick={() => setAlign("right")} aria-label="Alinear derecha" className={`flex h-8 flex-1 items-center justify-center rounded-lg border text-sm ${align === "right" ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}>
            <FiAlignRight />
          </button>
          <button type="button" onClick={() => setAlign("justify")} aria-label="Justificar" className={`flex h-8 flex-1 items-center justify-center rounded-lg border text-sm ${align === "justify" ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}>
            <FiAlignJustify />
          </button>
        </div>
      </div>

      <div className="flex gap-1.5">
        <button type="button" onClick={() => onPatch({ propsPatch: { bold: !props.bold } })} className={`flex h-8 flex-1 items-center justify-center rounded-lg border text-xs font-bold ${props.bold ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}>
          <FiBold /> Negrita
        </button>
        <button type="button" onClick={() => onPatch({ propsPatch: { italic: !props.italic } })} className={`flex h-8 flex-1 items-center justify-center rounded-lg border text-xs italic ${props.italic ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}>
          <FiItalic /> Cursiva
        </button>
        <button type="button" onClick={() => onPatch({ propsPatch: { underline: !props.underline } })} className={`flex h-8 flex-1 items-center justify-center rounded-lg border text-xs underline ${props.underline ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}>
          <FiUnderline /> Subrayar
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Color
          <input type="color" value={props.color ?? "#18181b"} onChange={(e) => onPatch({ propsPatch: { color: e.target.value } })} className="h-8 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Interlineado
          <input type="number" step={0.1} min={0.8} max={3} value={props.lineHeight ?? 1.2} onChange={(e) => onPatch({ propsPatch: { lineHeight: Number(e.target.value) } })} className="rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-2 py-1.5 text-xs outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Espaciado
          <input type="number" step={0.5} value={props.letterSpacing ?? 0} onChange={(e) => onPatch({ propsPatch: { letterSpacing: Number(e.target.value) } })} className="rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-2 py-1.5 text-xs outline-none focus:border-zinc-900 dark:focus:border-zinc-400" />
        </label>
      </div>

      <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Opacidad
        <input type="range" min={0} max={1} step={0.05} value={props.opacity ?? 1} onChange={(e) => onPatch({ propsPatch: { opacity: Number(e.target.value) } })} className="flex-1 accent-zinc-900 dark:accent-white" />
        <span className="w-8 text-right text-zinc-500 dark:text-zinc-400">{Math.round((props.opacity ?? 1) * 100)}%</span>
      </label>
    </div>
  );
}