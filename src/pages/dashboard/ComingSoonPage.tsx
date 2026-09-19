import { useLocation } from "react-router-dom";
import { Hammer } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { SIDEBAR_CONFIG } from "../../config/sidebarConfig.js";
import EmptyState from "../../components/ui/EmptyState.jsx";

export default function ComingSoonPage() {
  const { user } = useAuth();
  const location = useLocation();

  const modules = SIDEBAR_CONFIG[user?.role] || [];
  const current = modules.find((m) => location.pathname.endsWith(`/${m.path}`) && m.path !== "");

  return (
    <div className="flex h-[70vh] items-center justify-center">
      <EmptyState
        icon={Hammer}
        title={`${current?.label || "This module"} is coming soon`}
        description="We're building this module next. Check back soon — it'll appear here as soon as it ships."
      />
    </div>
  );
}
