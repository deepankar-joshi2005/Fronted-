import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Home,
  Puzzle,
  Calendar,
  CreditCard,
  LogOut,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface GuestSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export default function GuestSidebar({ collapsed, onToggle, isMobile = false }: GuestSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    {
      name: "Home",
      path: "/guest",
      icon: Home,
    },
    {
      name: "Resources",
      path: "/guest/resources",
      icon: BookOpen,
    },
    {
      name: "Quizzes & Puzzles",
      path: "/guest/quizzes",
      icon: Puzzle,
    },
    {
      name: "Online Classes",
      path: "/guest/classes",
      icon: Calendar,
    },
    {
      name: "Premium Videos",
      path: "/guest/premium",
      icon: CreditCard,
    },
    {
      name: "Profile",
      path: "/guest/profile",
      icon: User,
    },
  ];

  return (
    <div className={`${isMobile ? 'w-full' : collapsed ? 'w-16' : 'w-64'} bg-white shadow-lg border-r border-gray-200 h-full flex flex-col transition-all duration-300 ease-in-out relative`}>
      {/* Toggle Button - Only show on desktop */}
      {!isMobile && (
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className={`absolute top-4 z-10 bg-white border-gray-300 hover:bg-gray-50 ${
            collapsed ? 'right-2' : 'right-2'
          }`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      )}

      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src="/fancy-logo.jpg"
            alt="ThinkPro LMS"
            className="w-10 h-10 object-contain rounded-full"
          />
          {(!collapsed || isMobile) && (
            <div>
              <h2 className="font-semibold text-gray-900">ThinkPro LMS</h2>
              <p className="text-sm text-gray-500">Guest Portal</p>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-green-600" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  onClick={isMobile ? onToggle : undefined}
                  title={collapsed && !isMobile ? item.name : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "text-gray-700 hover:bg-gray-100"
                  } ${collapsed && !isMobile ? 'justify-center' : ''}`}
                >
                  <Icon className="h-5 w-5" />
                  {(!collapsed || isMobile) && item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={handleLogout}
          variant="outline"
          title={collapsed && !isMobile ? "Sign Out" : undefined}
          className={`w-full gap-3 text-gray-700 hover:text-red-600 hover:border-red-200 ${
            collapsed && !isMobile ? 'justify-center px-2' : 'justify-start'
          }`}
        >
          <LogOut className="h-4 w-4" />
          {(!collapsed || isMobile) && "Sign Out"}
        </Button>
      </div>
    </div>
  );
}
