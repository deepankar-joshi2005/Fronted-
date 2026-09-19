/** @format */

import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarNav,
  SidebarNavItem,
  SidebarTitle,
  SidebarToggle,
  SidebarGroup,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/collapsible-sidebar";
import {
  Users,
  Building2,
  Briefcase,
  CalendarDays,
  FileText,
  NotebookPen,
  ListChecks,
  ShieldCheck,
  LogOut,
  Layers,
  Receipt,
  Clock,
  ClipboardCheck,
  Calendar,
  Settings,
  Wallet,
  IndianRupee,
  PlayCircle,
  FileBarChart,
  GitBranch,
  ClipboardList,
  MapPin,
  Shield,
  List,
  AlertCircle,
  UserCog,
  ChevronDown,
  Sun,
  Moon,
  Boxes,
  Lock,
  ArrowLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import SubscriptionOverlay from "@/components/SubscriptionOverlay";
import { API_URL } from "@/api/axiosInstance";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BranchFilterProvider } from "@/contexts/BranchFilterContext";

interface HRMSAdminLayoutProps {
  children: React.ReactNode;
}

function initialsOf(name?: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "U";
}

// Where "Back to CA" sends a CA-proxy session — the Business Clients list in
// the main CA-Management app (a separate React root, hence a hard navigation
// rather than client-side routing). Only ca_firm_admin can currently open a
// CA-proxy session at all (the "View/run payroll" entry point isn't wired up
// for ca_firm_staff yet), so this fixed path is safe for now.
const CA_MANAGEMENT_RETURN_PATH = "/firm-admin/clients";

// Mirrors the backend allowlist in CA-Backend/hrms/middleware/auth.ts — kept
// here purely for UI/UX (the backend check is the real security boundary).
const CA_PROXY_ALLOWED_SEGMENTS = ["payroll", "salary-structure", "payslip", "statutory-report"];
function isPayrollPath(pathname: string) {
  const p = pathname.toLowerCase();
  return CA_PROXY_ALLOWED_SEGMENTS.some((seg) => p.includes(seg));
}

function CaProxyAccessDenied() {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]">
        <Lock className="h-6 w-6" />
      </div>
      <p className="text-lg font-semibold text-[var(--foreground)]">Access denied</p>
      <p className="max-w-md text-sm text-[var(--muted-foreground)]">
        This session was opened by your CA firm to manage Payroll only. Salary Structure, Payroll Run, Payslips and
        Statutory Reports are available — everything else in this company's HRMS is off-limits from here.
      </p>
      <button
        type="button"
        onClick={() => navigate("/hrms/SuperAdmin/payroll/run")}
        className="mt-2 rounded-lg bg-[var(--sidebar-primary)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Go to Payroll Run
      </button>
    </div>
  );
}

