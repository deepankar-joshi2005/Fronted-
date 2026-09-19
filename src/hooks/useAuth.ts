import { useAuthStore } from "../store/authStore.js";
import { getRoleBasePath } from "../config/roles.js";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const login = useAuthStore((s) => s.login);
  const registerFirm = useAuthStore((s) => s.registerFirm);
  const logout = useAuthStore((s) => s.logout);

  return {
    user,
    isAuthenticated,
    isInitializing,
    login,
    registerFirm,
    logout,
    basePath: getRoleBasePath(user?.role),
  };
}
