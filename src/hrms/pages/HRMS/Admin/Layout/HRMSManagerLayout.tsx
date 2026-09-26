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
  Users,
  CalendarDays,
  ClipboardList,
  CheckCircle,
  Clock,
  Receipt,
  Plane,
  UserCog,
  Target,
  BarChart3,
  Star,
  GitBranch,
  LayoutDashboard,
  Building2,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  User,
  Wallet,
  FileUp,
  FileText,
  Mail,
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
  if (!name) return "M";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "M";
}

function formatRole(role?: string | null) {
  if (!role) return "Manager";
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
          {formatRole(user?.role) || "Manager Portal"}
        </h1>

        <div className="ml-auto flex items-center gap-1 sm:gap-3">
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

          <button
            type="button"
            onClick={() => navigate("/hrms/manager/leave-calendar")}
            title="Holiday calendar"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--sidebar-foreground)] transition-colors hover:bg-[var(--sidebar-hover-bg)]"
          >
            <CalendarDays className="h-5 w-5" />
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

function HRMSManagerLayoutInner({ children }: Props) {
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
                  {formatRole(user?.role) || "Manager"}
                </p>
              </div>
            )}
          </div>
          <SidebarToggle />
        </SidebarHeader>

        {/* 🔥 PROPER SPACING LIKE ADMIN */}
        <SidebarContent className="space-y-4">
          {/* Dashboard — standalone link, no group/expand */}
          <SidebarNavItem to="/hrms/manager/dashboard" icon={LayoutDashboard}>
            Dashboard
          </SidebarNavItem>

          <CollapsibleSidebarGroup
            label="Team"
            icon={Users}
            paths={[
              "/hrms/manager/team",
              "/hrms/manager/team-attendance",
              "/hrms/manager/leave-calendar",
              "/hrms/manager/leaves",
              "/hrms/manager/performance/metrics",
            ]}
          >
            <SidebarNavItem to="/hrms/manager/team" icon={Users}>
              Team Members
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/manager/team-attendance" icon={CalendarDays}>
              Team Attendance
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/manager/leave-calendar" icon={ClipboardList}>
              Holiday Calendar
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/manager/leaves" icon={CheckCircle}>
              Leaves Employee
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/manager/performance/metrics" icon={BarChart3}>
              Performance Metrics
            </SidebarNavItem>
          </CollapsibleSidebarGroup>

          <CollapsibleSidebarGroup
            label="Approvals"
            icon={ClipboardList}
            paths={[
              "/hrms/manager/approvals/leaves",
              "/hrms/manager/approvals/attendance",
              "/hrms/manager/approvals/overtime",
              "/hrms/manager/approvals/expenses",
              "/hrms/manager/approvals/travel",
              "/hrms/manager/approvals/profile-updates",
            ]}
          >
            <SidebarNavItem to="/hrms/manager/approvals/leaves" icon={ClipboardList}>
              Leave Requests
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/manager/approvals/attendance" icon={Clock}>
              Attendance Corrections
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/manager/approvals/overtime" icon={Clock}>
              Overtime Requests
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/manager/approvals/expenses" icon={Receipt}>
              Expense / Reimbursement
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/manager/approvals/travel" icon={Plane}>
              Travel Requests
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/manager/approvals/profile-updates" icon={UserCog}>
              Profile Update Requests
            </SidebarNavItem>
          </CollapsibleSidebarGroup>

          <CollapsibleSidebarGroup
            label="Performance"
            icon={Target}
            paths={["/hrms/manager/performance/goals", "/hrms/manager/performance/appraisals", "/hrms/manager/performance/feedback"]}
          >
            <SidebarNavItem to="/hrms/manager/performance/goals" icon={Target}>
              Goals / OKRs
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/manager/performance/appraisals" icon={BarChart3}>
              Appraisals
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/manager/performance/feedback" icon={Star}>
              Feedback & Ratings
            </SidebarNavItem>
          </CollapsibleSidebarGroup>

          <CollapsibleSidebarGroup label="Recruitment" icon={GitBranch} paths={["/hrms/manager/interviews"]}>
            <SidebarNavItem to="/hrms/manager/interviews" icon={GitBranch}>
              Interview Feedback
            </SidebarNavItem>
          </CollapsibleSidebarGroup>

          <CollapsibleSidebarGroup
            label="Self Service"
            icon={User}
            paths={[
              "/hrms/self-service/profile",
              "/hrms/self-service/attendance",
              "/hrms/self-service/leave",
              "/hrms/self-service/payroll",
              "/hrms/self-service/documents",
              "/hrms/self-service/requests",
              "/hrms/self-service/letters",
            ]}
          >
            <SidebarNavItem to="/hrms/self-service/profile" icon={User}>
              My Profile
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/self-service/attendance" icon={Clock}>
              My Attendance
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/self-service/leave" icon={ClipboardList}>
              My Leave Request
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/self-service/payroll" icon={Wallet}>
              My Payroll
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/self-service/documents" icon={FileUp}>
              My Documents
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/self-service/requests" icon={FileText}>
              My Requests
            </SidebarNavItem>
            <SidebarNavItem to="/hrms/self-service/letters" icon={Mail}>
              My Letters
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

export default function HRMSManagerLayout({ children }: Props) {
  return (
    <BranchFilterProvider>
      <HRMSManagerLayoutInner>{children}</HRMSManagerLayoutInner>
    </BranchFilterProvider>
  );
}

