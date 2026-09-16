import { FiMoon, FiSun } from "react-icons/fi";

import { TooltipSimple } from "./ui/Tooltip";
import { useThemeStore } from "../stores/themeStore";

/**
 * Toggle button for light/dark theme.
 */
export function ThemeToggle(): React.ReactNode {
  const { theme, toggle } = useThemeStore();

  return (
    <TooltipSimple content={theme === "dark" ? "Cambiar a claro" : "Cambiar a oscuro"} side="bottom">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
        aria-label="Cambiar tema"
      >
        {theme === "dark" ? <FiSun /> : <FiMoon />}
      </button>
    </TooltipSimple>
  );
}