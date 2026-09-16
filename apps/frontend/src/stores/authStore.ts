import { create } from "zustand";

import { fetchMe, type AuthResponse, type User } from "../lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (data: AuthResponse) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("access_token"),
  isLoading: true,
  isAuthenticated: false,

  /**
   * Persist auth data after login/register.
   * @param data - Auth response with token and user
   */
  setAuth: (data) => {
    localStorage.setItem("access_token", data.access_token);
    set({ token: data.access_token, user: data.user, isAuthenticated: true, isLoading: false });
  },

  /** Update user in store. */
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  /** Clear auth state and storage. */
  logout: () => {
    localStorage.removeItem("access_token");
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  /**
   * Hydrate auth state on app start by validating stored token.
   */
  hydrate: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }
    try {
      const user = await fetchMe();
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem("access_token");
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
