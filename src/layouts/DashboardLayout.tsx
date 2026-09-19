import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar.jsx";
import Topbar from "../components/layout/Topbar.jsx";
import FirmLockedScreen from "../components/layout/FirmLockedScreen.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { ROLES } from "../config/roles.js";
import * as caFirmApi from "../api/caFirm.api.js";

// Only Tier 2 (CA Firm) users are gated on their firm's subscription status — Tier 3
// business clients must keep HRMS access even if the parent firm's licence lapses.
const GATED_ROLES = [ROLES.CA_FIRM_ADMIN, ROLES.CA_FIRM_STAFF];

// Always reachable even when locked — a suspended/expired firm still needs a way to
// renew and to ask for help.
const ALWAYS_ALLOWED_PATHS = ["subscription", "support"];

// Expiry alone doesn't lock a firm out — there's a 7-day grace period (full
// functionality, renewal banner only) before read-only kicks in. The backend
// computes that window and tells us via isReadOnly, so this only needs to read
// that flag rather than re-deriving it from plan.status here.
function getLockReason(firmPlan) {
  if (!firmPlan || !firmPlan.isReadOnly) return null;
  if (firmPlan.isActive === false || firmPlan.plan?.status === "suspended") return "suspended";
  return "expired";
}

export default function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [firmPlan, setFirmPlan] = useState(null);
  const [checking, setChecking] = useState(GATED_ROLES.includes(user?.role));

  useEffect(() => {
    if (!GATED_ROLES.includes(user?.role)) {
      setChecking(false);
      return;
    }
    setChecking(true);
    caFirmApi
      .getMyFirmPlan()
      .then(({ data }) => setFirmPlan(data.data))
      .finally(() => setChecking(false));
  }, [user?.role]);

  const isAlwaysAllowedPath = ALWAYS_ALLOWED_PATHS.some((path) => location.pathname.endsWith(`/${path}`));
  const lockReason = isAlwaysAllowedPath ? null : getLockReason(firmPlan);

  return (
    <div className="flex min-h-svh bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6">
          {checking ? (
            <div className="flex justify-center py-20">
              <Spinner size={28} />
            </div>
          ) : lockReason ? (
            <FirmLockedScreen reason={lockReason} firmName={firmPlan.firmName} />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
