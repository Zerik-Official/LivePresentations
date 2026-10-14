import { useState } from "react";
import { FiCrop, FiX } from "react-icons/fi";

import { heightForCrop, readCrop } from "@/components/CroppedMedia";
import type { SlideElement } from "@/types/presentation";
import { CropModal, type CropSource } from "./CropModal";

interface Props {
  element: SlideElement;
  onPatch: (patch: Partial<SlideElement> & { propsPatch?: Record<string, unknown> }) => void;
  /** Media to crop, or null while the element has no source */
  source: CropSource | null;
}

/**
 * Crop section of the image and video property editors.
 * @param element - Image or video element
 * @param onPatch - Patch handler
 * @param source - Media to crop
 * @returns Crop controls
 */
export function MediaCropControls({ element, onPatch, source }: Props): React.ReactNode {
  const [open, setOpen] = useState(false);
  const crop = readCrop(element.props.crop);
  const button = "inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <button type="button" disabled={!source} onClick={() => setOpen(true)} className={button}>
          <FiCrop size={13} /> {crop ? "Cambiar recorte" : "Recortar o enfocar"}
        </button>
        {crop && (
          <button type="button" onClick={() => onPatch({ propsPatch: { crop: null } })} className={`${button} flex-none`} aria-label="Quitar recorte" title="Quitar recorte">
            <FiX size={13} />
          </button>
        )}
      </div>
      {crop && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Mostrando {Math.round(crop.w * 100)}% × {Math.round(crop.h * 100)}% del original.
        </p>
      )}
      {source && (
        <CropModal
          open={open}
          onClose={() => setOpen(false)}
          source={source}
          initial={element.props.crop}
          elementAspect={element.w / Math.max(1, element.h)}
          onApply={(next, sourceAspect, fitHeight) => {
            if (next && fitHeight) onPatch({ h: heightForCrop(element.w, next, sourceAspect), propsPatch: { crop: next } });
            else onPatch({ propsPatch: { crop: next } });
          }}
        />
      )}
    </div>
  );
}
