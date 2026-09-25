/** @format */

import { useLocation, Navigate } from "react-router-dom";
import { GraduationCap, LogOut, AlertTriangle } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarNavItem,
  SidebarTitle,
  SidebarToggle,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/collapsible-sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
}

function initialsOf(name?: string | null) {
  if (!name) return "T";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "T";
}

function TrainingLayoutInner({ children }: Props) {
  const { isCollapsed } = useSidebar();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar className="h-screen shrink-0 relative z-50">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-8 w-8 flex items-center justify-center bg-[var(--sidebar-primary)] text-white rounded-md",
                isCollapsed && "mx-auto"
              )}
            >
              <GraduationCap size={18} />
            </div>
            {!isCollapsed && <SidebarTitle>Training</SidebarTitle>}
          </div>
          <SidebarToggle />
        </SidebarHeader>

        <SidebarContent>
          <SidebarNavItem to="/hrms/training" icon={GraduationCap}>
            My Training
          </SidebarNavItem>
        </SidebarContent>

        <SidebarFooter>
          <div className={cn("flex items-center gap-2.5 rounded-lg p-2", isCollapsed && "justify-center")}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--sidebar-primary)] text-xs font-semibold text-white">
              {initialsOf(user?.name)}
            </span>
            {!isCollapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[var(--sidebar-foreground)]">
                  {user?.name || "User"}
                </span>
                <span className="block truncate text-xs text-[var(--sidebar-text-muted)]">Trainee</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              "mt-1 flex w-full items-center gap-2 rounded-lg p-2 text-sm text-[var(--sidebar-text-muted)] transition-colors hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-foreground)]",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && "Logout"}
          </button>
        </SidebarFooter>
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-[var(--sidebar)] border-b border-[var(--sidebar-border)] px-4 sm:px-6 py-3 relative z-40">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <SidebarToggle className="text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover-bg)]" />
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              You are under training. Please complete your training to access other modules.
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[var(--background)] relative">{children}</main>
      </div>
    </div>
  );
}

export default function TrainingLayout({ children }: Props) {
  const location = useLocation();
  // A trainee may still have a stale bookmark/URL from before they were
  // flagged — keep them confined to the training area regardless.
  if (!location.pathname.startsWith("/hrms/training")) {
    return <Navigate to="/hrms/training" replace />;
  }
  return <TrainingLayoutInner>{children}</TrainingLayoutInner>;
}
