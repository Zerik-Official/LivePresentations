import { useEffect, useRef, useState } from "react";

import type { Slide } from "@/types/presentation";
import { elementRegistry } from "@/features/editor/elements/registry";

interface Props {
  /** Slide to render in scaled preview */
  slide: Slide;
}

/**
 * Dashboard preview that fills the card without being split, using measured scale.
 * Shared between Dashboard and any slide thumbnail needing a lightweight renderer.
 * @param slide - Slide to render
 */
export function DashboardPreview({ slide }: Props): React.ReactNode {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.24);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const w = entry.contentRect.width;
      if (w > 0) setScale(w / 1280);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseWidth = 1280;
  const baseHeight = 720;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-white dark:bg-zinc-900" style={{ background: slide.background }}>
      <div style={{ width: baseWidth, height: baseHeight, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
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
