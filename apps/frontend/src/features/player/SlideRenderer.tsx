import { AnimatePresence, motion } from "framer-motion";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markup";
import "prismjs/themes/prism-tomorrow.css";
import * as FaIcons from "react-icons/fa";

import type { Slide, SlideElement } from "../../types/presentation";

interface Props {
  slide: Slide | null;
  highlightedId: string | null;
  width: number;
  height: number;
  animTriggerId?: string | null;
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
}: {
  element: SlideElement;
  highlighted: boolean;
  isTriggered: boolean;
}): React.ReactNode {
  const style: React.CSSProperties = {
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
        const p = element.props as { text?: string; fontSize?: number; color?: string; align?: string; bold?: boolean };
        return (
          <div
            style={{
              fontSize: p.fontSize ?? 32,
              color: p.color ?? "#18181b",
              textAlign: (p.align as React.CSSProperties["textAlign"]) ?? "left",
              fontWeight: p.bold ? 700 : 400,
            }}
            className="h-full w-full overflow-hidden p-2"
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
        const p = element.props as { variant?: string; fill?: string; radius?: number };
        return <div style={{ background: p.fill ?? "#e4e4e7", borderRadius: p.radius ?? 12 }} className="h-full w-full" />;
      }
      case "icon": {
        const p = element.props as { name?: string; color?: string; size?: number; bg?: string; bgColor?: string; rounded?: number };
        const IconComp = (FaIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[p.name ?? "FaStar"] ?? FaIcons.FaStar;
        const bg = p.bg ?? "transparent";
        const showBg = bg !== "transparent";
        return (
          <div
            style={{ background: showBg ? (p.bgColor ?? "#ffffff") : "transparent", borderRadius: p.rounded ?? 12 }}
            className="flex h-full w-full items-center justify-center"
          >
            <IconComp size={p.size ?? 48} color={p.color ?? "#18181b"} />
          </div>
        );
      }
      case "video": {
        const p = element.props as { src?: string };
        if (!p.src) return <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-xs text-white">Sin video</div>;
        return <video src={p.src} controls className="h-full w-full rounded-md bg-black" />;
      }
      case "code": {
        const p = element.props as { code?: string; language?: string };
        const raw = (p.language ?? "javascript").toLowerCase().trim();
        const alias: Record<string, string> = { js: "javascript", py: "python", ts: "typescript", sh: "bash", shell: "bash", html: "markup" };
        const lang = alias[raw] ?? raw;
        const grammar = (Prism.languages[lang] ?? Prism.languages.javascript) as Prism.Grammar;
        const html = Prism.highlight(p.code ?? "", grammar, lang);
        return (
          <pre className="h-full w-full overflow-auto rounded-md bg-[#2d2d2d] p-3 text-xs leading-relaxed">
            <code className={`language-${lang}`} dangerouslySetInnerHTML={{ __html: html }} />
          </pre>
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
 */
export function SlideRenderer({ slide, highlightedId, width, height, animTriggerId }: Props): React.ReactNode {
  if (!slide) {
    return (
      <div style={{ width, height }} className="flex items-center justify-center rounded-xl border border-dashed bg-white text-sm text-zinc-500">
        Sin diapositiva
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={slide.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{ width, height, background: slide.background }}
        className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
      >
        {slide.elements
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((el) => (
            <ElementView key={el.id} element={el} highlighted={highlightedId === el.id} isTriggered={animTriggerId === el.id} />
          ))}
      </motion.div>
    </AnimatePresence>
  );
}
