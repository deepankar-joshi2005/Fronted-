import { Landmark, ChevronsLeft, ChevronsRight, LogOut, X } from "lucide-react";
import { useUiStore } from "../../store/uiStore.js";
import { useAuth } from "../../hooks/useAuth.js";
import { SIDEBAR_CONFIG } from "../../config/sidebarConfig.js";
import { ROLE_LABELS } from "../../config/roles.js";
import SidebarItem from "./SidebarItem.jsx";

export default function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleCollapsed = useUiStore((s) => s.toggleSidebarCollapsed);
  const mobileOpen = useUiStore((s) => s.mobileSidebarOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const { user, basePath, logout } = useAuth();

  const items = SIDEBAR_CONFIG[user?.role] || [];

  const content = (
    <div className="sidebar-gradient flex h-full flex-col border-r border-sidebar-border">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
          <Landmark size={18} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-white">Praxis</p>
            <p className="truncate text-[11px] text-sidebar-text-muted">{ROLE_LABELS[user?.role]}</p>
          </div>
        )}
        <button
          className="ml-auto rounded-lg p-1 text-sidebar-text-muted hover:text-white md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => (
          <SidebarItem
            key={item.path}
            to={item.path ? `${basePath}/${item.path}` : basePath}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            end={item.path === ""}
          />
        ))}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border px-3 py-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-white"
          title={collapsed ? "Log out" : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
        <button
          onClick={toggleCollapsed}
          className="hidden w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-white md:flex"
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={`sticky top-0 hidden h-svh shrink-0 md:block ${collapsed ? "w-20" : "w-64"}`}>
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64">{content}</aside>
        </div>
      )}
    </>
  );
}
