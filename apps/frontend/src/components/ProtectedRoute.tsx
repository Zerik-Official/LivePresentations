import { Navigate } from "react-router-dom";

import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/stores/authStore";

interface Props {
  children: React.ReactNode;
}

/**
 * Guard that redirects to login if user is not authenticated.
 * @param children - Protected content
 */
export function ProtectedRoute({ children }: Props): React.ReactNode {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-950">
        <Spinner className="size-6 text-zinc-900 dark:text-white" />
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Verificando sesión...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
