import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.js";
import { setAccessToken } from "../../api/axiosClient.js";
import * as authApi from "../../api/auth.api.js";
import { getRoleBasePath } from "../../config/roles.js";
import { BUSINESS_CLIENT_ROLES, HRMS_BASE_PATH, redirectToHrms } from "../../utils/hrmsSso.js";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Deliberately not using the authStore's login() action here — it marks
      // isAuthenticated=true immediately, which makes the /login route's
      // GuestOnly guard redirect to the CA-Management dashboard before we've had
      // a chance to check the role and hand off to HRMS instead. So: log in raw
      // first, decide where this role actually belongs, and only touch the
      // shared auth state once we know we're staying in CA-Management.
      const { data } = await authApi.login({ email: form.email, password: form.password });

      // No CA-Management account exists for this email at all — it belongs to
      // an employee (Manager, Finance, IT Admin, ...) an HR Admin added directly
      // inside HRMS. The backend already verified the password there.
      if (data.data.hrmsRedirect) {
        window.location.href = `${HRMS_BASE_PATH}/sso?token=${encodeURIComponent(data.data.hrmsToken)}`;
        return;
      }

      const user = data.data.user;
      setAccessToken(data.data.accessToken);

      if (BUSINESS_CLIENT_ROLES.includes(user.role)) {
        // HRMS not provisioned/reachable yet — fall through to the normal
        // CA-Management landing page, which has its own "Open HRMS" retry.
        const redirected = await redirectToHrms();
        if (redirected) return;
      }

      useAuthStore.setState({ user, isAuthenticated: true });
      const redirectTo = location.state?.from?.pathname || getRoleBasePath(user.role);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}
      <Input
        label="Email address"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        placeholder="you@firm.com"
      />
      <Input
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        required
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        placeholder="••••••••"
      />
      <Button type="submit" variant="brand" size="lg" loading={loading} className="mt-2 w-full">
        Log in
      </Button>
    </form>
  );
}
