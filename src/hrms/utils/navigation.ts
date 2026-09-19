import { useAuth } from "@/contexts/AuthContext";

/**
 * Get the base dashboard path based on user role
 */
export const getDashboardPath = (role: string): string => {
  switch (role) {
    case "superadmin":
      return "/superadmin";
    case "leadmentor":
      return "/leadmentor";
    case "schooladmin":
      return "/admin";
    case "mentor":
    case "employee":
      return "/mentor";
    case "student":
      return "/student";
    default:
      return "/";
  }
};

/**
 * Hook to get the current user's dashboard path
 */
export const useDashboardPath = (): string => {
  const { user } = useAuth();
  return getDashboardPath(user?.role || "");
};

/**
 * Get the students management path based on user role
 */
export const getStudentsPath = (role: string): string => {
  const basePath = getDashboardPath(role);
  return `${basePath}/students`;
};

/**
 * Hook to get the current user's students management path
 */
export const useStudentsPath = (): string => {
  const { user } = useAuth();
  return getStudentsPath(user?.role || "");
};
