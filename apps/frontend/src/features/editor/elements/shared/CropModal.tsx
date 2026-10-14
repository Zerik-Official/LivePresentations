import { useEffect, useRef, useState } from "react";

import { MIN_CROP_SIZE, readCrop } from "@/components/CroppedMedia";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import type { MediaCrop } from "@/types/presentation";

const FULL: MediaCrop = { x: 0, y: 0, w: 1, h: 1 };
const STAGE_WIDTH = 560;
const STAGE_HEIGHT = 340;

const PRESETS: Array<{ label: string; crop: MediaCrop }> = [
  { label: "Completa", crop: FULL },
  { label: "Mitad izquierda", crop: { x: 0, y: 0, w: 0.5, h: 1 } },
  { label: "Mitad derecha", crop: { x: 0.5, y: 0, w: 0.5, h: 1 } },
  { label: "Mitad superior", crop: { x: 0, y: 0, w: 1, h: 0.5 } },
  { label: "Mitad inferior", crop: { x: 0, y: 0.5, w: 1, h: 0.5 } },
  { label: "Centro", crop: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 } },
];

/** Media to crop: a still image or a frame of the video. */
export interface CropSource {
  kind: "image" | "video";
  /** URL of the image, the video file, or a still of an embedded video */
  url: string;
  /** Known aspect when the media cannot be measured, e.g. 16/9 for YouTube */
  aspect?: number;
}

type Handle = "move" | "nw" | "ne" | "sw" | "se";

interface Props {
  open: boolean;
  onClose: () => void;
  source: CropSource;
  /** Crop currently stored on the element */
  initial: unknown;
  /** Width divided by height of the element box, for the "keep" ratio */
  elementAspect: number;
  /** Apply the crop; `fitHeight` asks to resize the element to match it */
  onApply: (crop: MediaCrop | null, sourceAspect: number, fitHeight: boolean) => void;
}

/**
 * Clamp a value between bounds.
 * @param value - Value
 * @param min - Lower bound
 * @param max - Upper bound
 * @returns Clamped value
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Crop editor: drag the frame to choose the visible part of an image or video,
 * resize it from its corners, or pick a preset such as the right half.
 * @param open - Visibility
 * @param onClose - Close handler
 * @param source - Media to crop
 * @param initial - Stored crop
 * @param elementAspect - Element ratio
 * @param onApply - Apply handler
 * @returns Crop modal
 */
