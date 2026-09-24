/** @format */

import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarNav,
  SidebarNavItem,
  SidebarTitle,
  SidebarToggle,
  SidebarGroup,
  CollapsibleSidebarGroup,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/collapsible-sidebar";

import {
  User,
  FileUp,
  Building2,
  CalendarDays,
  Clock,
  ClipboardList,
  Wallet,
  Receipt,
  Target,
  FileText,
  LayoutDashboard,
  LogOut,
  UserCog,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import SubscriptionOverlay from "@/components/SubscriptionOverlay";
import { API_URL } from "@/api/axiosInstance";
import { BranchFilterProvider } from "@/contexts/BranchFilterContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  children: React.ReactNode;
}

function initialsOf(name?: string | null) {
  if (!name) return "E";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "E";
}

function formatRole(role?: string | null) {
  if (!role) return "Employee";
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
          {formatRole(user?.role) || "Employee Portal"}
        </h1>

        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Dark Mode (Click for Light Mode)" : "Light Mode (Click for Dark Mode)"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--sidebar-foreground)] transition-colors hover:bg-[var(--sidebar-hover-bg)]"
          >
            {theme === "dark" ? (
              <Moon className="h-5 w-5 text-white" />
            ) : (
              <Sun className="h-5 w-5 text-white" />
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate("/hrms/employee/leave/balance")}
            title="Leave Balance"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--sidebar-foreground)] transition-colors hover:bg-[var(--sidebar-hover-bg)]"
          >
            <Wallet className="h-5 w-5" />
          </button>

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

function HRMSEmployeeLayoutInner({ children }: Props) {
  const { isCollapsed } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const baseUrl = API_URL.replace("/api", "");

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ================= SIDEBAR ================= */}
      <Sidebar className="h-screen shrink-0 relative z-50">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            {user?.role?.toLowerCase() === "hrms-admin" ? (
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
                  {formatRole(user?.role) || "Employee"}
                </p>
              </div>
            )}
          </div>
          <SidebarToggle />
        </SidebarHeader>

        <SidebarContent className="space-y-4">
          {/* Dashboard — standalone link, no group/expand */}
          <SidebarNavItem to="/hrms/employee/dashboard" icon={LayoutDashboard}>
            Dashboard
          </SidebarNavItem>

          <CollapsibleSidebarGroup
            label="My Profile"
            icon={User}
            paths={["/hrms/employee/profile/personal", "/hrms/employee/profile/documents", "/hrms/employee/profile/organization"]}
          >
            <SidebarNavItem to="/hrms/employee/profile/personal" icon={User}>
              Personal Information
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/employee/profile/documents" icon={FileUp}>
              Document Upload
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/employee/profile/organization" icon={Building2}>
              Organizational Info
            </SidebarNavItem>
          </CollapsibleSidebarGroup>

          <CollapsibleSidebarGroup
            label="Attendance"
            icon={Clock}
            paths={[
              "/hrms/employee/attendance/mark",
              "/hrms/employee/attendance/calendar",
              "/hrms/employee/attendance/requests",
              "/hrms/employee/attendance/shift-schedule",
            ]}
          >
            <SidebarNavItem to="/hrms/employee/attendance/mark" icon={Clock}>
              Mark Attendance
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/employee/attendance/calendar" icon={CalendarDays}>
              Attendance Calendar
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/employee/attendance/requests" icon={ClipboardList}>
              Attendance Requests
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/employee/attendance/shift-schedule" icon={CalendarDays}>
              Shift and Schedule
            </SidebarNavItem>
          </CollapsibleSidebarGroup>

          <CollapsibleSidebarGroup label="Leave" icon={ClipboardList} paths={["/hrms/employee/leave/balance", "/hrms/employee/leave/apply"]}>
            <SidebarNavItem to="/hrms/employee/leave/balance" icon={Wallet}>
              Leave Balance
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/employee/leave/apply" icon={ClipboardList}>
              Apply Leave
            </SidebarNavItem>
          </CollapsibleSidebarGroup>

          <CollapsibleSidebarGroup
            label="Payroll"
            icon={Wallet}
            paths={["/hrms/employee/payroll/payslips", "/hrms/employee/payroll/salary-structure"]}
          >
            <SidebarNavItem to="/hrms/employee/payroll/payslips" icon={FileText}>
              Payslips
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/employee/payroll/salary-structure" icon={Wallet}>
              Salary Structure
            </SidebarNavItem>
          </CollapsibleSidebarGroup>

          <CollapsibleSidebarGroup label="Expenses" icon={Receipt} paths={["/hrms/employee/expenses/submit"]}>
            <SidebarNavItem to="/hrms/employee/expenses/submit" icon={Receipt}>
              Submit Expense
            </SidebarNavItem>
          </CollapsibleSidebarGroup>

          <CollapsibleSidebarGroup
            label="Requests"
            icon={ClipboardList}
            paths={[
              "/hrms/employee/request/my-requests",
              "/hrms/employee/request/resign",
              "/hrms/employee/request/overtime",
              "/hrms/employee/request/profileUpdate",
              "/hrms/employee/request/leave-encashment",
            ]}
          >
            <SidebarNavItem to="/hrms/employee/request/my-requests" icon={ClipboardList}>
              My Travel Requests
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/employee/request/resign" icon={LogOut}>
              My Resign Requests
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/employee/request/overtime" icon={Clock}>
              Overtime Requests
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/employee/request/profileUpdate" icon={UserCog}>
              Profile Update Requests
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/employee/request/leave-encashment" icon={Wallet}>
              Leave Encashment
            </SidebarNavItem>
          </CollapsibleSidebarGroup>

          <CollapsibleSidebarGroup
            label="Performance"
            icon={Target}
            paths={["/hrms/employee/performance/goals", "/hrms/employee/performance/self-appraisal", "/hrms/employee/performance/history"]}
          >
            <SidebarNavItem to="/hrms/employee/performance/goals" icon={Target}>
              My Goals
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/employee/performance/self-appraisal" icon={ClipboardList}>
              Self Appraisal
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/employee/performance/history" icon={FileText}>
              Performance History
            </SidebarNavItem>
          </CollapsibleSidebarGroup>

          <CollapsibleSidebarGroup label="Letters & Documents" icon={FileText} paths={["/hrms/employee/letters"]}>
            <SidebarNavItem to="/hrms/employee/letters" icon={FileText}>
              Download Letter
            </SidebarNavItem>
          </CollapsibleSidebarGroup>
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

      {/* ================= MAIN AREA ================= */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <HeaderBar />

        <main className="flex-1 overflow-auto bg-[var(--background)] relative">
          {children}
          <SubscriptionOverlay />
        </main>
      </div>
    </div>
  );
}

export default function HRMSEmployeeLayout({ children }: Props) {
  return (
    <BranchFilterProvider>
      <HRMSEmployeeLayoutInner>{children}</HRMSEmployeeLayoutInner>
    </BranchFilterProvider>
  );
}
