import { NavLink } from "react-router-dom";

export default function SidebarItem({ to, icon: Icon, label, collapsed, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "sidebar-active-gradient text-white shadow-md"
            : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
        }`
      }
      title={collapsed ? label : undefined}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}
