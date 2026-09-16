import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

/**
 * Persist theme in localStorage and sync with document class.
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: (localStorage.getItem("theme") as Theme | null) ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),

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

// Initialize on load
if (typeof document !== "undefined") {
  const stored = localStorage.getItem("theme") as Theme | null;
  const initial = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.classList.toggle("dark", initial === "dark");
}
