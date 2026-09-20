import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

/**
 * Resolve initial theme from storage or system preference.
 * @returns Theme
 */
function getInitialTheme(): Theme {
  try {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) return stored;
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {
    return "light";
  }
  return "light";
}

/**
 * Persist theme in localStorage and sync with document class.
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),

  /**
   * Set theme and apply to document.
   * @param theme - Theme value
   */
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ theme });
  },

  /** Toggle between light and dark. */
  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));

if (typeof document !== "undefined") {
  try {
    const initial = getInitialTheme();
    document.documentElement.classList.toggle("dark", initial === "dark");
  } catch {}
}