function formatRole(role?: string | null) {
  if (!role) return "";
  return role
    .split(/[-_]/g)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

function HeaderBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <header className="bg-[var(--sidebar)] border-b border-[var(--sidebar-border)] px-4 sm:px-6 py-3 relative z-40">
      <div className="flex items-center gap-3">
        <div className="lg:hidden">
          <SidebarToggle className="text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover-bg)]" />
        </div>

        <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-[var(--sidebar-foreground)] to-[var(--sidebar-primary)] bg-clip-text text-transparent">
          {formatRole(user?.role) || "Portal"}
        </h1>

        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          {user?.isCaProxy && (
            <button
              type="button"
              onClick={() => {
                // This tab was opened via window.open() from the CA-Management
                // Business Clients page, which is still sitting there, still
                // logged in — closing this tab returns focus to it directly.
                // Falls back to a hard navigation only if the browser refuses
                // to close it (e.g. it wasn't opened via script).
                window.close();
                setTimeout(() => {
                  if (!window.closed) window.location.href = CA_MANAGEMENT_RETURN_PATH;
                }, 150);
              }}
              title="Back to CA"
              className="flex items-center gap-1.5 rounded-lg bg-[var(--sidebar-primary)] px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to CA</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Dark Mode (Click for Light Mode)" : "Light Mode (Click for Dark Mode)"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--sidebar-foreground)] transition-colors hover:bg-[var(--sidebar-hover-bg)]"
          >
            {theme === "dark" ? (
              <Moon className="h-5 w-5 text-amber-300 fill-amber-300/20" />
            ) : (
              <Sun className="h-5 w-5 text-amber-500" />
            )}
          </button>

          {!user?.isCaProxy && (
            <button
              type="button"
              onClick={() => navigate("/hrms/SuperAdmin/holidays")}
              title="Holiday calendar"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--sidebar-foreground)] transition-colors hover:bg-[var(--sidebar-hover-bg)]"
            >
              <Calendar className="h-5 w-5" />
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-[var(--sidebar-hover-bg)]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--sidebar-primary)] text-xs font-semibold text-white">
                  {initialsOf(user?.name)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-medium leading-tight text-[var(--sidebar-foreground)]">
                    {user?.name || "User"}
                  </span>
                  <span className="block text-xs leading-tight text-[var(--sidebar-text-muted)]">
                    {formatRole(user?.role)}
                  </span>
                </span>
                <ChevronDown className="hidden h-4 w-4 text-[var(--sidebar-text-muted)] sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <span className="block truncate">{user?.name}</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  {formatRole(user?.role)}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function SuperAdminLayoutInner({ children }: HRMSAdminLayoutProps) {
  const { isCollapsed } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const baseUrl = API_URL.replace("/api", "");
  const isCaProxy = !!user?.isCaProxy;
  const accessDenied = isCaProxy && !isPayrollPath(location.pathname);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar className="h-screen shrink-0 relative z-50">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            {(user?.role?.toLowerCase() === "hrms-admin") ? (
              <img
                src="/hrms-logo.svg"
                alt="HRMS Logo"
                className={cn(
                  "h-8 w-8 object-contain rounded-md bg-white p-0.5",
                  isCollapsed && "mx-auto"
                )}
              />
            ) : user?.companyLogo ? (
              <img
                src={`${baseUrl}${user.companyLogo}`}
                alt="Company Logo"
                className={cn(
                  "h-8 w-8 object-contain rounded-md bg-white p-0.5",
                  isCollapsed && "mx-auto"
                )}
              />
            ) : (
              <div
                className={cn(
                  "h-8 w-8 flex items-center justify-center bg-blue-600 text-white rounded-md",
                  isCollapsed && "mx-auto"
                )}
              >
                <Building2 size={18} />
              </div>
            )}
            {!isCollapsed && (
              <div className="min-w-0">
                <SidebarTitle>HRMS Portal</SidebarTitle>
                <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-[var(--sidebar-text-muted)]">
                  {formatRole(user?.role) || "Portal"}
                </p>
              </div>
            )}
          </div>
          <SidebarToggle />
        </SidebarHeader>
        <SidebarContent className="space-y-4">
          {isCaProxy ? (
            <SidebarGroup label="Payroll">
              <SidebarNav>
                <SidebarNavItem to="/hrms/SuperAdmin/salary-structure" icon={IndianRupee}>
                  Salary Structure
                </SidebarNavItem>
                <SidebarNavItem to="/hrms/SuperAdmin/payroll/run" icon={PlayCircle}>
                  Payroll Run
                </SidebarNavItem>
                <SidebarNavItem to="/hrms/SuperAdmin/payslips" icon={FileText}>
                  Payslips
                </SidebarNavItem>
                <SidebarNavItem to="/hrms/SuperAdmin/statutory-reports" icon={FileBarChart}>
                  Statutory Reports
                </SidebarNavItem>
              </SidebarNav>
            </SidebarGroup>
          ) : (
            <>
          <SidebarGroup label="System Configuration">
            <SidebarNav>
              <SidebarNavItem to="/hrms/SuperAdmin/dashboard" icon={Building2}>
                Dashboard
              </SidebarNavItem>

              {user?.role === "superadmin" && (
                <SidebarNavItem to="/hrms/SuperAdmin/company-settings" icon={Settings}>
                  My Company
                </SidebarNavItem>
              )}

              {(user?.role === "hrms-admin" || user?.role === "HRMS-Admin") && (
                <SidebarNavItem to="/hrms/SuperAdmin/companies" icon={Building2}>
                  Companies
                </SidebarNavItem>
              )}

              <SidebarNavItem to="/hrms/SuperAdmin/branches" icon={MapPin}>
                Branches
              </SidebarNavItem>

              <SidebarNavItem to="/hrms/SuperAdmin/departments" icon={Users}>
                Departments
              </SidebarNavItem>

              <SidebarNavItem to="/hrms/SuperAdmin/designations" icon={Briefcase}>
                Designations
              </SidebarNavItem>

              <SidebarNavItem to="/hrms/SuperAdmin/cost-centers" icon={Wallet}>
                Cost Centers
              </SidebarNavItem>

              {(user?.role === "hrms-admin" || user?.role === "HRMS-Admin") && (
                <>
                  <SidebarNavItem to="/hrms/SuperAdmin/master-list" icon={List}>
                    Master List
                  </SidebarNavItem>
                  <SidebarNavItem to="/hrms/SuperAdmin/roles" icon={Shield}>
                    Roles
                  </SidebarNavItem>
                  <SidebarNavItem to="/hrms/SuperAdmin/audit-logs" icon={ClipboardList}>
                    Audit Logs
                  </SidebarNavItem>
                </>
              )}
              <SidebarNavItem to="/hrms/SuperAdmin/working-days" icon={Calendar}>
                Working Days
              </SidebarNavItem>

              <SidebarNavItem to="/hrms/SuperAdmin/policies" icon={ShieldCheck}>
                Company Policies
              </SidebarNavItem>

              <SidebarNavItem to="/hrms/SuperAdmin/billing" icon={Receipt}>
                Billing & Subscription
              </SidebarNavItem>

              {/* <SidebarNavItem
                to="/hrms/SuperAdmin/payroll-settings"
                icon={IndianRupee}
              >
                Payroll Settings
              </SidebarNavItem> */}
            </SidebarNav>
          </SidebarGroup>

          <SidebarGroup label="Data Management">
            <SidebarNav>
              <SidebarNavItem to="/hrms/SuperAdmin/data-management/import-export" icon={Boxes}>
                Import / Export Data
              </SidebarNavItem>
              <SidebarNavItem to="/hrms/SuperAdmin/data-management/hard-delete" icon={ShieldCheck}>
                Hard Delete
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>

          <SidebarGroup label="User and Roles">
            <SidebarNav>
              <SidebarNavItem to="/hrms/SuperAdmin/addUser" icon={Users}>
                Add Users
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>

          <SidebarGroup label="Employee Management">
            <SidebarNav>
              <SidebarNavItem to="/hrms/SuperAdmin/employees" icon={Users}>
                All Users
              </SidebarNavItem>
              <SidebarNavItem to="/hrms/SuperAdmin/letters" icon={NotebookPen}>
                Letters
              </SidebarNavItem>
              <SidebarNavItem to="/hrms/SuperAdmin/documents" icon={FileText}>
                Document Verification
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>

          <SidebarGroup label="Onboarding">
            <SidebarNav>
              <SidebarNavItem
                to="/hrms/SuperAdmin/onboarding/checklist"
                icon={ListChecks}
              >
                Onboarding Checklist
              </SidebarNavItem>
              <SidebarNavItem
                to="/hrms/SuperAdmin/onboarding/tasks"
                icon={ClipboardList}
              >
                Onboarding Tasks
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>

          <SidebarGroup label="Offboarding">
            <SidebarNav>
              <SidebarNavItem
                to="/hrms/SuperAdmin/offboarding/resignations"
                icon={LogOut}
              >
                Resignations
              </SidebarNavItem>
              <SidebarNavItem
                to="/hrms/SuperAdmin/offboarding/clearance"
                icon={Layers}
              >
                Clearance Workflow
              </SidebarNavItem>
              <SidebarNavItem
                to="/hrms/SuperAdmin/offboarding/full-final"
                icon={Receipt}
              >
                Full & Final Settlement
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>

          <SidebarGroup label="Attendance">
            <SidebarNav>
              <SidebarNavItem to="/hrms/SuperAdmin/attendance" icon={CalendarDays}>
                Attendance Records
              </SidebarNavItem>
              <SidebarNavItem to="/hrms/SuperAdmin/shifts" icon={Clock}>
                Shifts & Rosters
              </SidebarNavItem>
              <SidebarNavItem
                to="/hrms/SuperAdmin/attendance/requests"
                icon={ClipboardCheck}
              >
                Attendance Requests
              </SidebarNavItem>
              <SidebarNavItem to="/hrms/SuperAdmin/holidays" icon={Calendar}>
                Holidays
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>

          <SidebarGroup label="Leave Management">
            <SidebarNav>
              <SidebarNavItem to="/hrms/SuperAdmin/leaves" icon={Briefcase}>
                Leave Requests
              </SidebarNavItem>
              <SidebarNavItem
                to="/hrms/SuperAdmin/leave-encashment-requests"
                icon={Wallet}
              >
                Encashment Requests
              </SidebarNavItem>
              <SidebarNavItem
                to="/hrms/SuperAdmin/leave-override"
                icon={UserCog}
              >
                Override Balance
              </SidebarNavItem>
              <SidebarNavItem to="/hrms/SuperAdmin/leave-types" icon={Settings}>
                Leave Types & Rules
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>

          <SidebarGroup label="Payroll">
            <SidebarNav>
              <SidebarNavItem
                to="/hrms/SuperAdmin/salary-structure"
                icon={IndianRupee}
              >
                Salary Structure
              </SidebarNavItem>
              <SidebarNavItem to="/hrms/SuperAdmin/payroll/run" icon={PlayCircle}>
                Payroll Run
              </SidebarNavItem>
              <SidebarNavItem to="/hrms/SuperAdmin/payslips" icon={FileText}>
                Payslips
              </SidebarNavItem>
              <SidebarNavItem
                to="/hrms/SuperAdmin/statutory-reports"
                icon={FileBarChart}
              >
                Statutory Reports
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>

          <SidebarGroup label="Recruitment (ATS)">
            <SidebarNav>
              <SidebarNavItem to="/hrms/SuperAdmin/jobs" icon={Briefcase}>
                Job Openings
              </SidebarNavItem>
              <SidebarNavItem to="/hrms/SuperAdmin/candidates" icon={Users}>
                Candidates
              </SidebarNavItem>
              <SidebarNavItem to="/hrms/SuperAdmin/interviews" icon={GitBranch}>
                Interview Pipeline
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>

          <SidebarGroup label="Support & Escalations">
            <SidebarNav>
              <SidebarNavItem
                to="/hrms/SuperAdmin/raise-escalation"
                icon={AlertCircle}
              >
                Raise Escalation
              </SidebarNavItem>
              <SidebarNavItem
                to="/hrms/SuperAdmin/escalations"
                icon={ClipboardList}
              >
                Manage Tickets
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>
            </>
          )}
        </SidebarContent>

        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-[var(--sidebar-hover-bg)]",
                  isCollapsed && "justify-center"
                )}
              >
                <span className="relative shrink-0">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--sidebar-primary)] text-xs font-semibold text-white">
                    {initialsOf(user?.name)}
                  </span>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--sidebar)] bg-[var(--status-good)]" />
                </span>
                {!isCollapsed && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--sidebar-foreground)]">
                      {user?.name || "User"}
                    </span>
                    <span className="block truncate text-xs text-[var(--sidebar-text-muted)]">
                      {formatRole(user?.role)}
                    </span>
                  </span>
                )}
                {!isCollapsed && (
                  <ChevronDown className="h-4 w-4 shrink-0 text-[var(--sidebar-text-muted)]" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48">
              <DropdownMenuLabel>
                <span className="block truncate">{user?.name}</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  {formatRole(user?.role)}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <HeaderBar />

        <main className="flex-1 overflow-auto bg-[var(--background)] relative">
          {/* Main Content */}
          {accessDenied ? <CaProxyAccessDenied /> : children}

          {/* Subscription Expiration Overlay */}
          <SubscriptionOverlay />
        </main>
      </div>
    </div>
  );
}

export default function SuperAdminLayout({ children }: HRMSAdminLayoutProps) {
  return (
    <BranchFilterProvider>
      <SuperAdminLayoutInner>{children}</SuperAdminLayoutInner>
    </BranchFilterProvider>
  );
}
