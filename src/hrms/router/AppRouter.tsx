import type { JSX } from "react";
import { useAuth } from "../contexts/AuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Auth/Login";
import SsoLanding from "../pages/Auth/SsoLanding";
import Setup from "../pages/Auth/Setup";
import ResetPassword from "../pages/Auth/ResetPassword";
import CompanyRegistration from "../pages/Auth/CompanyRegistration";
import NotFound from "../pages/NotFound";
import LandingPage from "../pages/LandingPage";

import { SidebarProvider } from "@/components/ui/collapsible-sidebar";
import AddUser from "@/pages/HRMS/Admin/AddUser";
import Employee from "@/pages/HRMS/Admin/Employee";
import Holiday from "@/pages/HRMS/Admin/Holidays/Holiday";
import Document from "@/pages/HRMS/Admin/Document";
import OnboardingChecklist from "@/pages/HRMS/Admin/OnboardingChecklist";
import Letters from "@/pages/HRMS/Admin/Latters";
import Resignation from "@/pages/HRMS/Admin/Resignation";
import Clearance from "@/pages/HRMS/Admin/Clerance";
import OnboardingTasks from "@/pages/HRMS/Admin/OnboardingTask";
import FinalSettlement from "@/pages/HRMS/Admin/FinalSattlement";
import AttendanceReport from "@/pages/HRMS/Admin/AttendanceReport";
import ShiftRoster from "@/pages/HRMS/Admin/ShiftRoaster";
import LeaveType from "@/pages/HRMS/Admin/LeaveManagement/LeaveType";
import LeaveEncashment from "@/pages/HRMS/Admin/LeaveManagement/LeaveEncashment";
import SalaryStructure from "@/pages/HRMS/Admin/Payroll/SalaryStructure";
import PayrollRun from "@/pages/HRMS/Admin/Payroll/PayrollRun";
import PayrollRunDetail from "@/pages/HRMS/Admin/Payroll/PayrollRunDetail";
import Payslips from "@/pages/HRMS/Admin/Payroll/Payslips";
import StatutoryReport from "@/pages/HRMS/Admin/Payroll/StatutoryReport";
import JobOpening from "@/pages/HRMS/Admin/Recruitment/JobOpenings";
import Candidates from "@/pages/HRMS/Admin/Recruitment/Candidates";
import InterviewPipeline from "@/pages/HRMS/Admin/Recruitment/InterviewPipeline";
import RoleBasedLayout from "@/pages/HRMS/Admin/Layout/RoleBasedLayout";
import Company from "@/pages/HRMS/Admin/SystemConfigration/Company";
import CompanySettings from "@/pages/HRMS/Admin/SystemConfigration/CompanySettings";
import Branches from "@/pages/HRMS/Admin/SystemConfigration/Branches";
import DepartmentPage from "@/pages/HRMS/Admin/SystemConfigration/Departments";
import Designation from "@/pages/HRMS/Admin/SystemConfigration/Desigantion";
import Policies from "@/pages/HRMS/Admin/SystemConfigration/Policies";
import ComingSoon from "@/pages/HRMS/Admin/ComingSoon";
import TeamMembers from "@/pages/HRMS/Manager/Teams/TeamMembers";
import Goals from "@/pages/HRMS/Manager/Performance/Goals";
import ProbationConfirmation from "@/pages/HRMS/Admin/ProbationConfirmation";
import PersonalInformation from "@/pages/HRMS/Employee/Profile/PersonalInformation";
import DocumentUpload from "@/pages/HRMS/Employee/Profile/DocumentUpload";
import EmployeePolicies from "@/pages/HRMS/Employee/Profile/EmployeePolicies";
import MarkAttendance from "@/pages/HRMS/Employee/Attendance/MarkAttendance";
import AttendanceCalendar from "@/pages/HRMS/Employee/Attendance/AttendanceCalender";
import AttendanceRequest from "@/pages/HRMS/Employee/Attendance/AttendanceRequest";
import Leave from "@/pages/HRMS/Employee/Leave/Leaves";
import LeaveBalance from "@/pages/HRMS/Employee/Leave/LeaveBalance";
import EmployeePayslips from "@/pages/HRMS/Payroll/EmployeePayslips";
import EmployeeSalaryStructure from "@/pages/HRMS/Payroll/EmployeeSallaryStracture";
import TravelRequests from "@/pages/HRMS/Employee/Request/TravelRequests";
import LeaveEncashmentRequests from "@/pages/HRMS/Employee/Request/LeaveEncashmentRequests";

