import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { Slide, SlideElement } from "@/types/presentation";
import { elementRegistry } from "@/features/editor/elements/registry";
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
 * Render a single element according to its type via registry.
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

  const definition = elementRegistry.tryGet(element.type);
  const content = definition ? definition.renderPlayer(element, { width, height, fullscreen, scale, highlighted }) : null;

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
     * Compute scale factor for auto-recalculated content when canvas fills viewport.
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

  const containerClass = fullscreen ? "relative overflow-hidden border-0 bg-white shadow-none" : "relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm";
  const containerStyle: React.CSSProperties = fullscreen ? { width: "100vw", height: "100vh", background: slide.background } : { width, height, background: slide.background };

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
            <ElementView key={el.id} element={el} highlighted={highlightedId === el.id} isTriggered={animTriggerId === el.id} width={width} height={height} fullscreen={fullscreen} scale={scale} />
          ))}
        {isCodeExpanded && <CodeExpandedOverlay element={expandedElement} expanded={isCodeExpanded} highlightedLines={codeHighlightedLines ?? []} scrollTop={codeScrollTop ?? 0} onCollapse={showControls ? onCollapseCode : undefined} />}
      </motion.div>
    </AnimatePresence>
  );

  return slideNode;
}
