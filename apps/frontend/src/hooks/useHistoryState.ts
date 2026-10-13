import { useCallback, useRef, useState } from "react";

const MAX_ENTRIES = 100;

/**
 * State container with undo/redo history.
 */
export interface HistoryState<T> {
  /** Current value, or null before the first `reset` */
  value: T | null;
  /** Always-current value, readable between renders */
  valueRef: React.RefObject<T | null>;
  /** Store a new value as an undoable change */
  set: (next: T) => void;
  /** Replace the value and forget the history, e.g. after loading */
  reset: (next: T) => void;
  /** Step back to the previous value */
  undo: () => void;
  /** Reapply the last undone value */
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Keep a value together with its undo/redo history.
 * Changes arriving in quick succession (a drag, a slider, typing) collapse
 * into a single history entry so one undo reverts the whole gesture.
 * @param coalesceMs - Window in which consecutive changes merge
 * @returns Value, setters and history controls
 */
export function useHistoryState<T>(coalesceMs = 250): HistoryState<T> {
  const [value, setValue] = useState<T | null>(null);
  const [sizes, setSizes] = useState({ past: 0, future: 0 });
  const valueRef = useRef<T | null>(null);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const lastChange = useRef(0);

  /**
   * Publish the current value and stack sizes to React.
   * @param next - Value to expose
   */
  const publish = useCallback((next: T): void => {
    valueRef.current = next;
    setValue(next);
    setSizes({ past: past.current.length, future: future.current.length });
  }, []);

  const set = useCallback(
    (next: T): void => {
      const previous = valueRef.current;
      const now = Date.now();
      if (previous !== null && now - lastChange.current > coalesceMs) {
        past.current.push(previous);
        if (past.current.length > MAX_ENTRIES) past.current.shift();
      }
      lastChange.current = now;
      future.current = [];
      publish(next);
    },
    [coalesceMs, publish],
  );

  const reset = useCallback(
    (next: T): void => {
      past.current = [];
      future.current = [];
      lastChange.current = 0;
      publish(next);
    },
    [publish],
  );

  const undo = useCallback((): void => {
    const previous = past.current.pop();
    if (previous === undefined || valueRef.current === null) return;
    future.current.push(valueRef.current);
    lastChange.current = 0;
    publish(previous);
  }, [publish]);

  const redo = useCallback((): void => {
    const next = future.current.pop();
    if (next === undefined || valueRef.current === null) return;
    past.current.push(valueRef.current);
    lastChange.current = 0;
    publish(next);
  }, [publish]);

  return { value, valueRef, set, reset, undo, redo, canUndo: sizes.past > 0, canRedo: sizes.future > 0 };
}
