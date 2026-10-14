import { useCallback, useState } from "react";

/**
 * One-of-several preference remembered in local storage.
 * @param key - Storage key
 * @param options - Allowed values
 * @param defaultValue - Value used until the user picks one
 * @returns Current value and a function to change it
 */
export function useStoredChoice<T extends string>(key: string, options: readonly T[], defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null && (options as readonly string[]).includes(stored) ? (stored as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const update = useCallback(
    (next: T): void => {
      setValue(next);
      try {
        localStorage.setItem(key, next);
      } catch {
        // The preference still applies for this visit without storage.
      }
    },
    [key],
  );

  return [value, update];
}