import Expense from "@/pages/HRMS/Employee/Expenses/Expenses";
import EmployeeGoals from "@/pages/HRMS/Employee/Performance/EmployeeGoals";
import Appraisals from "@/pages/HRMS/Manager/Performance/Appraisals";
import MyAppraisals from "@/pages/HRMS/Employee/Performance/MyAppraisals";
import FeedbackAndRatings from "@/pages/HRMS/Manager/Performance/FeedbackandRating";
import MyFeedback from "@/pages/HRMS/Employee/Performance/PerformanceHistory";
import EmployeeLetters from "@/pages/HRMS/Employee/Latters/EmployeeLatters";
import TeamAttendance from "@/pages/HRMS/Manager/Teams/TeamAttendance";
import PerformanceMetrics from "@/pages/HRMS/Manager/Teams/PerformanceMatrics";
import HolidayCalendar from "@/pages/HRMS/Manager/Teams/HolidayCalender";
import ManagerInterviews from "@/pages/HRMS/Manager/Interviews/ManagerInterviews";
import LeaveCalendar from "@/pages/HRMS/Manager/Teams/LeaveCalender";
import LeaveRequest from "@/pages/HRMS/Manager/Approvals/LeaveRequest";
import EmployeeAttendanceRequest from "@/pages/HRMS/Manager/Approvals/EmployeeAttendanceRequest";
import ExpenseRequest from "@/pages/HRMS/Manager/Approvals/ExpenseRequest";
import EmployeeTravelRequest from "@/pages/HRMS/Manager/Approvals/EmployeeTravelRequest";
import AllAttendanceRequests from "@/pages/HRMS/Admin/AllAttendanceRequests";
import AdminDashboard from "@/pages/HRMS/Admin/AdminDashboard";
import EmployeeLeaveRequest from "@/pages/HRMS/Admin/EmployeeLeaveRequests";
import ManagerDashboard from "@/pages/HRMS/Manager/ManagerDashboard";
import EmployeeDashboard from "@/pages/HRMS/Employee/Dashboard/EmployeeDashboard";
import FinancePayroll from "@/pages/HRMS/Finance/Payroll/FinancePayroll";
import ShiftSchedule from "@/pages/HRMS/Employee/Attendance/Shift";
import SalaryDisbursement from "@/pages/HRMS/Finance/Payroll/SalaryDistributment";
import FinanceExpenseRequest from "@/pages/HRMS/Finance/Exprense&Remibusment/FinanceExpense";
import FinanceTravelRequest from "@/pages/HRMS/Finance/Travel/FinanceTravelRequests";
import FinanceReimbursementRequests from "@/pages/HRMS/Finance/Exprense&Remibusment/FinanceReimbursements";
import FinanceClearanceRequests from "@/pages/HRMS/Finance/ClearanceRequests";
import FinancePaymentRequests from "@/pages/HRMS/Finance/PaymentRequests";
import EmployeeOnboardingTask from "@/pages/HRMS/IT Admin/EmployeeOnboardingTask";
import AccountManagement from "@/pages/HRMS/IT Admin/AccountManagement";
import SoftwareAndLicenseAssignment from "@/pages/HRMS/IT Admin/SoftwearManagement";
import AssetInventory from "@/pages/HRMS/IT Admin/AsestInventory";
import AssignReassignAsset from "@/pages/HRMS/IT Admin/AssignAsset";
import ResignationRequest from "@/pages/HRMS/Employee/Request/ResignRequest";
import ReturnClerance from "@/pages/HRMS/IT Admin/ReturnClerance";
import ITClearanceDashboard from "@/pages/HRMS/IT Admin/Clerance";
import AssetCollectionStatus from "@/pages/HRMS/IT Admin/AssetCollectionStatus";
import LicenseClosureStatus from "@/pages/HRMS/IT Admin/LicenseClosureStatus";
import WorkstationDeskAllocation from "@/pages/HRMS/WorkstationDeskAllocation";
import AccessCardManagement from "@/pages/HRMS/AccessCardManagement";
import LockerAssignmentPage from "@/pages/HRMS/LockerAssignmentPage";
import ParkingAssignmentPage from "@/pages/HRMS/ParkingAssingmentPage";
import NonITAssetInventoryPage from "@/pages/HRMS/NonITAssetInventoryPage";
import StationerySafety from "@/pages/HRMS/StationerySafety";
import AccessCardReturn from "@/pages/HRMS/AccessCardReturn";
import WorkstationDeskDeallocation from "@/pages/HRMS/WorkstationDeskDeallocation";
import AssetReturn from "@/pages/HRMS/NonITAssetReturn";
import FullFinalClearance from "@/pages/HRMS/FullFinalClerance";
import AutiorEmployee from "@/pages/HRMS/Auditor/AutiorEmployee";
import AuditorPayroll from "@/pages/HRMS/Auditor/AuditorPayroll";
import AttendanceLogs from "@/pages/HRMS/Auditor/AttendanceLogs";
import AuditorLeave from "@/pages/HRMS/Auditor/AuditorLeave";
import ComplianceReport from "@/pages/HRMS/Auditor/ComplianceReport";
import AuditorPolicies from "@/pages/HRMS/Auditor/AuditorPolicies";
import AuditorStatutoryReports from "@/pages/HRMS/Auditor/AuditorStatutoryReports";
import AuditorDocuments from "@/pages/HRMS/Auditor/AuditorDocuments";
import AuditorSalaryStructures from "@/pages/HRMS/Auditor/AuditorSalaryStructures";
import AuditorOnboarding from "@/pages/HRMS/Auditor/AuditorOnboarding";
import AuditorResignations from "@/pages/HRMS/Auditor/AuditorResignations";
import AuditorPayrollRuns from "@/pages/HRMS/Auditor/AuditorPayrollRuns";
import AuditorPayslips from "@/pages/HRMS/Auditor/AuditorPayslips";
import AuditorAttendanceRequests from "@/pages/HRMS/Auditor/AuditorAttendanceRequests";
import AuditorHolidays from "@/pages/HRMS/Auditor/AuditorHolidays";
import AuditorLeaveEncashment from "@/pages/HRMS/Auditor/AuditorLeaveEncashment";
import AuditorLeaveTypes from "@/pages/HRMS/Auditor/AuditorLeaveTypes";
import AuditorDashboard from "@/pages/HRMS/Auditor/AuditorDashboard";
import ITAdminDashboard from "@/pages/HRMS/IT Admin/ITAdminDashboard";
import FinanceDashboard from "@/pages/HRMS/Finance/FinanaceManagerDashboard";
import Profile from "@/pages/HRMS/Admin/Profile";
import OvertimeRequestPage from "@/pages/HRMS/Employee/Request/OverTimeRequests";
import ProfileUpdateRequest from "@/pages/HRMS/Employee/Request/ProfileUpdateRequest";
import EmployeeOvertimeRequests from "@/pages/HRMS/Manager/Approvals/EmployeeOvertimeRequest";
import EmployeeProfileUpdateRequest from "@/pages/HRMS/Manager/Approvals/EmployeeProfileUpdateRequest";
import TravelReconciliation from "@/pages/HRMS/Finance/Travel/TravelReconciliation";
import Role from "@/pages/HRMS/Admin/SystemConfigration/Role";
import AuditLogs from "@/pages/HRMS/Admin/SystemConfigration/AuditLogs";
import CostCenters from "@/pages/HRMS/Admin/SystemConfigration/CostCenters";
import WorkingDays from "@/pages/HRMS/Admin/SystemConfigration/WorkingDays";
import MasterList from "@/pages/HRMS/Admin/SystemConfigration/MasterList";
import EncashmentRequest from "@/pages/HRMS/Admin/LeaveManagement/EncashmentRequest";
import SelfServiceAttendance from "@/pages/HRMS/SelfService/SelfServiceAttendance";
import SelfServiceLeave from "@/pages/HRMS/SelfService/SelfServiceLeave";
import SelfServicePayroll from "@/pages/HRMS/SelfService/SelfServicePayroll";
import SelfServiceRequests from "@/pages/HRMS/SelfService/SelfServiceRequests";
import RaiseEscalation from "@/pages/HRMS/Admin/Escalations/RaiseEscalation";
import EscalationList from "@/pages/HRMS/Admin/Escalations/EscalationList";
import OverrideBalance from "@/pages/HRMS/Admin/LeaveManagement/OverrideBalance";
import ImportExportData from "@/pages/HRMS/Admin/DataManagement/ImportExportData";
import HardDelete from "@/pages/HRMS/Admin/DataManagement/HardDelete";
import BillingDashboard from "@/pages/HRMS/Admin/SystemConfigration/BillingDashboard";
import TrainingModules from "@/pages/HRMS/Admin/Training/TrainingModules";
import Trainees from "@/pages/HRMS/Admin/Training/Trainees";
import TraineeDetails from "@/pages/HRMS/Admin/Training/TraineeDetails";
import TraineeDashboard from "@/pages/HRMS/Training/TraineeDashboard";
import ModulePlayer from "@/pages/HRMS/Training/ModulePlayer";
import QuizRunner from "@/pages/HRMS/Training/QuizRunner";

