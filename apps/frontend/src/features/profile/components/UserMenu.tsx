import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiLogOut, FiSettings, FiUser } from "react-icons/fi";

import { resolveFileUrl } from "@/lib/api";
import type { User } from "@/types/backend";
import { getAvatarInitial } from "@/features/profile/utils";

interface UserMenuProps {
  user: User | null;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

/**
 * Floating user menu anchored to the header avatar button.
 * @param user - Authenticated user
 * @param onOpenProfile - Open profile callback
 * @param onOpenSettings - Open settings callback
 * @param onLogout - Logout callback
 * @returns Floating menu element
 */
export function UserMenu({ user, onOpenProfile, onOpenSettings, onLogout }: UserMenuProps): React.ReactNode {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const avatarSrc = resolveFileUrl(user?.avatar_url);

  useEffect(() => {
    if (!open) return;
    /**
     * Close the menu on outside pointer down.
     * @param event - Pointer event
     */
    function handlePointerDown(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    /**
     * Close the menu on escape key.
     * @param event - Keyboard event
     */
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open ]);

  /**
   * Run a menu action and close the menu.
   * @param action - Action callback
   */
  function handleAction(action: () => void): void {
    setOpen(false);
    action();
  }

  const itemClass =
    "flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Abrir menú de usuario"
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white p-1.5 pr-2 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
      >
        {avatarSrc ? (
          <img src={avatarSrc} alt="Foto de perfil" className="size-7 rounded-md object-cover" />
        ) : (
          <span className="flex size-7 items-center justify-center rounded-md bg-zinc-900 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
            {getAvatarInitial(user?.email ?? "?", user?.display_name)}
          </span>
        )}
        <FiChevronDown size={14} className={`text-zinc-500 transition-transform dark:text-zinc-400 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-700">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{user?.display_name || user?.email}</p>
            {user?.display_name && <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>}
          </div>
          <button type="button" role="menuitem" className={itemClass} onClick={() => handleAction(onOpenProfile)}>
            <FiUser size={15} className="shrink-0 text-zinc-500 dark:text-zinc-400" />
            Perfil
          </button>
          <button type="button" role="menuitem" className={itemClass} onClick={() => handleAction(onOpenSettings)}>
            <FiSettings size={15} className="shrink-0 text-zinc-500 dark:text-zinc-400" />
            Configuración
          </button>
          <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            onClick={() => handleAction(onLogout)}
          >
            <FiLogOut size={15} className="shrink-0" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
