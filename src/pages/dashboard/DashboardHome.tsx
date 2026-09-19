import { useAuth } from "../../hooks/useAuth.js";
import { ROLES } from "../../config/roles.js";
import SuperAdminDashboardPage from "../super-admin/DashboardPage.jsx";
import FirmDashboardPage from "../firm-admin/DashboardPage.jsx";
import WelcomePage from "./WelcomePage.jsx";

export default function DashboardHome() {
  const { user } = useAuth();

  if (user?.role === ROLES.SUPER_ADMIN) return <SuperAdminDashboardPage />;
  if (user?.role === ROLES.CA_FIRM_ADMIN || user?.role === ROLES.CA_FIRM_STAFF) return <FirmDashboardPage />;
  return <WelcomePage />;
}
