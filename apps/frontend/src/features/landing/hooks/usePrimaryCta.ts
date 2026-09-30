import { useAuthStore } from "@/stores/authStore";

interface PrimaryCta {
  to: string;
  label: string;
  isAuthenticated: boolean;
}

export function usePrimaryCta(): PrimaryCta {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated
    ? { to: "/dashboard", label: "Ir al dashboard", isAuthenticated }
    : { to: "/register", label: "Crear cuenta gratis", isAuthenticated };
}
