import { FiLogOut } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TooltipSimple } from "@/components/ui/Tooltip";
import type { User } from "@/types/backend";

interface Props {
  /** Current user */
  user: User | null;
  /** Logout handler */
  onLogout: () => void;
}

/**
 * Top header for dashboard with branding and user controls.
 * @param user - Authenticated user
 * @param onLogout - Logout callback
 */
export function DashboardHeader({ user, onLogout }: Props): React.ReactNode {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-4">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">LivePresentations</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{user?.email}</span>
        <ThemeToggle />
        <TooltipSimple content="Cerrar sesión" side="bottom">
          <Button variant="secondary" size="sm" onClick={onLogout} className="cursor-pointer">
            <FiLogOut />
            Cerrar sesión
          </Button>
        </TooltipSimple>
      </div>
    </header>
  );
}
