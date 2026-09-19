import * as React from "react"
import { cn } from "@/lib/utils"
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
  useSidebar
} from "@/components/ui/collapsible-sidebar"
import { HomeIcon, User, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/ui/logout-button"
import { Link } from "react-router-dom"

interface AdminSidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const { isCollapsed } = useSidebar()

  return (
    <Sidebar className={cn("", className)}>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <img
            src="/fancy-logo.jpg"
            alt="ThinkPro Logo"
            className="h-8 w-8 object-contain"
          />
          <SidebarTitle>Admin Panel</SidebarTitle>
        </div>
        <SidebarToggle />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup label="Dashboard">
          <SidebarNav>
            <SidebarNavItem to="/admin" icon={HomeIcon}>
              Dashboard
            </SidebarNavItem>
          </SidebarNav>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="space-y-1">
          {!isCollapsed ? (
            <>
              <Button variant="ghost" className="w-full justify-start text-sm">
                <User className="mr-3 h-4 w-4" />
                Profile
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="w-full">
                <User className="h-4 w-4" />
                <span className="sr-only">Profile</span>
              </Button>
            </>
          )}
        </div>
      </SidebarFooter>
      <SidebarFooter>
        <div className="flex flex-col gap-1">
          {!isCollapsed ? (
            <>
              {/* Enter HRMS */}
              <Link to="/hrms/Admin">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm bg-[#4b5563] hover:bg-[#374151]"
                >
                  <Users className="mr-3 h-4 w-4 text-white" />
                  <span className="text-white">Enter HRMS</span>
                </Button>
              </Link>

              <LogoutButton
                variant="ghost"
                className="w-full justify-start text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover-bg)]"
                isCollapsed={false}
              />
            </>
          ) : (
            <>
              <Link to="/hrms/Admin">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full bg-[#4b5563] hover:bg-[#374151]"
                >
                  <Users className="h-4 w-4 text-white" />
                  <span className="sr-only">Enter HRMS</span>
                </Button>
              </Link>

              <LogoutButton
                variant="ghost"
                size="icon"
                className="w-full justify-start text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover-bg)]"
                isCollapsed={true}
              />
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
