import { useAuth } from "../../hooks/useAuth.js";
import { ROLES } from "../../config/roles.js";
import SuperAdminDashboardPage from "../super-admin/DashboardPage.jsx";
import FirmDashboardPage from "../firm-admin/DashboardPage.jsx";
import ClientAdminDashboardPage from "../client-admin/DashboardPage.jsx";
import WelcomePage from "./WelcomePage.jsx";

export default function DashboardHome() {
  const { user } = useAuth();

  if (user?.role === ROLES.SUPER_ADMIN) return <SuperAdminDashboardPage />;
  if (user?.role === ROLES.CA_FIRM_ADMIN || user?.role === ROLES.CA_FIRM_STAFF) return <FirmDashboardPage />;
  // Only reached by a Non-HRMS Business Client Admin — HRMS ones are handed
  // off to HRMS via SSO before ever landing on /client-admin (see GuestOnly).
  if (user?.role === ROLES.BUSINESS_CLIENT_ADMIN) return <ClientAdminDashboardPage />;
  return <WelcomePage />;
}
