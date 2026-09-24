import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import PublicLayout from "../layouts/PublicLayout.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import RoleRoute from "./RoleRoute.jsx";
import RoleBaseRoute from "./RoleBaseRoute.jsx";
import { ROLES, getRoleBasePath } from "../config/roles.js";
import { BUSINESS_CLIENT_ROLES, redirectToHrms } from "../utils/hrmsSso.js";
import Spinner from "../components/ui/Spinner.jsx";

import LandingPage from "../pages/public/LandingPage.jsx";
import LoginPage from "../pages/public/LoginPage.jsx";
import SignupPage from "../pages/public/SignupPage.jsx";
import NotFoundPage from "../pages/public/NotFoundPage.jsx";
import PublicEmployeeFormPage from "../pages/public/PublicEmployeeFormPage.jsx";

import DashboardHome from "../pages/dashboard/DashboardHome.jsx";
import ComingSoonPage from "../pages/dashboard/ComingSoonPage.jsx";
import CaFirmsPage from "../pages/super-admin/CaFirmsPage.jsx";
import BusinessClientsPage from "../pages/super-admin/BusinessClientsPage.jsx";
import FirmBusinessClientsPage from "../pages/firm-admin/BusinessClientsPage.jsx";
import ClientPayrollPage from "../pages/firm-admin/payroll/ClientPayrollPage.jsx";
import ClientPayrollRunDetailPage from "../pages/firm-admin/payroll/ClientPayrollRunDetailPage.jsx";
import ClientSalaryStructurePage from "../pages/firm-admin/payroll/ClientSalaryStructurePage.jsx";
import ClientEmployeeDetailsPage from "../pages/firm-admin/payroll/ClientEmployeeDetailsPage.jsx";
import ClientPaymentFilePage from "../pages/firm-admin/payroll/ClientPaymentFilePage.jsx";
import PayrollManagementPage from "../pages/firm-admin/payroll/PayrollManagementPage.jsx";
import UsersPage from "../pages/super-admin/UsersPage.jsx";
import BillingPage from "../pages/super-admin/BillingPage.jsx";
import SuperAdminSupportPage from "../pages/super-admin/SupportPage.jsx";
import AuditLogsPage from "../pages/super-admin/AuditLogsPage.jsx";
import SettingsPage from "../pages/super-admin/SettingsPage.jsx";
import FirmAdminSupportPage from "../pages/firm-admin/SupportPage.jsx";
import FirmSettingsPage from "../pages/firm-admin/SettingsPage.jsx";
import SubscriptionPage from "../pages/firm-admin/SubscriptionPage.jsx";
import StaffPage from "../pages/firm-admin/StaffPage.jsx";
import CrmPage from "../pages/firm-admin/CrmPage.jsx";
import CompliancePage from "../pages/firm-admin/CompliancePage.jsx";
import FinanceTrackerPage from "../pages/firm-admin/finance-tracker/FinanceTrackerPage.jsx";
import ClientFinanceWorkspacePage from "../pages/firm-admin/finance-tracker/ClientFinanceWorkspacePage.jsx";
import ClientAdminEmployeesPage from "../pages/client-admin/EmployeesPage.jsx";
import ClientAdminSalaryStructurePage from "../pages/client-admin/SalaryStructurePage.jsx";

function GuestOnly({ children }) {
  const { isAuthenticated, user } = useAuth();
  const isBusinessClient = isAuthenticated && BUSINESS_CLIENT_ROLES.includes(user?.role);
  const [ssoFailed, setSsoFailed] = useState(false);

  useEffect(() => {
    if (!isBusinessClient) return;
    // Already signed in as a Business Client (e.g. their CA-Management refresh
    // cookie is still valid from an earlier session) — send them straight to
    // HRMS instead of ever showing /client-admin, which they have no reason
    // to see. Only fall back to it if the token fetch itself fails.
    redirectToHrms().then((ok) => {
      if (!ok) setSsoFailed(true);
    });
  }, [isBusinessClient]);

  if (isBusinessClient) {
    if (ssoFailed) return <Navigate to={getRoleBasePath(user?.role)} replace />;
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <Spinner size={24} />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to={getRoleBasePath(user?.role)} replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestOnly>
            <SignupPage />
          </GuestOnly>
        }
      />

      <Route path="/onboard/:token" element={<PublicEmployeeFormPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/:roleBase" element={<RoleBaseRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />

            <Route element={<RoleRoute roles={[ROLES.SUPER_ADMIN]} />}>
              <Route path="ca-firms" element={<CaFirmsPage />} />
              <Route path="business-clients" element={<BusinessClientsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route element={<RoleRoute roles={[ROLES.CA_FIRM_ADMIN]} />}>
              <Route path="firm-settings" element={<FirmSettingsPage />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="clients" element={<FirmBusinessClientsPage />} />
              <Route path="payroll-management" element={<PayrollManagementPage />} />
            </Route>

            <Route element={<RoleRoute roles={[ROLES.CA_FIRM_ADMIN, ROLES.CA_FIRM_STAFF]} />}>
              <Route path="crm" element={<CrmPage />} />
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="finance-tracker" element={<FinanceTrackerPage />} />
              <Route path="finance-tracker/:profileId" element={<ClientFinanceWorkspacePage />} />
              <Route path="clients/:clientId/payroll" element={<ClientPayrollPage />} />
              <Route path="clients/:clientId/payroll/:month" element={<ClientPayrollRunDetailPage />} />
              <Route path="clients/:clientId/payroll/:month/payment-file" element={<ClientPaymentFilePage />} />
              <Route path="clients/:clientId/salary-structure" element={<ClientSalaryStructurePage />} />
              <Route path="clients/:clientId/employee-details" element={<ClientEmployeeDetailsPage />} />
            </Route>

            <Route element={<RoleRoute roles={[ROLES.BUSINESS_CLIENT_ADMIN]} />}>
              <Route path="employees" element={<ClientAdminEmployeesPage />} />
              <Route path="salary-structure" element={<ClientAdminSalaryStructurePage />} />
            </Route>

            <Route element={<RoleRoute roles={[ROLES.SUPER_ADMIN, ROLES.CA_FIRM_ADMIN, ROLES.CA_FIRM_STAFF]} />}>
              <Route
                path="support"
                element={
                  <RoleAwareSupportPage />
                }
              />
            </Route>

            <Route path="*" element={<ComingSoonPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function RoleAwareSupportPage() {
  const { user } = useAuth();
  if (user?.role === ROLES.SUPER_ADMIN) return <SuperAdminSupportPage />;
  return <FirmAdminSupportPage />;
}
