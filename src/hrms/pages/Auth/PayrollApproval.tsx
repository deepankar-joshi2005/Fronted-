/** @format */

// Public, unauthenticated page reached from the payroll owner-approval email
// link — sits alongside ResetPassword.tsx/Setup.tsx as a sibling route
// outside the authenticated /hrms/* shell (see AppRouter.tsx). Renders the
// exact same "Employee Payroll Entries" view HR sees, via a scoped,
// short-lived access token instead of a real HRMS login.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle2, Lock } from "lucide-react";
import PayrollEntriesView, { type PayrollEntryRow } from "../HRMS/Admin/Payroll/PayrollEntriesView";

const API_BASE = import.meta.env.VITE_API_URL;
const client = axios.create({ baseURL: `${API_BASE}/public/payroll-approval` });

const currency = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

const monthYearLabel = (month?: string) => {
  if (!month) return "";
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

interface Meta {
  companyName: string;
  month: string;
  expiresAt: string;
}

interface RunData {
  run: { month: string; title: string };
  summary: { employees: number; gross: number; deduction: number; net: number };
  entries: PayrollEntryRow[];
}

export default function PayrollApproval() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [linkError, setLinkError] = useState("");
  const [meta, setMeta] = useState<Meta | null>(null);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [data, setData] = useState<RunData | null>(null);
  const [dataError, setDataError] = useState("");

  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState("");
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!token) return;
    client
      .get(`/${token}`)
      .then(({ data }) => setMeta(data.data))
      .catch((err) => setLinkError(err.response?.data?.message || "This link is invalid or no longer active"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifyError("");
    if (!password) {
      setVerifyError("Password is required");
      return;
    }
    setVerifying(true);
    try {
      const { data } = await client.post(`/${token}/verify`, { password });
      setAccessToken(data.data.accessToken);
    } catch (err: any) {
      setVerifyError(err.response?.data?.message || "Incorrect password");
    } finally {
      setVerifying(false);
    }
  }

  useEffect(() => {
    if (!accessToken) return;
    client
      .get(`/${token}/data`, { headers: { "x-payroll-approval-token": accessToken } })
      .then(({ data }) => setData(data.data))
      .catch((err) => setDataError(err.response?.data?.message || "Failed to load payroll data"));
  }, [accessToken, token]);

  async function handleApprove() {
    if (!accessToken) return;
    setApproveError("");
    setApproving(true);
    try {
      await client.post(`/${token}/approve`, {}, { headers: { "x-payroll-approval-token": accessToken } });
      setApproved(true);
    } catch (err: any) {
      setApproveError(err.response?.data?.message || "Failed to approve payroll");
    } finally {
      setApproving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] p-4">
        <div className="h-6 w-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (linkError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] p-4">
        <Card className="w-full max-w-md border border-[var(--border)] bg-card">
          <CardHeader>
            <CardTitle className="text-center text-lg font-semibold">This link is no longer available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-[var(--muted-foreground)]">{linkError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] p-4">
        <Card className="w-full max-w-md border border-[var(--border)] bg-card">
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-[var(--status-good,theme(colors.green.500))]" />
            <p className="text-lg font-semibold">Payroll approved</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {monthYearLabel(meta?.month)} payroll for {meta?.companyName} is now processing. You can close this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: password gate — no financial data shown before this succeeds.
  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] p-4">
        <Card className="w-full max-w-md border border-[var(--border)] bg-card">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[color-mix(in_srgb,_var(--primary)_12%,_white)] text-[var(--primary)]">
              <Lock className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-semibold">Approve {monthYearLabel(meta?.month)} Payroll</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              for <strong className="text-[var(--foreground)]">{meta?.companyName}</strong> — enter your payroll
              approval password to review and approve.
            </p>
          </CardHeader>
          <CardContent>
            {verifyError && (
              <div className="mb-4 p-2.5 text-sm text-[var(--destructive)] bg-[color-mix(in_srgb,_var(--destructive)_12%,_white)] border border-[color-mix(in_srgb,_var(--destructive)_28%,_white)] rounded-md">
                {verifyError}
              </div>
            )}
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[var(--muted-foreground)]">
                  Payroll approval password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11" disabled={verifying}>
                {verifying ? "Verifying..." : "View Payroll"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: review + approve.
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)] bg-card px-4 py-4 sm:px-8">
        <h1 className="text-xl font-semibold">{monthYearLabel(meta?.month)} Payroll — {meta?.companyName}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Review each employee's pay before approving.</p>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
        {dataError && (
          <div className="p-2.5 text-sm text-[var(--destructive)] bg-[color-mix(in_srgb,_var(--destructive)_12%,_white)] border border-[color-mix(in_srgb,_var(--destructive)_28%,_white)] rounded-md">
            {dataError}
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card className="border border-[var(--border)] bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Employees</p>
                <p className="mt-1 text-lg font-semibold">{data.summary.employees}</p>
              </Card>
              <Card className="border border-[var(--border)] bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Gross Pay</p>
                <p className="mt-1 text-lg font-semibold">{currency(data.summary.gross)}</p>
              </Card>
              <Card className="border border-[var(--border)] bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Deductions</p>
                <p className="mt-1 text-lg font-semibold">{currency(data.summary.deduction)}</p>
              </Card>
              <Card className="border border-[var(--border)] bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Net Pay</p>
                <p className="mt-1 text-lg font-semibold">{currency(data.summary.net)}</p>
              </Card>
            </div>

            <PayrollEntriesView month={data.run.month} entries={data.entries} />

            {approveError && (
              <div className="p-2.5 text-sm text-[var(--destructive)] bg-[color-mix(in_srgb,_var(--destructive)_12%,_white)] border border-[color-mix(in_srgb,_var(--destructive)_28%,_white)] rounded-md">
                {approveError}
              </div>
            )}

            <div className="flex justify-end pb-8">
              <Button onClick={handleApprove} disabled={approving} className="h-11 px-6">
                {approving ? "Approving..." : "Approve Payroll"}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
