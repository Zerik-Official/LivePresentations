import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as FaIcons from "react-icons/fa";

import { CodeBlock } from "@/components/CodeBlock";
import { buildYouTubeEmbedUrl, isYouTubeUrl, parseYouTubeId } from "@/features/editor/elements/video/youtube";
import type { Slide, SlideElement } from "@/types/presentation";
import { CodeExpandedOverlay } from "./elements/code/CodeExpandedOverlay";

interface Props {
  slide: Slide | null;
  highlightedId: string | null;
  width: number;
  height: number;
  animTriggerId?: string | null;
  codeExpandedId?: string | null;
  codeHighlightedLines?: number[];
  codeScrollTop?: number;
  onCollapseCode?: () => void;
  fullscreen?: boolean;
  showControls?: boolean;
}

/**
 * Render a single element according to its type.
 * @param element - Slide element
 * @param highlighted - Whether element is highlighted
 * @param isTriggered - Whether animation was triggered
 */
function ElementView({
  element,
  highlighted,
  isTriggered,
  width,
  height,
  fullscreen,
  scale,
}: {
  element: SlideElement;
  highlighted: boolean;
  isTriggered: boolean;
  width: number;
  height: number;
  fullscreen?: boolean;
  scale?: number;
}): React.ReactNode {
  const style: React.CSSProperties = fullscreen
    ? {
        left: `${(element.x / width) * 100}%`,
        top: `${(element.y / height) * 100}%`,
        width: `${(element.w / width) * 100}%`,
        height: `${(element.h / height) * 100}%`,
        transform: `rotate(${element.rotation}deg)`,
        transformOrigin: "center",
        zIndex: element.zIndex,
      }
    : {
        left: element.x,
        top: element.y,
        width: element.w,
        height: element.h,
        transform: `rotate(${element.rotation}deg)`,
        zIndex: element.zIndex,
      };

  const highlightClass = highlighted ? "ring-4 ring-amber-400 ring-offset-2 shadow-xl scale-[1.02]" : "";
  const anim = element.animation;

  const variants = {
    hidden: {
      opacity: 0,
      y: anim?.type === "slideIn" ? 24 : 0,
      scale: anim?.type === "scaleIn" ? 0.92 : 1,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
  };

  const content = (() => {
    switch (element.type) {
      case "text": {
        const p = element.props as {
          text?: string;
          fontSize?: number;
          color?: string;
          align?: string;
          bold?: boolean;
          italic?: boolean;
          underline?: boolean;
          fontFamily?: string;
          lineHeight?: number;
          letterSpacing?: number;
          opacity?: number;
          backgroundEnabled?: boolean;
          backgroundColor?: string;
          backgroundRadius?: number;
          backgroundPadding?: number;
        };
        const hasBg = Boolean(p.backgroundEnabled);
        const baseFont = p.fontSize ?? 32;
        const scaledFont = fullscreen && scale ? baseFont * scale : baseFont;
        return (
          <div
            style={{
              fontSize: scaledFont,
              color: p.color ?? "#18181b",
              textAlign: (p.align as React.CSSProperties["textAlign"]) ?? "left",
              fontWeight: p.bold ? 700 : 400,
              fontStyle: p.italic ? "italic" : "normal",
              textDecoration: p.underline ? "underline" : "none",
              fontFamily: p.fontFamily ? `"${p.fontFamily}", sans-serif` : undefined,
              lineHeight: p.lineHeight ?? 1.2,
              letterSpacing: p.letterSpacing ? `${p.letterSpacing}px` : undefined,
              opacity: p.opacity ?? 1,
              backgroundColor: hasBg ? (p.backgroundColor ?? "#ffffff") : "transparent",
              borderRadius: hasBg ? (p.backgroundRadius ?? 8) : undefined,
              padding: hasBg ? (p.backgroundPadding ?? 8) * (fullscreen && scale ? scale : 1) : 8,
            }}
            className="h-full w-full overflow-hidden"
          >
            {p.text ?? ""}
          </div>
        );
      }
      case "image": {
        const p = element.props as { src?: string; alt?: string };
        return <img src={p.src ?? ""} alt={p.alt ?? ""} className="h-full w-full object-cover rounded-md" draggable={false} />;
      }
      case "shape": {
        const p = element.props as { variant?: string; fill?: string; radius?: number; borderColor?: string; borderWidth?: number };
        const variant = p.variant ?? "rect";
        const shapeStyle: React.CSSProperties = {
          background: p.fill ?? "#e4e4e7",
          border: p.borderWidth ? `${p.borderWidth}px solid ${p.borderColor ?? "#18181b"}` : undefined,
        };
        if (variant === "circle") shapeStyle.borderRadius = "50%";
        else if (variant === "pill") shapeStyle.borderRadius = 9999;
        else if (variant === "triangle") shapeStyle.clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)";
        else if (variant === "diamond") shapeStyle.clipPath = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
        else if (variant === "hexagon") shapeStyle.clipPath = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
        else shapeStyle.borderRadius = p.radius ?? 12;
        return <div style={shapeStyle} className="h-full w-full" />;
      }
      case "icon": {
        const p = element.props as { name?: string; color?: string; size?: number; bg?: string; bgColor?: string; rounded?: number };
        const IconComp = (FaIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[p.name ?? "FaStar"] ?? FaIcons.FaStar;
        const bg = p.bg ?? "transparent";
        const showBg = bg !== "transparent";
        const iconSize = fullscreen && scale ? Math.round((p.size ?? 48) * scale) : (p.size ?? 48);
        return (
          <div
            style={{ background: showBg ? (p.bgColor ?? "#ffffff") : "transparent", borderRadius: (p.rounded ?? 12) * (fullscreen && scale ? scale : 1) }}
            className="flex h-full w-full items-center justify-center"
          >
            <IconComp size={iconSize} color={p.color ?? "#18181b"} />
          </div>
        );
      }
      case "video": {
        const p = element.props as { src?: string; poster?: string; autoplay?: boolean; loop?: boolean; muted?: boolean; controls?: boolean };
        const showControls = p.controls ?? true;
        if (!p.src) return <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-xs text-white">Sin video</div>;
        if (isYouTubeUrl(p.src)) {
          const id = parseYouTubeId(p.src);
          if (!id) return <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-xs text-white">YouTube inválido</div>;
          const embed = buildYouTubeEmbedUrl(id, Boolean(p.autoplay), showControls);
          return (
            <iframe
              src={embed}
              title="YouTube video"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full rounded-md bg-black"
            />
          );
        }
        return <video src={p.src} poster={p.poster} autoPlay={p.autoplay} loop={p.loop} muted={p.muted ?? true} controls={showControls} playsInline className="h-full w-full rounded-md bg-black" />;
      }
      case "code": {
        const p = element.props as { code?: string; language?: string; lineNumbers?: boolean };
        return <CodeBlock code={p.code} language={p.language} lineNumbers={p.lineNumbers ?? false} className="text-xs" showBadge={false} />;
      }
      case "specials": {
        const p = element.props as { text?: string; icon?: string; iconColor?: string; iconBgColor?: string; backgroundColor?: string; textColor?: string };
        const IconComp = (FaIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[p.icon ?? "FaStar"] ?? FaIcons.FaStar;
        const iconSize = fullscreen && scale ? Math.round(22 * scale) : 22;
        return (
          <div
            style={{ backgroundColor: p.backgroundColor ?? "#fffbeb", borderColor: "#fcd34d" }}
            className="flex h-full w-full items-center justify-between gap-3 rounded-md border px-3"
          >
            <span className="truncate font-medium" style={{ fontSize: fullscreen && scale ? `${14 * scale}px` : "14px", color: p.textColor ?? "#18181b" }}>
              {p.text ?? "Respuesta especial"}
            </span>
            <span style={{ backgroundColor: p.iconBgColor ?? "#ffffff" }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700">
              <IconComp size={iconSize} color={p.iconColor ?? "#f59e0b"} />
            </span>
          </div>
        );
      }
      default:
        return null;
    }
  })();

  return (
    <motion.div
      key={isTriggered ? `${element.id}-triggered` : element.id}
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ delay: (anim?.delayMs ?? 0) / 1000, duration: (anim?.durationMs ?? 300) / 1000, ease: "easeOut" }}
      style={style}
      className={`absolute overflow-hidden rounded-md transition-shadow duration-300 ${highlightClass}`}
    >
      {content}
    </motion.div>
  );
}

/**
 * Render a slide with absolute positioned elements.
 * @param slide - Slide to render
 * @param highlightedId - Currently highlighted element id
 * @param animTriggerId - Element id whose animation was triggered
 * @param codeExpandedId - Expanded code element id
 * @param codeHighlightedLines - Highlighted lines for expanded code
 * @param codeScrollTop - Scroll top for expanded code
 * @param onCollapseCode - Collapse handler
 */
export function SlideRenderer({
  slide,
  highlightedId,
  width,
  height,
  animTriggerId,
  codeExpandedId,
  codeHighlightedLines,
  codeScrollTop,
  onCollapseCode,
  fullscreen = false,
  showControls = true,
}: Props): React.ReactNode {
  if (!slide) {
    return (
      <div style={{ width, height }} className="flex items-center justify-center rounded-xl border border-dashed bg-white text-sm text-zinc-500">
        Sin diapositiva
      </div>
    );
  }

  const t = slide.transition ?? "fade";
  const slideVariants =
    t === "slide"
      ? { initial: { opacity: 0, x: 80 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -80 } }
      : t === "zoom"
        ? { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.06 } }
        : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

  const expandedElement = codeExpandedId ? (slide.elements.find((e) => e.id === codeExpandedId) ?? null) : null;
  const isCodeExpanded = Boolean(expandedElement && expandedElement.type === "code");

  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!fullscreen) return;
    /**
     * Compute scale factor for auto-recalculated content (fonts, icons) when canvas fills viewport.
     * Uses average of width/height ratios to scale content proportionally.
     */
    function updateScale(): void {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const sx = vw / width;
      const sy = vh / height;
      const next = (sx + sy) / 2;
      setScale(Math.min(Math.max(next, 0.7), 3));
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [width, height, fullscreen]);

  const containerClass = fullscreen
    ? "relative overflow-hidden border-0 bg-white shadow-none"
    : "relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm";
  const containerStyle: React.CSSProperties = fullscreen
    ? { width: "100vw", height: "100vh", background: slide.background }
    : { width, height, background: slide.background };

  const slideNode = (
    <AnimatePresence mode="wait">
      <motion.div
        key={slide.id}
        initial={slideVariants.initial}
        animate={slideVariants.animate}
        exit={slideVariants.exit}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={containerStyle}
        className={containerClass}
      >
        {slide.elements
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((el) => (
            <ElementView
              key={el.id}
              element={el}
              highlighted={highlightedId === el.id}
              isTriggered={animTriggerId === el.id}
              width={width}
              height={height}
              fullscreen={fullscreen}
              scale={scale}
            />
          ))}
        {isCodeExpanded && (
          <CodeExpandedOverlay element={expandedElement} expanded={isCodeExpanded} highlightedLines={codeHighlightedLines ?? []} scrollTop={codeScrollTop ?? 0} onCollapse={showControls ? onCollapseCode : undefined} />
        )}
      </motion.div>
    </AnimatePresence>
  );

  return slideNode;
}