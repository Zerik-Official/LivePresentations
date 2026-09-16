import { FaCode, FaFont, FaIcons, FaImage, FaShapes, FaVideo } from "react-icons/fa";

import type { SlideElement } from "../../../types/presentation";

interface Props {
  onAdd: (type: SlideElement["type"]) => void;
  disabled: boolean;
}

/**
 * Toolbar to add elements.
 * @param onAdd - Handler for new element
 */
export function Toolbar({ onAdd, disabled }: Props): React.ReactNode {
  const btn = "inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-xs hover:bg-zinc-50 disabled:opacity-40";
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => onAdd("text")} disabled={disabled} className={btn}>
        <FaFont /> Texto
      </button>
      <button type="button" onClick={() => onAdd("image")} disabled={disabled} className={btn}>
        <FaImage /> Imagen
      </button>
      <button type="button" onClick={() => onAdd("icon")} disabled={disabled} className={btn}>
        <FaIcons /> Icono
      </button>
      <button type="button" onClick={() => onAdd("shape")} disabled={disabled} className={btn}>
        <FaShapes /> Forma
      </button>
      <button type="button" onClick={() => onAdd("code")} disabled={disabled} className={btn}>
        <FaCode /> Código
      </button>
      <button type="button" onClick={() => onAdd("video")} disabled={disabled} className={btn}>
        <FaVideo /> Video
      </button>
    </div>
  );
}
