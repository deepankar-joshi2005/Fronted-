import { Link, Outlet } from "react-router-dom";
import { Landmark } from "lucide-react";
import ThemeToggle from "../components/layout/ThemeToggle.jsx";

export default function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white">
              <Landmark size={18} />
            </div>
            <span className="text-lg font-bold text-heading">Praxis</span>
          </Link>

          <div className="flex-1" />

          <ThemeToggle className="hidden sm:inline-flex" />
          <Link
            to="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-text transition-colors hover:text-brand"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-fg shadow-md shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/35"
          >
            Start free trial
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <div className="flex items-center gap-2 text-sm font-semibold text-heading">
            <Landmark size={16} className="text-brand" />
            Praxis
          </div>
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} Praxis. Practice management for Chartered Accountants.
          </p>
        </div>
      </footer>
    </div>
  );
}
