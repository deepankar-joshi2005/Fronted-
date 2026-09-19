import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { Eye, EyeOff } from "lucide-react";
import { forgotPassword } from "@/api/authService";

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Redirect authenticated users to their role-based dashboard
  useEffect(() => {
    if (!loading && user) {
      const roleRouteMap: { [key: string]: string } = {
        superadmin: "/hrms/SuperAdmin/dashboard",
        "HRMS-Admin": "/hrms/SuperAdmin/dashboard",
        leadmentor: "/leadmentor",
        schooladmin: "/schooladmin",
        admin: "/hrms/admin/dashboard",
        mentor: "/hrms/employee/dashboard",
        employee: "/hrms/employee/dashboard",
        student: "/student",
        guest: "/guest",
        "it-admin": "/hrms/it/dashboard",
        "sales-manager": "/crm/sales-manager",
        "sales-executive": "/crm/sales-executive",
        "hr-admin": "/hrms/SuperAdmin/dashboard",
        "manager": "/hrms/manager/dashboard",
        "finance": "/hrms/finance/dashboard",
        "auditor": "/hrms/auditor/dashboard",
      };

      const route = roleRouteMap[user.role] || "/login";
      navigate(route, { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await axiosInstance.post("/auth/login", {
        email,
        password,
      });
      login(res.data.user, res.data.token); // save user + token
      const roleRouteMap: { [key: string]: string } = {
        superadmin: "/hrms/SuperAdmin/dashboard",
        "HRMS-Admin": "/hrms/SuperAdmin/dashboard",
        leadmentor: "/leadmentor",
        schooladmin: "/schooladmin",
        admin: "/hrms/admin/dashboard",
        Admin: "/admin",
        mentor: "/hrms/employee/dashboard",
        employee: "/hrms/employee/dashboard",
        student: "/student",
        guest: "/guest",
        "IT-Admin": "/hrms/it/dashboard",
        "it-admin": "/hrms/it/dashboard",
        "sales-manager": "/crm/sales-manager",
        "sales-executive": "/crm/sales-executive",
        "hr-admin": "/hrms/SuperAdmin/dashboard",
        "manager": "/hrms/manager/dashboard",
        "finance": "/hrms/finance/dashboard",
        "auditor": "/hrms/auditor/dashboard",
      };
      const dest = roleRouteMap[res.data.user.role] || "/login";
      navigate(dest, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    setShowGuestForm(false);
    setError("");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingReset(true);
    setError("");

    try {
      await forgotPassword({ email: forgotPasswordEmail });
      setResetSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
    setResetSent(false);
    setError("");
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="force-light-theme min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[var(--muted-foreground)]">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="force-light-theme h-screen flex flex-col lg:flex-row bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--primary)] selection:text-white overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--stem-technology)] relative overflow-hidden">
        {/* Background Mesh/Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--stem-technology)] via-[color-mix(in_srgb,_var(--stem-technology)_80%,_var(--soft-engineering))] to-[var(--soft-science)] opacity-60"></div>

        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full blur-xl bg-[var(--soft-engineering)]"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full blur-2xl bg-[var(--soft-science)]"></div>
        <div className="absolute top-1/2 left-10 w-24 h-24 rounded-full blur-lg bg-[var(--soft-mathematics)]"></div>

        {/* Content */}
        <div className="mx-auto relative z-10 flex flex-col justify-center items-center text-center p-12">
          <div className="mb-8">
            <div className="w-[240px] h-[240px] rounded-full backdrop-blur-sm shadow-2xl flex items-center justify-center mb-6 bg-[color-mix(in_srgb,_white_16%,_transparent)]">
              <img
                src="/hrms-logo.svg"
                alt="HRMS"
                className="w-[200px] h-[200px] object-cover rounded-full"
              />
            </div>
          </div>
          <p className="text-4xl font-bold text-[var(--sidebar-foreground)] mb-4">
            Welcome to HRMS
          </p>
          <p className="text-xl text-[color-mix(in_srgb,_white_88%,_transparent)] mb-8 max-w-md">
            Streamline your workforce with smart employee management, payroll automation, and real-time insights — all in one platform.
          </p>
          <div className="flex items-center space-x-4 text-[color-mix(in_srgb,_white_80%,_transparent)]">
            <div className="w-2 h-2 rounded-full bg-[color-mix(in_srgb,_white_60%,_transparent)]"></div>
            <span>Employee Management</span>
            <div className="w-2 h-2 rounded-full bg-[color-mix(in_srgb,_white_60%,_transparent)]"></div>
            <span>Payroll & Attendance</span>
            <div className="w-2 h-2 rounded-full bg-[color-mix(in_srgb,_white_60%,_transparent)]"></div>
            <span>Easy to Use</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="relative w-full lg:w-1/2 h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[var(--background)] overflow-hidden">
        {/* Ambient glow orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary)] opacity-[0.06] blur-[140px] rounded-full -mr-48 -mt-48 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--soft-science)] opacity-[0.07] blur-[130px] rounded-full -ml-40 -mb-40 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--soft-engineering)] opacity-[0.04] blur-[100px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6 sm:mb-8">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 rounded-full shadow-lg flex items-center justify-center bg-[var(--stem-technology)]">
              <img
                src="/hrms-logo.svg"
                alt="HRMS"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-full"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-2">
              Welcome to HRMS
            </h1>
            <p className="text-sm sm:text-base text-[var(--muted-foreground)]">
              Sign in to your account
            </p>
          </div>

          {!showGuestForm ? (
            /* ── Modern Premium Login Card ── */
            <div
              style={{
                background: "var(--card)",
                border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))",
                borderRadius: "1.25rem",
                boxShadow:
                  "0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 60px -10px color-mix(in srgb, var(--primary) 12%, transparent), 0 0 0 1px color-mix(in srgb, var(--primary) 6%, transparent)",
                overflow: "hidden",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Card top accent bar */}
              <div
                style={{
                  height: "3px",
                  background: "linear-gradient(90deg, var(--stem-technology), var(--soft-engineering), var(--soft-science))",
                }}
              />

              <div className="px-6 sm:px-8 pt-5 sm:pt-6 pb-5 sm:pb-6">
                {/* Header */}
                <div className="text-center mb-5">
                  <div
                    className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3 shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, var(--stem-technology), var(--soft-engineering))",
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  </div>
                  <h2
                    className="text-xl sm:text-2xl font-bold mb-1"
                    style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
                  >
                    Welcome back
                  </h2>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    Sign in to your HRMS account to continue
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-3.5">
                  {/* Email field */}
                  <div className="space-y-1">
                    <label
                      htmlFor="email"
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Email / Login ID
                    </label>
                    <div className="relative group">
                      <span
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </span>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email or login ID"
                        required
                        style={{
                          width: "100%",
                          height: "44px",
                          paddingLeft: "42px",
                          paddingRight: "16px",
                          background: "color-mix(in srgb, var(--primary) 4%, var(--background))",
                          border: "1.5px solid color-mix(in srgb, var(--primary) 15%, var(--border))",
                          borderRadius: "0.75rem",
                          fontSize: "0.875rem",
                          color: "var(--foreground)",
                          outline: "none",
                          transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "var(--primary)";
                          e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--primary) 14%, transparent)";
                          e.target.style.background = "color-mix(in srgb, var(--primary) 6%, var(--background))";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "color-mix(in srgb, var(--primary) 15%, var(--border))";
                          e.target.style.boxShadow = "none";
                          e.target.style.background = "color-mix(in srgb, var(--primary) 4%, var(--background))";
                        }}
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="space-y-1">
                    <label
                      htmlFor="password"
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Password
                    </label>
                    <div className="relative">
                      <span
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        style={{
                          width: "100%",
                          height: "44px",
                          paddingLeft: "42px",
                          paddingRight: "48px",
                          background: "color-mix(in srgb, var(--primary) 4%, var(--background))",
                          border: "1.5px solid color-mix(in srgb, var(--primary) 15%, var(--border))",
                          borderRadius: "0.75rem",
                          fontSize: "0.875rem",
                          color: "var(--foreground)",
                          outline: "none",
                          transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "var(--primary)";
                          e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--primary) 14%, transparent)";
                          e.target.style.background = "color-mix(in srgb, var(--primary) 6%, var(--background))";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "color-mix(in srgb, var(--primary) 15%, var(--border))";
                          e.target.style.boxShadow = "none";
                          e.target.style.background = "color-mix(in srgb, var(--primary) 4%, var(--background))";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 focus:outline-none transition-colors duration-200"
                        style={{ color: "var(--muted-foreground)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot password */}
                  <div className="flex justify-end -mt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs font-semibold transition-all duration-200 hover:underline underline-offset-2"
                      style={{ color: "var(--primary)" }}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Error */}
                  {error && (
                    <div
                      className="flex items-start gap-2.5 p-3 rounded-xl text-sm"
                      style={{
                        background: "color-mix(in srgb, var(--destructive) 8%, var(--background))",
                        border: "1px solid color-mix(in srgb, var(--destructive) 25%, transparent)",
                        color: "var(--destructive)",
                      }}
                    >
                      <svg className="mt-0.5 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {error}
                    </div>
                  )}

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative w-full overflow-hidden font-semibold text-white transition-all duration-300 focus:outline-none"
                    style={{
                      height: "46px",
                      borderRadius: "0.85rem",
                      background: isSubmitting
                        ? "color-mix(in srgb, var(--primary) 70%, transparent)"
                        : "linear-gradient(135deg, var(--stem-technology) 0%, var(--soft-engineering) 60%, var(--soft-science) 100%)",
                      boxShadow: isSubmitting
                        ? "none"
                        : "0 4px 15px color-mix(in srgb, var(--primary) 35%, transparent), 0 1px 3px rgba(0,0,0,0.12)",
                      fontSize: "0.95rem",
                      letterSpacing: "0.01em",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      border: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow =
                          "0 6px 20px color-mix(in srgb, var(--primary) 45%, transparent), 0 2px 6px rgba(0,0,0,0.15)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "0 4px 15px color-mix(in srgb, var(--primary) 35%, transparent), 0 1px 3px rgba(0,0,0,0.12)";
                    }}
                  >
                    {/* shimmer overlay */}
                    {!isSubmitting && (
                      <span
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                          backgroundSize: "200% 100%",
                          animation: "shimmer 2.5s infinite",
                        }}
                      />
                    )}
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2.5">
                        <span
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          style={{ animation: "spin 0.7s linear infinite" }}
                        />
                        Signing in…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Sign In
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    New to HRMS?
                  </span>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                </div>

                {/* Register Company Button */}
                <button
                  onClick={() => navigate("/register")}
                  className="w-full font-semibold transition-all duration-200 focus:outline-none"
                  style={{
                    height: "46px",
                    borderRadius: "0.85rem",
                    background: "transparent",
                    border: "1.5px solid color-mix(in srgb, var(--primary) 30%, var(--border))",
                    color: "var(--primary)",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in srgb, var(--primary) 7%, transparent)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--primary) 10%, transparent)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "color-mix(in srgb, var(--primary) 30%, var(--border))";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                  }}
                >
                  🏢 Register Your Company
                </button>

                {/* shimmer keyframes */}
                <style>{`
                  @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                  }
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            </div>
          ) : (
            /* Guest Form */
            <Card className="shadow-xl border border-[var(--border)] bg-card">
              <CardHeader className="space-y-1 pb-4 sm:pb-6 px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold text-[var(--foreground)]">
                    Guest Access
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToLogin}
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-sm sm:text-base touch-manipulation"
                  >
                    ← Back
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="text-center space-y-4">
                  <p className="text-sm sm:text-base text-[var(--muted-foreground)]">
                    Register as a guest to explore our platform and access
                    promotional content.
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={() => navigate("/guest/register")}
                      className="w-full h-10 sm:h-11 bg-[var(--primary)] hover:bg-[var(--accent)] text-[var(--primary-foreground)] font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base touch-manipulation"
                    >
                      Register as Guest
                    </Button>

                    {/* Google Sign In Button */}
                    <GoogleAuthButton
                      onClick={() =>
                      (window.location.href = `${import.meta.env.VITE_API_URL ||
                        "/api"
                        }/auth/google`)
                      }
                      disabled={isSubmitting}
                      text="Continue with Google"
                    />

                    <div className="text-xs sm:text-sm text-gray-500">
                      Already have a guest account?{" "}
                      <button
                        onClick={() => navigate("/guest/login")}
                        className="text-[var(--primary)] hover:text-[var(--accent)] font-medium touch-manipulation"
                      >
                        Sign in here
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Forgot Password Dialog */}
          <Dialog open={showForgotPassword} onOpenChange={handleCloseForgotPassword}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Enter your email address and we'll send you a link to reset your password.
                </DialogDescription>
              </DialogHeader>
              {resetSent ? (
                <div className="space-y-4">
                  <div className="p-4 text-sm text-[var(--muted-foreground)] bg-[color-mix(in_srgb,_var(--primary)_8%,_white)] border border-[color-mix(in_srgb,_var(--primary)_20%,_white)] rounded-md">
                    <p className="font-medium text-[var(--foreground)] mb-2">
                      Check your email
                    </p>
                    <p>
                      If an account exists with this email, a password reset link has been sent.
                      Please check your inbox and follow the instructions to reset your password.
                    </p>
                    <p className="mt-2 text-xs">
                      The link will expire in 1 hour.
                    </p>
                  </div>
                  <Button
                    onClick={handleCloseForgotPassword}
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  {error && (
                    <div className="p-2 text-xs sm:text-sm text-[var(--destructive)] bg-[color-mix(in_srgb,_var(--destructive)_12%,_white)] border border-[color-mix(in_srgb,_var(--destructive)_28%,_white)] rounded-md">
                      {error}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseForgotPassword}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSendingReset}
                      className="flex-1"
                    >
                      {isSendingReset ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-[var(--primary-foreground)] border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
