import { Navigate } from "react-router-dom";

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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
