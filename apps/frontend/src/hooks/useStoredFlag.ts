import { useCallback, useState } from "react";

/**
 * Boolean preference remembered in local storage.
 * @param key - Storage key
 * @param defaultValue - Value used until the user changes it
 * @returns Current value and a function to change it
 */
export function useStoredFlag(key: string, defaultValue: boolean): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? defaultValue : stored === "true";
    } catch {
      return defaultValue;
    }
  });

  const update = useCallback(
    (next: boolean): void => {
      setValue(next);
      try {
        localStorage.setItem(key, String(next));
      } catch {
        // The preference still applies for this visit without storage.
      }
    },
    [key],
  );

  return [value, update];
}
