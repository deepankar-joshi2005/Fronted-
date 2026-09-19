import { useAuth } from "@/contexts/AuthContext";

export function useHasPermission() {
  const { user } = useAuth();

  const hasPermission = (permission: string | string[] | undefined): boolean => {
    if (!permission) return true;
    if (!user) return false;
    if (user.role === "superadmin") return true;

    const userPermissions = user.permissions || [];

    if (Array.isArray(permission)) {
      return permission.some((p) => userPermissions.includes(p));
    }
    return userPermissions.includes(permission);
  };

  return { hasPermission };
}


