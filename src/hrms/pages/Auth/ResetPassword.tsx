import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { resetPasswordWithToken } from "@/api/authService";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid reset link");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await resetPasswordWithToken({ token, newPassword: password });
      setSuccess(true);
      toast.success("Password reset successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to reset password. The link may have expired.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] p-4">
      <Card className="w-full max-w-md shadow-xl border border-[var(--border)] bg-card">
        <CardHeader className="space-y-1 pb-4 sm:pb-6 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold text-center text-[var(--foreground)]">
            {success ? "Password Reset Successful!" : "Reset Your Password"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="p-4 text-sm text-[var(--muted-foreground)] bg-[color-mix(in_srgb,_var(--primary)_8%,_white)] border border-[color-mix(in_srgb,_var(--primary)_20%,_white)] rounded-md">
                <p className="font-medium text-[var(--foreground)] mb-2">
                  ✅ Password reset successfully!
                </p>
                <p>
                  Your password has been reset. You can now log in with your new password.
                </p>
                <p className="mt-2 text-xs">
                  Redirecting to login page...
                </p>
              </div>
              <Button
                onClick={() => navigate("/login")}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-2 sm:p-3 text-xs sm:text-sm text-[var(--destructive)] bg-[color-mix(in_srgb,_var(--destructive)_12%,_white)] border border-[color-mix(in_srgb,_var(--destructive)_28%,_white)] rounded-md mb-4">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-xs sm:text-sm font-medium text-[var(--muted-foreground)]"
                  >
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 sm:h-11 text-sm sm:text-base pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Password must be at least 6 characters long
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-xs sm:text-sm font-medium text-[var(--muted-foreground)]"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-10 sm:h-11 text-sm sm:text-base pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200 focus:outline-none"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-10 sm:h-11 bg-[var(--primary)] hover:bg-[var(--accent)] text-[var(--primary-foreground)] font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base touch-manipulation"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-[var(--primary-foreground)] border-t-transparent rounded-full animate-spin"></div>
                      <span>Resetting password...</span>
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate("/login")}
                  className="text-xs sm:text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-200"
                >
                  Back to Login
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

