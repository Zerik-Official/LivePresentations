import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type TooltipSide = "top" | "right" | "bottom" | "left";
type TooltipAlign = "start" | "center" | "end";

interface TooltipProviderProps {
  children: ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
}

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentId: string;
  delayDuration: number;
}

interface TooltipProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}

interface TooltipTriggerProps extends HTMLAttributes<HTMLElement> {
  children: ReactElement;
  asChild?: boolean;
}

interface TooltipContentProps extends ComponentPropsWithoutRef<"div"> {
  side?: TooltipSide;
  sideOffset?: number;
  align?: TooltipAlign;
  alignOffset?: number;
  hideArrow?: boolean;
}

const TooltipProviderContext = createContext<{ delayDuration: number; skipDelayDuration: number }>({
  delayDuration: 200,
  skipDelayDuration: 300,
});

const TooltipContext = createContext<TooltipContextValue | null>(null);

/**
 * Retrieve tooltip context.
 * @returns Tooltip context value
 */
function useTooltipContext(): TooltipContextValue {
  const ctx = useContext(TooltipContext);
  if (!ctx) throw new Error("Tooltip must be used within <Tooltip>");
  return ctx;
}

/**
 * Provider for global tooltip delay settings.
 * @param children - Child nodes
 * @param delayDuration - Delay before showing
 * @param skipDelayDuration - Skip delay duration
 */
export function TooltipProvider({ children, delayDuration = 200, skipDelayDuration = 300 }: TooltipProviderProps): React.ReactNode {
  return <TooltipProviderContext.Provider value={{ delayDuration, skipDelayDuration }}>{children}</TooltipProviderContext.Provider>;
}

/**
 * Root tooltip that owns open state and trigger ref.
 * @param children - TooltipTrigger + TooltipContent
 * @param open - Controlled open
 * @param defaultOpen - Initial open
 * @param onOpenChange - Open change callback
 * @param delayDuration - Show delay
 */
export function Tooltip({ children, open, defaultOpen = false, onOpenChange, delayDuration }: TooltipProps): React.ReactNode {
  const provider = useContext(TooltipProviderContext);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open! : internalOpen;
  const contentId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const effectiveDelay = delayDuration ?? provider.delayDuration;

  /**
   * Update open state.
   * @param next - Next open value
   */
  function setOpen(next: boolean): void {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  return (
    <TooltipContext.Provider value={{ open: currentOpen, setOpen, triggerRef: triggerRef as React.RefObject<HTMLElement | null>, contentId, delayDuration: effectiveDelay }}>
      {children}
    </TooltipContext.Provider>
  );
}

/**
 * Element that triggers the tooltip on hover/focus.
 * @param children - Single element child
 */
export const TooltipTrigger = forwardRef<HTMLElement, TooltipTriggerProps>(({ children, asChild: _asChild, onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }, forwardedRef) => {
  const { open, setOpen, triggerRef, contentId, delayDuration } = useTooltipContext();
  const openTimeout = useRef<number | null>(null);
  const closeTimeout = useRef<number | null>(null);

  /**
   * Clear pending timers.
   */
  function clearTimers(): void {
    if (openTimeout.current) window.clearTimeout(openTimeout.current);
    if (closeTimeout.current) window.clearTimeout(closeTimeout.current);
  }

  /**
   * Schedule open.
   */
  function handleEnter(): void {
    clearTimers();
    openTimeout.current = window.setTimeout(() => setOpen(true), open ? 0 : delayDuration);
  }

  /**
   * Schedule close.
   */
  function handleLeave(): void {
    clearTimers();
    closeTimeout.current = window.setTimeout(() => setOpen(false), 80);
  }

  useEffect(() => () => clearTimers(), []);

  if (!isValidElement(children)) return null;
  const child = children as ReactElement<Record<string, unknown>>;

  return cloneElement(child as ReactElement<Record<string, unknown>>, {
    ref: (node: HTMLElement | null) => {
      (triggerRef as React.RefObject<HTMLElement | null>).current = node;
      const childRef = (child as unknown as { ref?: unknown }).ref;
      if (typeof childRef === "function") (childRef as unknown as (n: HTMLElement | null) => void)(node);
      else if (childRef && typeof childRef === "object" && childRef !== null && "current" in (childRef as object))
        (childRef as React.RefObject<HTMLElement | null>).current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef && typeof forwardedRef === "object" && forwardedRef !== null && "current" in forwardedRef)
        (forwardedRef as React.RefObject<HTMLElement | null>).current = node;
    },
    "aria-describedby": open ? contentId : undefined,
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      (child.props as { onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void }).onMouseEnter?.(e);
      onMouseEnter?.(e as unknown as React.MouseEvent<HTMLElement>);
      handleEnter();
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      (child.props as { onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void }).onMouseLeave?.(e);
      onMouseLeave?.(e as unknown as React.MouseEvent<HTMLElement>);
      handleLeave();
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      (child.props as { onFocus?: (e: React.FocusEvent<HTMLElement>) => void }).onFocus?.(e);
      onFocus?.(e as unknown as React.FocusEvent<HTMLElement>);
      handleEnter();
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      (child.props as { onBlur?: (e: React.FocusEvent<HTMLElement>) => void }).onBlur?.(e);
      onBlur?.(e as unknown as React.FocusEvent<HTMLElement>);
      handleLeave();
    },
    ...props,
  } as Record<string, unknown>);
});
TooltipTrigger.displayName = "TooltipTrigger";

