import * as FaIcons from "react-icons/fa";

import type { Slide } from "@/types/presentation";

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
      <div
        style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}
        className="relative"
      >
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
            };
            if (el.type === "text") {
              const p = el.props as { text?: string; fontSize?: number; color?: string; align?: string; bold?: boolean; fontFamily?: string };
              return (
                <div
                  key={el.id}
                  style={{
                    ...baseStyle,
                    fontSize: (p.fontSize ?? 24) * 0.6,
                    color: p.color ?? "#18181b",
                    textAlign: (p.align as React.CSSProperties["textAlign"]) ?? "left",
                    fontWeight: p.bold ? 700 : 400,
                    fontFamily: p.fontFamily ? `"${p.fontFamily}", sans-serif` : undefined,
                    overflow: "hidden",
                    lineHeight: 1.2,
                  }}
                  className="p-1"
                >
                  {(p.text ?? "").slice(0, 40)}
                </div>
              );
            }
            if (el.type === "image") {
              const p = el.props as { src?: string };
              return <img key={el.id} src={p.src ?? ""} alt="" style={baseStyle} className="object-cover rounded-sm" draggable={false} />;
            }
            if (el.type === "shape") {
              const p = el.props as { fill?: string; radius?: number; variant?: string; borderColor?: string; borderWidth?: number };
              const isCircle = p.variant === "circle";
              return (
                <div
                  key={el.id}
                  style={{
                    ...baseStyle,
                    background: p.fill ?? "#e4e4e7",
                    borderRadius: isCircle ? "50%" : (p.radius ?? 8),
                    border: p.borderWidth ? `${p.borderWidth}px solid ${p.borderColor ?? "#18181b"}` : undefined,
                  }}
                />
              );
            }
            if (el.type === "icon") {
              const p = el.props as { name?: string; color?: string; size?: number };
              const IconComp = (FaIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[p.name ?? "FaStar"] ?? FaIcons.FaStar;
              return (
                <div key={el.id} style={baseStyle} className="flex items-center justify-center">
                  <IconComp size={Math.min(32, (p.size ?? 48) * 0.3)} color={p.color ?? "#18181b"} />
                </div>
              );
            }
            if (el.type === "code") {
              return (
                <div key={el.id} style={{ ...baseStyle, background: "#27272a", borderRadius: 4 }} className="flex flex-col justify-center gap-2 p-3">
                  <div className="h-3.5 w-[72%] rounded-full bg-violet-400" />
                  <div className="h-3.5 w-[90%] rounded-full bg-sky-400" />
                  <div className="h-3.5 w-[60%] rounded-full bg-emerald-400" />
                  <div className="h-3.5 w-[78%] rounded-full bg-zinc-500" />
                </div>
              );
            }
            if (el.type === "video") {
              return (
                <div key={el.id} style={{ ...baseStyle, background: "#0f0f0f", borderRadius: 6 }} className="flex items-center justify-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[10px] leading-none text-zinc-900">▶</div>
                </div>
              );
            }
            return null;
          })}
      </div>
    </div>
  );
}