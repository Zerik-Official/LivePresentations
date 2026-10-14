import type { MediaCrop } from "@/types/presentation";

/** Smallest crop side, as a fraction of the source. */
export const MIN_CROP_SIZE = 0.05;

/**
 * Read a crop from loosely typed props, ignoring invalid or full-frame values.
 * @param value - Value of the `crop` prop
 * @returns Usable crop, or null to show the whole source
 */
export function readCrop(value: unknown): MediaCrop | null {
  if (!value || typeof value !== "object") return null;
  const { x, y, w, h } = value as Record<string, unknown>;
  if (![x, y, w, h].every((n) => typeof n === "number" && Number.isFinite(n))) return null;
  const crop = { x: x as number, y: y as number, w: w as number, h: h as number };
  const inside = crop.x >= 0 && crop.y >= 0 && crop.w >= MIN_CROP_SIZE && crop.h >= MIN_CROP_SIZE && crop.x + crop.w <= 1.0001 && crop.y + crop.h <= 1.0001;
  const fullFrame = crop.x <= 0.0001 && crop.y <= 0.0001 && crop.w >= 0.9999 && crop.h >= 0.9999;
  return inside && !fullFrame ? crop : null;
}

/**
 * Height an element needs to show a crop without distortion.
 * @param width - Element width
 * @param crop - Crop to show
 * @param sourceAspect - Source width divided by height
 * @returns Matching element height, rounded
 */
export function heightForCrop(width: number, crop: MediaCrop, sourceAspect: number): number {
  return Math.max(16, Math.round((width * crop.h) / (crop.w * sourceAspect)));
}

interface Props {
  /** Part of the source to show, or null for all of it */
  crop: MediaCrop | null;
  /** Rounded corners of the frame */
  className?: string;
  /** Media stretched to fill its box, e.g. an img with object-fill */
  children: React.ReactNode;
}

/**
 * Frame that shows only a region of an image, video or embed.
 * The media is enlarged and shifted so the cropped region exactly covers the
 * frame, and everything else is clipped.
 * @param crop - Region to show
 * @param className - Extra classes for the frame
 * @param children - Media element filling its box
 * @returns Cropping frame
 */
export function CroppedMedia({ crop, className = "", children }: Props): React.ReactNode {
  if (!crop) return <div className={`h-full w-full overflow-hidden ${className}`}>{children}</div>;
  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <div
        style={{
          position: "absolute",
          width: `${100 / crop.w}%`,
          height: `${100 / crop.h}%`,
          left: `${(-crop.x / crop.w) * 100}%`,
          top: `${(-crop.y / crop.h) * 100}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
