import { FaCode, FaFont, FaIcons, FaImage, FaShapes, FaVideo } from "react-icons/fa";

import { TooltipSimple } from "@/components/ui/Tooltip";
import type { SlideElement } from "@/types/presentation";

interface Props {
  onAdd: (type: SlideElement["type"]) => void;
  disabled: boolean;
}

/**
 * Toolbar to add elements.
 * @param onAdd - Handler for new element
 */
export function Toolbar({ onAdd, disabled }: Props): React.ReactNode {
  const btn = "inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40";
  return (
    <div className="flex flex-wrap gap-2">
      <TooltipSimple content="Añadir texto" side="top">
        <button type="button" onClick={() => onAdd("text")} disabled={disabled} className={btn}>
          <FaFont /> Texto
        </button>
      </TooltipSimple>
      <TooltipSimple content="Añadir imagen (URL)" side="top">
        <button type="button" onClick={() => onAdd("image")} disabled={disabled} className={btn}>
          <FaImage /> Imagen
        </button>
      </TooltipSimple>
      <TooltipSimple content="Añadir icono (FontAwesome)" side="top">
        <button type="button" onClick={() => onAdd("icon")} disabled={disabled} className={btn}>
          <FaIcons /> Icono
        </button>
      </TooltipSimple>
      <TooltipSimple content="Añadir forma" side="top">
        <button type="button" onClick={() => onAdd("shape")} disabled={disabled} className={btn}>
          <FaShapes /> Forma
        </button>
      </TooltipSimple>
      <TooltipSimple content="Añadir bloque de código" side="top">
        <button type="button" onClick={() => onAdd("code")} disabled={disabled} className={btn}>
          <FaCode /> Código
        </button>
      </TooltipSimple>
      <TooltipSimple content="Añadir video (URL)" side="top">
        <button type="button" onClick={() => onAdd("video")} disabled={disabled} className={btn}>
          <FaVideo /> Video
        </button>
      </TooltipSimple>
    </div>
  );
}
