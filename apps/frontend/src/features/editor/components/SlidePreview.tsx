import type { Slide } from "@/types/presentation";
import { elementRegistry } from "@/features/editor/elements/registry";

/**
 * Miniature preview for a slide rendered at fixed aspect ratio.
 * Keeps compact height (~92px) matching previous card size, but with visual content.
 * @param slide - Slide to preview
 * @param width - Logical canvas width
 * @param height - Logical canvas height
 */
export function SlidePreview({ slide, width = 1280, height = 720 }: { slide: Slide; width?: number; height?: number }): React.ReactNode {
  const scale = 0.135;

  return (
    <div style={{ background: slide.background }} className="relative h-21 w-full overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700 bg-white">
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }} className="relative">
        {slide.elements
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((el) => {
            const baseStyle: React.CSSProperties = {
              left: el.x,
              top: el.y,
              width: el.w,
              height: el.h,
              position: "absolute",
              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
              transformOrigin: "center",
            };
            const def = elementRegistry.tryGet(el.type);
            if (!def) return null;
            return (
              <div key={el.id} style={baseStyle}>
                {def.renderThumbnail(el)}
              </div>
            );
          })}
      </div>
    </div>
  );
}
