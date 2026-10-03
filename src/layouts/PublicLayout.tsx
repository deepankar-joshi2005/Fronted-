import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ThemeToggle from "../components/layout/ThemeToggle.jsx";
import { LogoMark, BRAND_NAME } from "../components/ui/Logo.jsx";

const NAV_LINKS = [
  { label: "Features", href: "/#modules" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Help", href: "mailto:support@ledgerly.app" },
];

export default function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-[#f8faff] dark:bg-[#0a0b12] text-slate-800 dark:text-slate-100 transition-colors">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <LogoMark className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{BRAND_NAME}</span>
          </Link>

          <nav className="ml-8 hidden items-center gap-7 text-sm font-medium md:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive
                  ? "text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
              }
            >
              Home
            </NavLink>
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-slate-600 dark:text-slate-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex-1" />

          <div className="hidden sm:inline-flex items-center">
            <ThemeToggle />
          </div>
          <Link
            to="/login"
            className="whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:text-blue-600 dark:hover:text-blue-400 sm:px-4"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/35 sm:px-5"
          >
            Start Free Trial <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <div className="flex items-center gap-2.5 text-base font-bold text-slate-900 dark:text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <LogoMark className="h-4 w-4" />
            </div>
            {BRAND_NAME}
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
            <Link to="/" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
              Home
            </Link>
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <p className="text-xs text-slate-500 dark:text-slate-400">© 2025 {BRAND_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
