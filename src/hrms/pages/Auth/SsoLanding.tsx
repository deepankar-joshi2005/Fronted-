import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import axiosInstance from "@/api/axiosInstance";

// Reached with ?token=... from CA-Management right after it verifies a Business
// Client Admin/Employee's password — this page trades that token for a full
// session here (same shape as a normal login) and drops the user straight into
// their dashboard, with no second login screen.
const ROLE_ROUTE_MAP: Record<string, string> = {
  superadmin: "/hrms/SuperAdmin/dashboard",
  "HRMS-Admin": "/hrms/SuperAdmin/dashboard",
  admin: "/hrms/admin/dashboard",
  Admin: "/admin",
  mentor: "/hrms/employee/dashboard",
  employee: "/hrms/employee/dashboard",
  "IT-Admin": "/hrms/it/dashboard",
  "it-admin": "/hrms/it/dashboard",
  "hr-admin": "/hrms/SuperAdmin/dashboard",
  manager: "/hrms/manager/dashboard",
  finance: "/hrms/finance/dashboard",
  auditor: "/hrms/auditor/dashboard",
};

export default function SsoLanding() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Missing SSO token");
      return;
    }

    const redirect = searchParams.get("redirect");

    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    axiosInstance
      .get("/auth/me")
      .then((res) => {
        login(res.data.user, token);
        navigate(redirect || ROLE_ROUTE_MAP[res.data.user.role] || "/login", { replace: true });
      })
      .catch(() => {
        setError("This sign-in link is invalid or has expired.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[var(--background)] text-[var(--foreground)]">
      {error ? (
        <>
          <p className="text-sm text-[var(--destructive)]">{error}</p>
          <button onClick={() => navigate("/login")} className="text-sm underline">
            Go to login
          </button>
        </>
      ) : (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          <p className="text-sm text-[var(--muted-foreground)]">Signing you in…</p>
        </>
      )}
    </div>
  );
}
