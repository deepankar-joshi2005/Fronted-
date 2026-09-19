import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HomeIcon, Settings, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  playlists: string[];
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-[var(--sidebar-foreground)]">
            ThinkPro LMS
          </h2>
          <div className="space-y-1">
            <NavLink to="/dashboard">
              <Button variant="secondary" className="w-full justify-start">
                <HomeIcon className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </NavLink>
            <NavLink to="/users">
              <Button variant="ghost" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Users
              </Button>
            </NavLink>
            <NavLink to="/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}
