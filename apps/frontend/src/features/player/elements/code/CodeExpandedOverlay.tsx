import { motion, AnimatePresence } from "framer-motion";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";

import { CodeBlock } from "@/components/CodeBlock";
import type { SlideElement } from "@/types/presentation";

interface Props {
  /** Target code element when expanded */
  element: SlideElement | null;
  /** Whether overlay is expanded */
  expanded: boolean;
  /** Highlighted lines */
  highlightedLines: number[];
  /** Scroll top synchronized */
  scrollTop: number;
  /** Collapse handler (presenter local) */
  onCollapse?: () => void;
}

/**
 * Expanded code overlay for presenter view.
 * Renders centered card above slide, not fullscreen.
 * @param element - Code element
 * @param expanded - Expanded state
 * @param highlightedLines - Lines to highlight
 * @param scrollTop - Synced scroll
 */
export function CodeExpandedOverlay({ element, expanded, highlightedLines, scrollTop, onCollapse }: Props): React.ReactNode {
  if (!expanded || !element) return null;
  const props = element.props as { code?: string; language?: string; lineNumbers?: boolean };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px] sm:p-6"
      >
        <motion.div
          initial={{ scale: 0.96, y: 8, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.96, y: 8, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex h-[86%] max-h-160 w-[94%] max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-[#1e1e1e] shadow-2xl"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 bg-[#252526] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-zinc-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-300">{props.language ?? "code"}</span>
              <span className="text-xs font-medium text-zinc-200">Vista ampliada</span>
              {highlightedLines.length > 0 && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-300">{highlightedLines.length} líneas resaltadas</span>}
            </div>
            {onCollapse && (
              <button type="button" onClick={onCollapse} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                <FiMinimize2 size={14} />
              </button>
            )}
            {!onCollapse && <span className="flex h-7 w-7 items-center justify-center text-zinc-500"><FiMaximize2 size={14} /></span>}
          </div>
          <div className="min-h-0 flex-1">
            <CodeBlock code={props.code} language={props.language} lineNumbers={props.lineNumbers ?? true} showBadge={false} highlightedLines={highlightedLines} scrollTop={scrollTop} className="rounded-none border-0" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}