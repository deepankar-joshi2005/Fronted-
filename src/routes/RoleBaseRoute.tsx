import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { getRoleBasePath } from "../config/roles.js";

// Keeps the URL's role segment (e.g. /super-admin, /firm-admin) in sync with
// the signed-in user's actual role. Visiting another role's base path
// redirects to your own, carrying over whatever sub-path followed it.
export default function RoleBaseRoute() {
  const { user } = useAuth();
  const { roleBase } = useParams();
  const location = useLocation();
  const expectedBase = getRoleBasePath(user?.role);

  if (`/${roleBase}` !== expectedBase) {
    const rest = location.pathname.split("/").slice(2).join("/");
    return <Navigate to={rest ? `${expectedBase}/${rest}` : expectedBase} replace />;
  }

  return <Outlet />;
}
