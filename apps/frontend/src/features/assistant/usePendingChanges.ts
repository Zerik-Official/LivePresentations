import { useCallback, useEffect, useMemo, useState } from "react";

import type { PresentationData } from "@/types/presentation";
import { isChangeLive, revertChange, type AiChange } from "./changes";
import type { EditorBridge } from "./tools";

const MAX_STORED_CHANGES = 200;

/**
 * Read the stored review list of a presentation.
 * @param key - Storage key
 * @returns Stored changes, empty when storage is unavailable or corrupt
 */
function readStored(key: string): AiChange[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? (parsed as AiChange[]).filter((change) => change && typeof change.id === "string" && typeof change.kind === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Review list of the assistant's edits.
 */
export interface PendingChanges {
  /** Changes that can still be accepted or discarded, oldest first */
  changes: AiChange[];
  /** Queue edits for review */
  add: (changes: AiChange[]) => void;
  /** Keep one change */
  accept: (id: string) => void;
  /** Undo one change on the document */
  reject: (id: string) => void;
  /** Keep every change */
  acceptAll: () => void;
  /** Undo every change, newest first */
  rejectAll: () => void;
}

/**
 * Track the assistant's edits until the user accepts or discards each one.
 * The edits are already applied to the document, so accepting only clears
 * the entry while discarding reverts that edit alone. The list is kept per
 * presentation in local storage, because autosave may store the document
 * before the review is finished.
 * @param presentationId - Presentation id, used as storage scope
 * @param data - Current document, to drop entries whose target is gone
 * @param bridge - Editor capabilities used to revert edits
 * @returns Review list and actions
 */
export function usePendingChanges(presentationId: string | undefined, data: PresentationData | null, bridge: React.RefObject<EditorBridge>): PendingChanges {
  const storageKey = `ai_changes_${presentationId ?? "none"}`;
  const [stored, setStored] = useState<AiChange[]>(() => readStored(storageKey));

  useEffect(() => {
    setStored(readStored(storageKey));
  }, [storageKey]);

  useEffect(() => {
    try {
      if (stored.length === 0) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, JSON.stringify(stored.slice(-MAX_STORED_CHANGES)));
    } catch {
      // The review list still works for this visit without storage.
    }
  }, [stored, storageKey]);

  const changes = useMemo(() => (data ? stored.filter((change) => isChangeLive(data, change)) : []), [stored, data]);

  const add = useCallback((incoming: AiChange[]): void => {
    if (incoming.length > 0) setStored((current) => [...current, ...incoming]);
  }, []);

  const accept = useCallback((id: string): void => {
    setStored((current) => current.filter((change) => change.id !== id));
  }, []);

  /**
   * Revert a list of changes on the live document, newest first.
   * @param targets - Changes to revert
   */
  const revert = useCallback(
    (targets: AiChange[]): void => {
      const editor = bridge.current;
      let next = editor.getData();
      if (!next) return;
      for (const change of [...targets].reverse()) {
        if (change.kind === "title") editor.setTitle(change.before);
        else if (isChangeLive(next, change)) next = revertChange(next, change);
      }
      if (next !== editor.getData()) editor.setData(next);
      if (editor.getActiveSlide() >= next.slides.length) editor.setActiveSlide(Math.max(0, next.slides.length - 1));
      const reverted = new Set(targets.map((change) => change.id));
      setStored((current) => current.filter((change) => !reverted.has(change.id)));
    },
    [bridge],
  );

  const reject = useCallback(
    (id: string): void => {
      const target = stored.find((change) => change.id === id);
      if (target) revert([target]);
    },
    [revert, stored],
  );

  const acceptAll = useCallback((): void => setStored([]), []);
  const rejectAll = useCallback((): void => revert(stored), [revert, stored]);

  return { changes, add, accept, reject, acceptAll, rejectAll };
}
