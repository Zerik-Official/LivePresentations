import { useCallback, useState } from "react";

const STORAGE_KEY = "tutorials_completed";

/**
 * Read the completed tutorial ids from local storage.
 * @returns Completed ids, empty when storage is unavailable or corrupt
 */
function readCompleted(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Track which tutorials the user finished, persisted per browser.
 * @returns Completed ids and a function to mark one as completed
 */
export function useTutorialProgress(): { completed: string[]; markCompleted: (id: string) => void } {
  const [completed, setCompleted] = useState<string[]>(readCompleted);

  const markCompleted = useCallback((id: string): void => {
    setCompleted((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Progress is a convenience; the tour still works without storage.
      }
      return next;
    });
  }, []);

  return { completed, markCompleted };
}
