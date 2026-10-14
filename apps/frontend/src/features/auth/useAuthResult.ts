import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "@/stores/authStore";
import type { AuthResult } from "@/types/backend";
import { clearPendingVerification, savePendingVerification } from "./verification";

/**
 * Continue after an authentication step: enter the app when the session is
 * open, or go to the code screen when the email still has to be verified.
 * @returns Function that applies an authentication result
 */
export function useAuthResult(): (result: AuthResult) => void {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  return useCallback(
    (result: AuthResult): void => {
      if (result.status === "authenticated" && result.user) {
        clearPendingVerification();
        setUser(result.user);
        navigate("/dashboard");
      } else if (savePendingVerification(result)) {
        navigate("/verify-email");
      }
    },
    [navigate, setUser],
  );
}