function ProtectedRoute({
  children,
  role,
  roles,
}: {
  children: JSX.Element;
  role?: string; // ✅ old usage support
  roles?: string[]; // ✅ new usage support
}) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const userRole = user.role?.toLowerCase().trim();

  // 🔥 smart handling: role OR roles
  const allowedRoles = roles ?? (role ? [role] : []);

  if (allowedRoles.length && !allowedRoles.includes(userRole)) {
    const roleRouteMap: Record<string, string> = {
      superadmin: "/hrms/SuperAdmin/dashboard",
      "super-admin": "/hrms/SuperAdmin/dashboard",
      admin: "/hrms/admin/dashboard",
      mentor: "/hrms/employee/dashboard",
      employee: "/hrms/employee/dashboard",
      "hr-admin": "/hrms/SuperAdmin/dashboard",
      manager: "/hrms/manager/dashboard",
      finance: "/hrms/finance/dashboard",
      "it-admin": "/hrms/it/dashboard",
      auditor: "/hrms/auditor/dashboard",
      "hrms-admin": "/hrms/SuperAdmin/dashboard",
    };

    return <Navigate to={roleRouteMap[userRole] || "/login"} replace />;
  }

  return children;
}



function RootRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <LandingPage />;
  }

  if (user.isTrainee) {
    return <Navigate to="/hrms/training" replace />;
  }

  // Redirect to user's role-based dashboard
  const roleRouteMap: { [key: string]: string } = {
    superadmin: "/hrms/SuperAdmin/dashboard",
    "super-admin": "/hrms/SuperAdmin/dashboard",
    admin: "/hrms/admin/dashboard",
    mentor: "/hrms/employee/dashboard",
    employee: "/hrms/employee/dashboard",
    "hr-admin": "/hrms/SuperAdmin/dashboard",
    "manager": "/hrms/manager/dashboard",
    "finance": "/hrms/finance/dashboard",
    "IT-Admin": "/hrms/it/dashboard",
    "it-admin": "/hrms/it/dashboard",
    "auditor": "/hrms/auditor/dashboard",
    "HRMS-Admin": "/hrms/SuperAdmin/dashboard",
    "hrms-admin": "/hrms/SuperAdmin/dashboard",
  };

  const route = roleRouteMap[user.role] || "/login";
  return <Navigate to={route} replace />;
}


function HRMSRootRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (user.isTrainee) {
    return <Navigate to="/hrms/training" replace />;
  }

  if (user.role === "superadmin" || user.role === "super-admin" || user.role === "hr-admin") {
    return <Navigate to="/hrms/SuperAdmin/dashboard" replace />;
  }

  if (user.role === "mentor" || user.role === "employee") {
    return <Navigate to="/hrms/employee/dashboard" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/hrms/admin/dashboard" replace />;
  }

  if (user.role === "manager") {
    return <Navigate to="/hrms/manager/dashboard" replace />;
  }

  return <Navigate to="/" replace />;
}




export default function AppRouter() {
  return (
    <BrowserRouter basename="/hrms-app">
      <Routes>
        {/* Root Route - Authentication Check */}
        <Route path="/" element={<RootRoute />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/sso" element={<SsoLanding />} />
        <Route path="/setup/:token" element={<Setup />} />
        <Route path="/register" element={<CompanyRegistration />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />


        {/* HRMS */}
        <Route path="/hrms" element={<HRMSRootRoute />} />

        <Route
          path="/hrms/*"
          element={
            <ProtectedRoute>
              <SidebarProvider defaultCollapsed={false}>
                <RoleBasedLayout />
              </SidebarProvider>
            </ProtectedRoute>
          }
        >
          <Route
            path="SuperAdmin"
            element={<Navigate to="dashboard" replace />}
          />
          {/* ADMIN ROUTES */}
          <Route path="SuperAdmin/addUser" element={<AddUser />} />
          <Route path="SuperAdmin/employees" element={<Employee />} />
          <Route
            path="SuperAdmin/employees/profile/:id"
            element={<Profile />}
          />
          <Route
            path="SuperAdmin/probation"
            element={<ProbationConfirmation />}
          />
          <Route path="SuperAdmin/holidays" element={<Holiday />} />
          <Route path="SuperAdmin/documents" element={<Document />} />
          <Route
            path="SuperAdmin/onboarding/checklist"
            element={<OnboardingChecklist />}
          />
          <Route path="SuperAdmin/letters" element={<Letters />} />
          <Route
            path="SuperAdmin/offboarding/resignations"
            element={<Resignation />}
          />
          <Route
            path="SuperAdmin/offboarding/clearance"
            element={<Clearance />}
          />
          <Route
            path="SuperAdmin/onboarding/tasks"
            element={<OnboardingTasks />}
          />
          <Route
            path="SuperAdmin/offboarding/full-final"
            element={<FinalSettlement />}
          />
          <Route path="SuperAdmin/dashboard" element={<AdminDashboard />} />
          <Route path="SuperAdmin/attendance" element={<AttendanceReport />} />
          <Route
            path="SuperAdmin/attendance/requests"
            element={<AllAttendanceRequests />}
          />
          <Route path="SuperAdmin/shifts" element={<ShiftRoster />} />
          <Route path="SuperAdmin/leaves" element={<EmployeeLeaveRequest />} />
          <Route path="SuperAdmin/leave-types" element={<LeaveType />} />
          <Route
            path="SuperAdmin/leave-encashment"
            element={<LeaveEncashment />}
          />
          <Route
            path="SuperAdmin/leave-encashment-requests"
            element={<EncashmentRequest />}
          />
          <Route
            path="SuperAdmin/leave-override"
            element={<OverrideBalance />}
          />
          <Route
            path="SuperAdmin/raise-escalation"
            element={<RaiseEscalation />}
          />
          <Route
            path="SuperAdmin/escalations"
            element={<EscalationList />}
          />
          <Route
            path="SuperAdmin/salary-structure"
            element={<SalaryStructure />}
          />
          <Route path="SuperAdmin/payroll/run" element={<PayrollRun />} />
          <Route path="SuperAdmin/payroll/run/:month" element={<PayrollRunDetail />} />
          <Route path="SuperAdmin/payslips" element={<Payslips />} />
          <Route
            path="SuperAdmin/statutory-reports"
            element={<StatutoryReport />}
          />
          <Route path="SuperAdmin/jobs" element={<JobOpening />} />
          <Route path="SuperAdmin/candidates" element={<Candidates />} />
          <Route path="SuperAdmin/interviews" element={<InterviewPipeline />} />
          <Route path="SuperAdmin/companies" element={<Company />} />
          <Route
            path="SuperAdmin/company-settings"
            element={<CompanySettings />}
          />
          <Route path="SuperAdmin/branches" element={<Branches />} />
          <Route path="SuperAdmin/departments" element={<DepartmentPage />} />
          <Route path="SuperAdmin/designations" element={<Designation />} />
          <Route path="SuperAdmin/cost-centers" element={<CostCenters />} />
          <Route path="SuperAdmin/working-days" element={<WorkingDays />} />
          <Route path="SuperAdmin/master-list" element={<MasterList />} />
          <Route path="SuperAdmin/roles" element={<Role />} />
          <Route path="SuperAdmin/audit-logs" element={<AuditLogs />} />
          <Route path="SuperAdmin/policies" element={<Policies />} />
          <Route path="SuperAdmin/data-management/import-export" element={<ImportExportData />} />
          <Route path="SuperAdmin/data-management/hard-delete" element={<HardDelete />} />
          <Route path="SuperAdmin/billing" element={<BillingDashboard />} />
          <Route path="SuperAdmin/training/modules" element={<TrainingModules />} />
          <Route path="SuperAdmin/training/trainees" element={<Trainees />} />
          <Route path="SuperAdmin/training/trainees/:id" element={<TraineeDetails />} />
          {/* Not built yet — placeholder so the Policies sidebar entries aren't dead links */}
          <Route path="SuperAdmin/training/posh" element={<ComingSoon title="POSH Training" />} />
          <Route path="SuperAdmin/training/others" element={<ComingSoon title="Other Training" />} />
          <Route path="SuperAdmin/policies/medical" element={<ComingSoon title="Medical Policy" />} />
          <Route path="SuperAdmin/policies/insurance" element={<ComingSoon title="Insurance Policy" />} />
          <Route path="SuperAdmin/policies/posh" element={<ComingSoon title="POSH Policy" />} />
          {/* MANAGER ROUTES */}
          <Route path="manager" element={<Navigate to="dashboard" replace />} />
          <Route path="manager/dashboard" element={<ManagerDashboard />} />
          <Route path="manager/team" element={<TeamMembers />} />
          <Route path="manager/leave-calendar" element={<HolidayCalendar />} />
          <Route path="manager/interviews" element={<ManagerInterviews />} />
          <Route path="manager/performance/goals" element={<Goals />} />
          <Route path="manager/performance/metrics" element={<PerformanceMetrics />} />
          <Route
            path="manager/performance/appraisals"
            element={<Appraisals />}
          />
          <Route
            path="manager/performance/feedback"
            element={<FeedbackAndRatings />}
          />
          <Route path="manager/team-attendance" element={<TeamAttendance />} />
          <Route path="manager/leaves" element={<LeaveCalendar />} />
          <Route path="manager/approvals/leaves" element={<LeaveRequest />} />
          <Route
            path="manager/approvals/attendance"
            element={<EmployeeAttendanceRequest />}
          />
          <Route
            path="manager/approvals/expenses"
            element={<ExpenseRequest />}
          />
          <Route
            path="manager/approvals/travel"
            element={<EmployeeTravelRequest />}
          />
          <Route
            path="manager/approvals/overtime"
            element={<EmployeeOvertimeRequests />}
          />
          <Route
            path="manager/approvals/profile-updates"
            element={<EmployeeProfileUpdateRequest />}
          />
          {/* Employee ROUTES */}
          <Route path="employe" element={<Navigate to="dashboard" replace />} />
          <Route path="employee/dashboard" element={<EmployeeDashboard />} />
          <Route
            path="employee/profile/personal"
            element={<PersonalInformation />}
          />
          <Route
            path="employee/profile/documents"
            element={<DocumentUpload />}
          />
          <Route
            path="employee/profile/organization"
            element={<EmployeePolicies />}
          />
          <Route path="employee/attendance/mark" element={<MarkAttendance />} />
          <Route
            path="employee/attendance/calendar"
            element={<AttendanceCalendar />}
          />
          <Route
            path="employee/attendance/requests"
            element={<AttendanceRequest />}
          />
          <Route path="employee/leave/apply" element={<Leave />} />
          <Route path="employee/leave/balance" element={<LeaveBalance />} />
          <Route
            path="employee/payroll/payslips"
            element={<EmployeePayslips />}
          />
          <Route
            path="employee/payroll/salary-structure"
            element={<EmployeeSalaryStructure />}
          />
          <Route
            path="employee/request/my-requests"
            element={<TravelRequests />}
          />
          <Route
            path="employee/request/leave-encashment"
            element={<LeaveEncashmentRequests />}
          />

          <Route
            path="employee/request/resign"
            element={<ResignationRequest />}
          />
          <Route
            path="employee/request/overtime"
            element={<OvertimeRequestPage />}
          />
          <Route
            path="employee/request/profileUpdate"
            element={<ProfileUpdateRequest />}
          />
          <Route path="employee/expenses/submit" element={<Expense />} />
          <Route
            path="employee/performance/goals"
            element={<EmployeeGoals />}
          />
          <Route
            path="employee/performance/self-appraisal"
            element={<MyAppraisals />}
          />
          <Route
            path="employee/attendance/shift-schedule"
            element={<ShiftSchedule />}
          />
          <Route path="employee/performance/history" element={<MyFeedback />} />
          <Route path="employee/letters" element={<EmployeeLetters />} />
          <Route path="finance" element={<Navigate to="dashboard" replace />} />
          <Route path="finance/dashboard" element={<FinanceDashboard />} />
          <Route path="finance/payroll/review" element={<FinancePayroll />} />
          <Route
            path="finance/payroll/disbursement"
            element={<SalaryDisbursement />}
          />
          <Route path="finance/expenses" element={<FinanceExpenseRequest />} />
          <Route
            path="finance/travel/advances"
            element={<FinanceTravelRequest />}
          />
          <Route
            path="finance/travel/reconciliation"
            element={<TravelReconciliation />}
          />
          <Route
            path="finance/reimbursements"
            element={<FinanceReimbursementRequests />}
          />
          <Route
            path="finance/offboarding/clearance-requests"
            element={<FinanceClearanceRequests />}
          />
          <Route
            path="finance/payment-requests"
            element={<FinancePaymentRequests />}
          />
          <Route
            path="finance/statutory/reports"
            element={<StatutoryReport />}
          />
          {/* MANAGER ROUTES */}
          <Route path="it" element={<Navigate to="dashboard" replace />} />
          <Route path="it/dashboard" element={<ITAdminDashboard />} />
          <Route path="it/onboarding" element={<EmployeeOnboardingTask />} />
          <Route path="it/accounts" element={<AccountManagement />} />
          <Route
            path="it/software"
            element={<SoftwareAndLicenseAssignment />}
          />
          <Route path="it/assets" element={<AssetInventory />} />
          <Route path="it/assets/assign" element={<AssignReassignAsset />} />
          <Route path="it/assets/return" element={<ReturnClerance />} />
          <Route
            path="it/offboarding/access"
            element={<ITClearanceDashboard />}
          />
          <Route
            path="it/offboarding/assets"
            element={<AssetCollectionStatus />}
          />
          <Route
            path="it/offboarding/licenses"
            element={<LicenseClosureStatus />}
          />
          {/* Admin ROUTES */}
          <Route path="admin" element={<Navigate to="dashboard" replace />} />
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/company-settings" element={<CompanySettings />} />
          <Route path="admin/addUser" element={<AddUser />} />
          <Route path="admin/employees" element={<Employee />} />
          <Route
            path="admin/employees/profile/:id"
            element={<Profile />}
          />
          <Route
            path="admin/probation"
            element={<ProbationConfirmation />}
          />
          <Route path="admin/holidays" element={<Holiday />} />
          <Route path="admin/documents" element={<Document />} />
          <Route
            path="admin/onboarding/checklist"
            element={<OnboardingChecklist />}
          />
          <Route path="admin/letters" element={<Letters />} />
          <Route
            path="admin/offboarding/resignations"
            element={<Resignation />}
          />
          <Route
            path="admin/offboarding/clearance"
            element={<Clearance />}
          />
          <Route
            path="admin/onboarding/tasks"
            element={<OnboardingTasks />}
          />
          <Route
            path="admin/offboarding/full-final"
            element={<FinalSettlement />}
          />
          <Route path="admin/attendance" element={<AttendanceReport />} />
          <Route
            path="admin/attendance/requests"
            element={<AllAttendanceRequests />}
          />
          <Route path="admin/shifts" element={<ShiftRoster />} />
          <Route path="admin/leaves" element={<EmployeeLeaveRequest />} />
          <Route path="admin/leave-types" element={<LeaveType />} />
          <Route
            path="admin/leave-encashment"
            element={<LeaveEncashment />}
          />
          <Route
            path="admin/leave-encashment-requests"
            element={<EncashmentRequest />}
          />
          <Route
            path="admin/leave-override"
            element={<OverrideBalance />}
          />
          <Route
            path="admin/raise-escalation"
            element={<RaiseEscalation />}
          />
          <Route
            path="admin/escalations"
            element={<EscalationList />}
          />
          <Route
            path="admin/salary-structure"
            element={<SalaryStructure />}
          />
          <Route path="admin/payroll/run" element={<PayrollRun />} />
          <Route path="admin/payroll/run/:month" element={<PayrollRunDetail />} />
          <Route path="admin/payslips" element={<Payslips />} />
          <Route
            path="admin/statutory-reports"
            element={<StatutoryReport />}
          />
          <Route path="admin/jobs" element={<JobOpening />} />
          <Route path="admin/candidates" element={<Candidates />} />
          <Route path="admin/interviews" element={<InterviewPipeline />} />
          <Route path="admin/companies" element={<Company />} />
          <Route path="admin/branches" element={<Branches />} />
          <Route path="admin/departments" element={<DepartmentPage />} />
          <Route path="admin/designations" element={<Designation />} />
          <Route path="admin/cost-centers" element={<CostCenters />} />
          <Route path="admin/working-days" element={<WorkingDays />} />
          <Route path="admin/master-list" element={<MasterList />} />
          <Route path="admin/roles" element={<Role />} />
          <Route path="admin/audit-logs" element={<AuditLogs />} />
          <Route path="admin/policies" element={<Policies />} />
          <Route path="admin/data-management/import-export" element={<ImportExportData />} />
          <Route path="admin/data-management/hard-delete" element={<HardDelete />} />
          <Route path="admin/billing" element={<BillingDashboard />} />
          <Route path="admin/training/modules" element={<TrainingModules />} />
          <Route path="admin/training/trainees" element={<Trainees />} />
          <Route path="admin/training/trainees/:id" element={<TraineeDetails />} />
          <Route
            path="admin/onboarding/workstation"
            element={<WorkstationDeskAllocation />}
          />
          <Route
            path="admin/onboarding/id-card"
            element={<AccessCardManagement />}
          />
          <Route
            path="admin/onboarding/locker"
            element={<LockerAssignmentPage />}
          />
          <Route
            path="admin/onboarding/transport"
            element={<ParkingAssignmentPage />}
          />
          <Route
            path="admin/assets/non-it"
            element={<NonITAssetInventoryPage />}
          />
          <Route
            path="admin/assets/stationery"
            element={<StationerySafety />}
          />
          <Route
            path="admin/offboarding/id-return"
            element={<AccessCardReturn />}
          />
          <Route
            path="admin/offboarding/workstation"
            element={<WorkstationDeskDeallocation />}
          />
          <Route path="admin/offboarding/assets" element={<AssetReturn />} />
          <Route
            path="admin/offboarding/final-clearance"
            element={<FullFinalClearance />}
          />
          {/* Auditor ROUTES */}
          <Route path="auditor" element={<Navigate to="dashboard" replace />} />
          <Route path="auditor/employees" element={<AutiorEmployee />} />
          <Route path="auditor/payroll" element={<AuditorPayroll />} />
          <Route path="auditor/attendance" element={<AttendanceLogs />} />
          <Route path="auditor/leaves" element={<AuditorLeave />} />
          <Route path="auditor/compliance" element={<ComplianceReport />} />
          <Route path="auditor/policies" element={<AuditorPolicies />} />
          <Route path="auditor/statutory-reports" element={<AuditorStatutoryReports />} />
          <Route path="auditor/documents" element={<AuditorDocuments />} />
          <Route path="auditor/salary-structures" element={<AuditorSalaryStructures />} />
          <Route path="auditor/onboarding" element={<AuditorOnboarding />} />
          <Route path="auditor/resignations" element={<AuditorResignations />} />
          <Route path="auditor/payroll-runs" element={<AuditorPayrollRuns />} />
          <Route path="auditor/payslips" element={<AuditorPayslips />} />
          <Route path="auditor/attendance-requests" element={<AuditorAttendanceRequests />} />
          <Route path="auditor/holidays" element={<AuditorHolidays />} />
          <Route path="auditor/leave-encashment" element={<AuditorLeaveEncashment />} />
          <Route path="auditor/leave-types" element={<AuditorLeaveTypes />} />
          <Route path="auditor/dashboard" element={<AuditorDashboard />} />

          {/* TRAINING (shared by every role — RoleBasedLayout routes any user with isTrainee=true here regardless of their underlying role) */}
          <Route path="training" element={<TraineeDashboard />} />
          <Route path="training/module/:moduleId" element={<ModulePlayer />} />
          <Route path="training/module/:moduleId/test" element={<QuizRunner />} />

          {/* SELF SERVICE (shared by Manager / Finance / IT-Admin / Auditor — own profile, attendance, leave, payroll, documents, requests) */}
          <Route path="self-service/profile" element={<PersonalInformation />} />
          <Route path="self-service/attendance" element={<SelfServiceAttendance />} />
          <Route path="self-service/leave" element={<SelfServiceLeave />} />
          <Route path="self-service/payroll" element={<SelfServicePayroll />} />
          <Route path="self-service/documents" element={<DocumentUpload />} />
          <Route path="self-service/requests" element={<SelfServiceRequests />} />
        </Route>


        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
