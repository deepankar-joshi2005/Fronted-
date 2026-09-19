import { Menu } from "lucide-react";
import { useUiStore } from "../../store/uiStore.js";
import { useAuth } from "../../hooks/useAuth.js";
import ThemeToggle from "./ThemeToggle.jsx";
import NotificationBell from "./NotificationBell.jsx";

export default function Topbar() {
  const setMobileOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const { user } = useAuth();
  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-sm sm:px-6">
      <button
        className="rounded-lg p-2 text-text-muted hover:bg-surface-2 md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      <ThemeToggle />
      <NotificationBell />

      <div className="flex items-center gap-2.5 border-l border-border pl-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
          {initial}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-tight text-heading">{user?.name}</p>
          <p className="text-xs leading-tight text-text-muted">{user?.email}</p>
        </div>
      </div>
    </header>
  );
}
