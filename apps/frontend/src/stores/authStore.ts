import { create } from "zustand";

import { apiClient, authApi } from "@/lib/api";
import type { User } from "@/types/backend";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

/**
 * Authenticated user state. The session itself lives in HttpOnly cookies, so
 * nothing sensitive is kept in JavaScript or in browser storage.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  /** Update user in store. */
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  /** Close the session on the server and clear the local state. */
  logout: async () => {
    await authApi.logout().catch(() => null);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  /**
   * Hydrate auth state on app start from the session cookies.
   */
  hydrate: async () => {
    // Tokens were kept in localStorage by earlier versions; make sure none linger.
    localStorage.removeItem("access_token");
    try {
      const user = await authApi.fetchMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

apiClient.setSessionExpiredHandler(() => useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false }));
