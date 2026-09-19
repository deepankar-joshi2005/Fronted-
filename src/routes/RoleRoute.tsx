import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { getRoleBasePath } from "../config/roles.js";

export default function RoleRoute({ roles }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to={getRoleBasePath(user?.role)} replace />;
  }

  return <Outlet />;
}
