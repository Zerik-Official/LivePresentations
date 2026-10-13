import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { FiArrowDown } from "react-icons/fi";

/** Distance from the bottom, in pixels, still considered "at the live edge". */
const LIVE_EDGE_THRESHOLD = 48;

interface MessageScrollerProps {
  /** Messages, oldest first */
  children: ReactNode;
  /** Shown instead of the list when there are no messages */
  empty?: ReactNode;
  /** Whether there are messages to show */
  hasMessages: boolean;
  /** Extra classes for the outer container */
  className?: string;
}

/**
 * Scroll container for a streaming conversation.
 * It follows the live edge while new content arrives, stops following as soon
 * as the reader scrolls up, and offers a button to jump back to the latest.
 * @param children - Message elements
 * @param empty - Empty state
 * @param hasMessages - Whether to render the list or the empty state
 * @param className - Extra classes
 * @returns Scroll container
 */
export function MessageScroller({ children, empty, hasMessages, className = "" }: MessageScrollerProps): React.ReactNode {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const following = useRef(true);
  const [atLiveEdge, setAtLiveEdge] = useState(true);

  /**
   * Scroll to the newest message.
   * @param behavior - Scroll animation
   */
  const scrollToLatest = useCallback((behavior: ScrollBehavior = "auto"): void => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    following.current = true;
    setAtLiveEdge(true);
    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const observer = new ResizeObserver(() => {
      if (following.current) scrollToLatest();
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [scrollToLatest, hasMessages]);

  /**
   * Track whether the reader is at the live edge.
   */
  function handleScroll(): void {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const distance = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    following.current = distance <= LIVE_EDGE_THRESHOLD;
    setAtLiveEdge(following.current);
  }

  return (
    <div className={`relative min-h-0 flex-1 ${className}`}>
      <div ref={viewportRef} onScroll={handleScroll} role="log" aria-live="polite" className="h-full overflow-y-auto overscroll-contain px-4 py-4">
        {hasMessages ? (
          <div ref={contentRef} className="flex flex-col gap-4">
            {children}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">{empty}</div>
        )}
      </div>
      {hasMessages && !atLiveEdge && (
        <button
          type="button"
          onClick={() => scrollToLatest("smooth")}
          aria-label="Ir al último mensaje"
          className="absolute bottom-3 left-1/2 flex h-8 w-8 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 shadow-md hover:bg-zinc-50 dark:hover:bg-zinc-700 animate-[popIn_0.18s_ease_both]"
        >
          <FiArrowDown size={14} />
        </button>
      )}
    </div>
  );
}
