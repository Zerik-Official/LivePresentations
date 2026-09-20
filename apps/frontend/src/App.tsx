import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { Spinner } from "@/components/ui/Spinner";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { EditorPage } from "@/features/editor/EditorPage";
import { ControllerPage } from "@/features/player/ControllerPage";
import { PresenterPage } from "@/features/player/PresenterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { useAuthStore } from "@/stores/authStore";

/**
 * Root application with routing and auth hydration.
 */
export default function App(): React.ReactNode {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-950">
        <Spinner className="size-6 text-zinc-900 dark:text-white" />
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Cargando aplicación...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor/:id"
            element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/present/:code"
            element={
              <ProtectedRoute>
                <PresenterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/control/:code"
            element={
              <ProtectedRoute>
                <ControllerPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}
