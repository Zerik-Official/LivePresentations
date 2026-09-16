import { useEffect } from "react";

/**
 * Bind Delete/Backspace to trigger element deletion.
 * @param selectedId - Selected element id
 * @param onDelete - Delete handler
 */
export function useKeyboardDelete(selectedId: string | null, onDelete: () => void): void {
  useEffect(() => {
    /**
     * Handle Delete/Sup key for selected element.
     * @param e - Keyboard event
     */
    function handleKey(e: KeyboardEvent): void {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
        e.preventDefault();
        onDelete();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId, onDelete]);
}