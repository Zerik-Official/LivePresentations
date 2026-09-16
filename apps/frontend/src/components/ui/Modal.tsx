import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  className?: string;
  children: ReactNode;
  closeOnBackdropClick?: boolean;
}

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: ReactNode;
}

/**
 * Portal modal shell.
 * @param open - Visibility
 * @param onClose - Close handler
 * @param className - Card classes
 * @param children - Modal content
 */
export function Modal({ open, onClose, className = "w-full max-w-lg max-h-[88vh]", children, closeOnBackdropClick = true }: ModalProps): React.ReactNode {
  useEffect(() => {
    if (!open) return;
    /**
     * Handle escape key.
     * @param event - Keyboard event
     */
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 p-4 animate-[fadeIn_0.18s_ease_both]" onClick={closeOnBackdropClick ? onClose : undefined}>
      <div className={`flex flex-col overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl animate-[popIn_0.22s_cubic-bezier(0.34,1.56,0.64,1)_both] ${className}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Modal header with title and close button.
 * @param title - Title
 * @param subtitle - Subtitle
 * @param onClose - Close handler
 */
export function ModalHeader({ title, subtitle, onClose }: ModalHeaderProps): React.ReactNode {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
      <div className="flex flex-col">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        {subtitle ? <span className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</span> : null}
      </div>
      <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-700" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

/**
 * Scrollable modal body.
 * @param children - Body content
 */
export function ModalBody({ children, className = "" }: ModalBodyProps): React.ReactNode {
  return <div className={`flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5 ${className}`}>{children}</div>;
}

/**
 * Footer with actions aligned right.
 * @param children - Footer actions
 */
export function ModalFooter({ children }: ModalFooterProps): React.ReactNode {
  return <div className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-700 px-6 py-4">{children}</div>;
}
