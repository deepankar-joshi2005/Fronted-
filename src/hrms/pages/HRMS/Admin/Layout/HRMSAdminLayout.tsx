/** @format */

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarNav,
  SidebarNavItem,
  SidebarTitle,
  SidebarToggle,
  SidebarGroup,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/collapsible-sidebar";

import {
  LayoutDashboard,
  Laptop,
  IdCard,
  Armchair,
  Car,
  Boxes,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  Building2,
  Settings,
} from "lucide-react";

import { LogoutButton } from "@/components/ui/logout-button";
import { useAuth } from "@/contexts/AuthContext";
import { CRMHeaderUserInfo } from "@/components/crm/CRMHeaderUserInfo";
import { cn } from "@/lib/utils";
import SubscriptionOverlay from "@/components/SubscriptionOverlay";
import { API_URL } from "@/api/axiosInstance";

interface Props {
  children: React.ReactNode;
}

export default function HRMSAdminLayout({ children }: Props) {
  const { isCollapsed } = useSidebar();
  const { user } = useAuth();
  const baseUrl = API_URL.replace("/api", "");

  return (
    <div className="flex h-screen">
      {/* ================= SIDEBAR ================= */}
      <Sidebar className="h-screen">
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
            {!isCollapsed && <SidebarTitle>HRMS Admin</SidebarTitle>}
          </div>
          <SidebarToggle />
        </SidebarHeader>

        {/* ================= CONTENT ================= */}
        <SidebarContent className="space-y-4">
          {/* 📊 Dashboard */}
          <SidebarGroup label="Dashboard">
            <SidebarNav>
              <SidebarNavItem to="/hrms/admin/dashboard" icon={LayoutDashboard}>
                Overview
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>

          {/* 🧾 Admin Onboarding */}
          <SidebarGroup label="Onboarding (Admin)">
            <SidebarNav>
              <SidebarNavItem
                to="/hrms/admin/onboarding/workstation"
                icon={Laptop}
              >
                Workstation / Desk Allocation
              </SidebarNavItem>

              <SidebarNavItem
                to="/hrms/admin/onboarding/id-card"
                icon={IdCard}
              >
                ID Card & Access Card
              </SidebarNavItem>

              <SidebarNavItem
                to="/hrms/admin/onboarding/locker"
                icon={Armchair}
              >
                Locker / Cabin Assignment
              </SidebarNavItem>

              <SidebarNavItem
                to="/hrms/admin/onboarding/transport"
                icon={Car}
              >
                Transport / Parking
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>

          {/* 🏢 Facility & Asset Support */}
          <SidebarGroup label="Facility & Asset Support">
            <SidebarNav>
              <SidebarNavItem
                to="/hrms/admin/assets/non-it"
                icon={Boxes}
              >
                Non-IT Asset Inventory
              </SidebarNavItem>

              <SidebarNavItem
                to="/hrms/admin/assets/stationery"
                icon={PackageCheck}
              >
                Stationery & Safety Kits
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>

          {/* 🚪 Offboarding & Admin Clearance */}
          <SidebarGroup label="Offboarding & Clearance">
            <SidebarNav>
              <SidebarNavItem
                to="/hrms/admin/offboarding/id-return"
                icon={IdCard}
              >
                ID Card Return
              </SidebarNavItem>

              <SidebarNavItem
                to="/hrms/admin/offboarding/workstation"
                icon={RefreshCcw}
              >
                Workstation Clearance
              </SidebarNavItem>

              <SidebarNavItem
                to="/hrms/admin/offboarding/assets"
                icon={Boxes}
              >
                Asset Return Verification
              </SidebarNavItem>

              <SidebarNavItem
                to="/hrms/admin/offboarding/final-clearance"
                icon={ShieldCheck}
              >
                Final Admin Clearance
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>
          {/* Data Management */}
          <SidebarGroup label="Data Management">
            <SidebarNav>
              <SidebarNavItem
                to="/hrms/SuperAdmin/data-management/import-export"
                icon={Boxes}
              >
                Import / Export Data
              </SidebarNavItem>
              <SidebarNavItem
                to="/hrms/SuperAdmin/data-management/hard-delete"
                icon={ShieldCheck}
              >
                Hard Delete
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>

          {/* ⚙️ System Configuration */}
          <SidebarGroup label="System Configuration">
            <SidebarNav>
              <SidebarNavItem to="/hrms/admin/company-settings" icon={Settings}>
                Company Settings
              </SidebarNavItem>
            </SidebarNav>
          </SidebarGroup>
        </SidebarContent>

        {/* ================= FOOTER ================= */}
        <SidebarFooter>
          <LogoutButton
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "w-full justify-start text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover-bg)]",
              isCollapsed && "justify-center"
            )}
            isCollapsed={isCollapsed}
          />
        </SidebarFooter>
      </Sidebar>

      {/* ================= MAIN AREA ================= */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4 relative z-40">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <SidebarToggle className="text-gray-700 hover:bg-gray-100" />
            </div>
            <CRMHeaderUserInfo name={user?.name} role="Admin" />
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50 relative">
          {children}
          <SubscriptionOverlay />
        </main>
      </div>
    </div>
  );
}