export function CropModal({ open, onClose, source, initial, elementAspect, onApply }: Props): React.ReactNode {
  const [crop, setCrop] = useState<MediaCrop>(FULL);
  const [aspect, setAspect] = useState<number | null>(source.aspect ?? null);
  const [ratio, setRatio] = useState("free");
  const [fitHeight, setFitHeight] = useState(true);
  const drag = useRef<{ handle: Handle; startX: number; startY: number; start: MediaCrop } | null>(null);

  useEffect(() => {
    if (!open) return;
    setCrop(readCrop(initial) ?? FULL);
    setRatio("free");
  }, [open, initial]);

  const sourceAspect = aspect ?? source.aspect ?? 16 / 9;
  const stageScale = Math.min(STAGE_WIDTH / sourceAspect, STAGE_HEIGHT);
  const stage = { width: stageScale * sourceAspect, height: stageScale };

  /**
   * Target width/height ratio of the crop in source pixels, or null when free.
   * @param choice - Ratio option
   * @returns Ratio or null
   */
  function lockedRatio(choice: string): number | null {
    if (choice === "element") return elementAspect;
    if (choice === "free") return null;
    const [w, h] = choice.split(":").map(Number);
    return w! / h!;
  }

  /**
   * Make the crop respect the locked ratio, shrinking it to fit the source.
   * @param next - Proposed crop
   * @param anchorRight - Keep the right edge fixed instead of the left
   * @param anchorBottom - Keep the bottom edge fixed instead of the top
   * @param choice - Ratio option, the selected one by default
   * @returns Adjusted crop
   */
  function applyRatio(next: MediaCrop, anchorRight = false, anchorBottom = false, choice = ratio): MediaCrop {
    const target = lockedRatio(choice);
    if (!target) return next;
    // In fractions: (w * aspect) / h = target.
    let { w, h } = next;
    h = (w * sourceAspect) / target;
    if (h > 1) {
      h = 1;
      w = (h * target) / sourceAspect;
    }
    const x = anchorRight ? next.x + next.w - w : next.x;
    const y = anchorBottom ? next.y + next.h - h : next.y;
    return { x: clamp(x, 0, 1 - w), y: clamp(y, 0, 1 - h), w, h };
  }

  /**
   * Start moving or resizing the frame.
   * @param handle - Part being dragged
   * @param e - Pointer event
   */
  function startDrag(handle: Handle, e: React.PointerEvent): void {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { handle, startX: e.clientX, startY: e.clientY, start: crop };
  }

  /**
   * Update the frame while dragging.
   * @param e - Pointer event
   */
  function onDrag(e: React.PointerEvent): void {
    const state = drag.current;
    if (!state) return;
    const dx = (e.clientX - state.startX) / stage.width;
    const dy = (e.clientY - state.startY) / stage.height;
    const s = state.start;
    if (state.handle === "move") {
      setCrop({ ...s, x: clamp(s.x + dx, 0, 1 - s.w), y: clamp(s.y + dy, 0, 1 - s.h) });
      return;
    }
    const west = state.handle.includes("w");
    const north = state.handle.includes("n");
    const left = west ? clamp(s.x + dx, 0, s.x + s.w - MIN_CROP_SIZE) : s.x;
    const right = west ? s.x + s.w : clamp(s.x + s.w + dx, s.x + MIN_CROP_SIZE, 1);
    const top = north ? clamp(s.y + dy, 0, s.y + s.h - MIN_CROP_SIZE) : s.y;
    const bottom = north ? s.y + s.h : clamp(s.y + s.h + dy, s.y + MIN_CROP_SIZE, 1);
    setCrop(applyRatio({ x: left, y: top, w: right - left, h: bottom - top }, west, north));
  }

  const handleClass = "absolute h-3.5 w-3.5 rounded-sm border-2 border-white bg-zinc-900 shadow";
  const box = { left: crop.x * stage.width, top: crop.y * stage.height, width: crop.w * stage.width, height: crop.h * stage.height };
  const media =
    source.kind === "video" ? (
      <video src={source.url} muted playsInline preload="metadata" onLoadedMetadata={(e) => e.currentTarget.videoWidth && setAspect(e.currentTarget.videoWidth / e.currentTarget.videoHeight)} className="h-full w-full object-fill" />
    ) : (
      <img src={source.url} alt="" draggable={false} onLoad={(e) => !source.aspect && e.currentTarget.naturalWidth && setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} className="h-full w-full object-fill" />
    );

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-2xl max-h-[92vh]">
      <ModalHeader title="Recortar o enfocar" subtitle="Elige qué parte se muestra en el elemento" onClose={onClose} />
      <ModalBody>
        <div className="flex justify-center rounded-xl bg-zinc-100 dark:bg-zinc-950 p-3">
          <div style={{ width: stage.width, height: stage.height }} className="relative touch-none select-none" onPointerMove={onDrag} onPointerUp={() => (drag.current = null)}>
            {media}
            <div className="pointer-events-none absolute inset-0 bg-black/55" style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${box.left}px ${box.top}px, ${box.left}px ${box.top + box.height}px, ${box.left + box.width}px ${box.top + box.height}px, ${box.left + box.width}px ${box.top}px, ${box.left}px ${box.top}px)` }} />
            <div style={box} onPointerDown={(e) => startDrag("move", e)} className="absolute cursor-move border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]" aria-label="Zona visible">
              <span onPointerDown={(e) => startDrag("nw", e)} className={`${handleClass} -left-2 -top-2 cursor-nwse-resize`} />
              <span onPointerDown={(e) => startDrag("ne", e)} className={`${handleClass} -right-2 -top-2 cursor-nesw-resize`} />
              <span onPointerDown={(e) => startDrag("sw", e)} className={`${handleClass} -bottom-2 -left-2 cursor-nesw-resize`} />
              <span onPointerDown={(e) => startDrag("se", e)} className={`${handleClass} -bottom-2 -right-2 cursor-nwse-resize`} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setCrop(applyRatio(preset.crop))}
              className="cursor-pointer rounded-lg border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Proporción
            <Select
              value={ratio}
              options={[
                { value: "free", label: "Libre" },
                { value: "element", label: "La del elemento" },
                { value: "16:9", label: "16:9" },
                { value: "4:3", label: "4:3" },
                { value: "1:1", label: "Cuadrada" },
              ]}
              onChange={(value) => {
                setRatio(value);
                setCrop((current) => applyRatio(current, false, false, value));
              }}
            />
          </label>
          <p className="self-end text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            Visible: {Math.round(crop.w * 100)}% × {Math.round(crop.h * 100)}% desde ({Math.round(crop.x * 100)}%, {Math.round(crop.y * 100)}%)
          </p>
        </div>

        <Checkbox checked={fitHeight} onChange={setFitHeight} label="Ajustar la altura del elemento al recorte" description="Evita que la imagen se deforme manteniendo el ancho actual" />
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            onApply(readCrop(crop), sourceAspect, fitHeight);
            onClose();
          }}
        >
          Aplicar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
