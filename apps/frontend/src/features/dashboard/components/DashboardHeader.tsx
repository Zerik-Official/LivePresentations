import { useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { AiSettingsModal } from "@/features/profile/components/AiSettingsModal";
import { ProfileModal } from "@/features/profile/components/ProfileModal";
import { SettingsModal } from "@/features/profile/components/SettingsModal";
import { UserMenu } from "@/features/profile/components/UserMenu";
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
 * @returns Dashboard header element
 */
export function DashboardHeader({ user, onLogout }: Props): React.ReactNode {
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">LivePresentations</h1>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-zinc-600 sm:block dark:text-zinc-400">{user?.display_name || user?.email}</span>
          <ThemeToggle />
          <UserMenu
            user={user}
            onOpenProfile={() => setProfileOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenAi={() => setAiOpen(true)}
            onLogout={onLogout}
          />
        </div>
      </header>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AiSettingsModal open={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  );
}