/**
 * Floating tooltip content rendered in a portal.
 * @param children - Tooltip text
 * @param side - Preferred side
 * @param sideOffset - Gap from trigger
 * @param align - Alignment on the side axis
 */
export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ children, className, side = "top", sideOffset = 8, align = "center", alignOffset = 0, hideArrow = false, style, ...props }, forwardedRef) => {
    const { open, triggerRef, contentId } = useTooltipContext();
    const innerRef = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
      if (!open) return;
      /**
       * Update tooltip position.
       */
      function update(): void {
        const trigger = triggerRef.current;
        const content = innerRef.current;
        if (!trigger || !content) return;
        const t = trigger.getBoundingClientRect();
        const c = content.getBoundingClientRect();
        const gap = sideOffset;
        let top = 0;
        let left = 0;
        if (side === "top") top = t.top - c.height - gap;
        else if (side === "bottom") top = t.bottom + gap;
        else if (side === "left") left = t.left - c.width - gap;
        else if (side === "right") left = t.right + gap;

        if (side === "top" || side === "bottom") {
          if (align === "center") left = t.left + t.width / 2 - c.width / 2;
          else if (align === "start") left = t.left + alignOffset;
          else if (align === "end") left = t.right - c.width - alignOffset;
        } else {
          if (align === "center") top = t.top + t.height / 2 - c.height / 2;
          else if (align === "start") top = t.top + alignOffset;
          else if (align === "end") top = t.bottom - c.height - alignOffset;
        }

        if (side === "top" || side === "bottom") left = Math.max(8, Math.min(left, window.innerWidth - c.width - 8));
        else top = Math.max(8, Math.min(top, window.innerHeight - c.height - 8));

        setPos({ top, left });
      }
      update();
      window.addEventListener("scroll", update, true);
      window.addEventListener("resize", update);
      return () => {
        window.removeEventListener("scroll", update, true);
        window.removeEventListener("resize", update);
      };
    }, [open, side, sideOffset, align, alignOffset, triggerRef]);

    if (!mounted || !open) return null;

    const arrowSide: Record<TooltipSide, string> = {
      top: "bottom-[-4px]",
      bottom: "top-[-4px]",
      left: "right-[-4px]",
      right: "left-[-4px]",
    };
    const arrowAlign: Record<TooltipAlign, string> = {
      center: "left-1/2 -translate-x-1/2",
      start: "left-3",
      end: "right-3 left-auto translate-x-0",
    };
    const verticalAlign: Record<TooltipAlign, string> = {
      center: "top-1/2 -translate-y-1/2",
      start: "top-3",
      end: "bottom-3 top-auto translate-y-0",
    };
    const isVertical = side === "top" || side === "bottom";

    const node = (
      <div
        ref={(nodeEl) => {
          innerRef.current = nodeEl;
          if (typeof forwardedRef === "function") forwardedRef(nodeEl);
          else if (forwardedRef && typeof forwardedRef === "object" && forwardedRef !== null && "current" in forwardedRef)
            (forwardedRef as React.RefObject<HTMLDivElement | null>).current = nodeEl;
        }}
        id={contentId}
        role="tooltip"
        data-side={side}
        data-align={align}
        className={[
          "fixed z-9999 max-w-[320px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium leading-relaxed text-zinc-700 dark:text-zinc-200 shadow-lg",
          "animate-[fadeIn_0.15s_ease]",
          "pointer-events-none select-none",
          className ?? "",
        ].join(" ")}
        style={{ top: pos ? `${pos.top}px` : "-9999px", left: pos ? `${pos.left}px` : "-9999px", opacity: pos ? 1 : 0, ...style }}
        {...props}
      >
        {children}
        {!hideArrow ? (
          <div
            aria-hidden
            className={[
              "absolute h-2 w-2 rotate-45 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700",
              side === "top" ? "border-r border-b" : "",
              side === "bottom" ? "border-l border-t" : "",
              side === "left" ? "border-r border-t" : "",
              side === "right" ? "border-l border-b" : "",
              arrowSide[side],
              isVertical ? arrowAlign[align] : verticalAlign[align],
            ].join(" ")}
          />
        ) : null}
      </div>
    );

    return createPortal(node, document.body);
  },
);
TooltipContent.displayName = "TooltipContent";

/**
 * Simple wrapper combining Tooltip + Trigger + Content.
 * @param children - Trigger element
 * @param content - Tooltip text
 * @param side - Side
 * @param align - Align
 */
export function TooltipSimple({
  children,
  content,
  side = "top",
  align = "center",
  sideOffset = 8,
  delayDuration,
  hideArrow = false,
  contentClassName,
}: {
  children: ReactElement;
  content: React.ReactNode;
  side?: TooltipSide;
  align?: TooltipAlign;
  sideOffset?: number;
  delayDuration?: number;
  hideArrow?: boolean;
  contentClassName?: string;
}): React.ReactNode {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} sideOffset={sideOffset} hideArrow={hideArrow} className={contentClassName}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
