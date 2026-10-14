import { create } from "zustand";

import { aiApi } from "@/lib/api";
import type { AiCredential } from "@/types/backend";

interface AiState {
  /** Stored credentials of the current user, without their keys */
  credentials: AiCredential[];
  /** Whether the credentials were fetched at least once */
  loaded: boolean;
  /** Fetch the credentials from the server */
  load: () => Promise<void>;
  /** Replace the credentials after a change made in the settings */
  setCredentials: (credentials: AiCredential[]) => void;
  /** Forget everything, e.g. on logout */
  reset: () => void;
}

/**
 * AI assistant configuration shared by the profile settings and the editor,
 * so the chat appears as soon as a key is saved.
 */
export const useAiStore = create<AiState>((set) => ({
  credentials: [],
  loaded: false,

  load: async () => {
    try {
      set({ credentials: await aiApi.listCredentials(), loaded: true });
    } catch {
      set({ credentials: [], loaded: true });
    }
  },

  setCredentials: (credentials) => set({ credentials, loaded: true }),

  reset: () => set({ credentials: [], loaded: false }),
}));

/**
 * Select the credential the assistant currently uses.
 * @param state - Store state
 * @returns Active credential or null when none is configured
 */
export function selectActiveCredential(state: AiState): AiCredential | null {
  return state.credentials.find((credential) => credential.is_active) ?? null;
}
