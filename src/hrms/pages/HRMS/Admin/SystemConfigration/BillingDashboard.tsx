/** @format */

import { useEffect, useState } from "react";
import {
  CreditCard,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Download,
  Users,
  Sprout,
  Building2,
  Crown,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "sonner";

import AdminBillingView from "./AdminBillingView";

interface BillingData {
  name: string;
  subscriptionPlan: "TRIAL" | "ACTIVE" | "EXPIRED";
  subscriptionStatus: "PENDING" | "PAID" | "OVERDUE";
  trialEndDate: string;
  subscriptionEndDate: string | null;
  employeeLimit: number;
  activeUserCount: number;
  subscriptionAmount: number;
  companyId: string;
  planTier?: string | null;
}

interface PlanTier {
  _id: string;
  name: string;
  minEmployees: number;
  maxEmployees: number | null;
  price: number;
}

interface PaymentHistory {
  _id: string;
  paymentId: string;
  orderId: string;
  amount: number;
  status: string;
  method: string;
  description: string;
  createdAt: string;
}

const TIER_ICONS = [Sprout, Users, Building2, Crown];

export default function BillingDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "hrms-admin";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-[var(--background)]">
      {isAdmin ? <AdminBillingView /> : <CompanyBillingView />}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone = "default" }: any) {
  const toneClasses = {
    default: "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]",
    good: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
    critical: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
  }[tone as "default" | "good" | "critical"];
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClasses}`}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-2xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
      {sub && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{sub}</p>}
    </div>
  );
}

function CompanyBillingView() {
  const { user, refreshUser } = useAuth();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [tiers, setTiers] = useState<PlanTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);
  const [payingTierId, setPayingTierId] = useState<string | null>(null);
  const [billingCycles, setBillingCycles] = useState<Record<string, "monthly" | "annual">>({});

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (document.getElementById("razorpay-sdk")) return resolve(true);
      const script = document.createElement("script");
      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/companies/${user?.companyId}`);
      setBilling(res.data);
    } catch (error) {
      toast.error("Failed to load billing information");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!user?.companyId) return;
    try {
      setHistoryLoading(true);
      const res = await axiosInstance.get(`/saas/history/${user.companyId}`);
      setHistory(res.data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchTiers = async () => {
    try {
      setTiersLoading(true);
      const res = await axiosInstance.get("/saas/plan-tiers");
      setTiers(res.data);
    } catch (error) {
      console.error("Failed to fetch plan tiers:", error);
    } finally {
      setTiersLoading(false);
    }
  };

  const handleDownloadInvoice = async (paymentId: string) => {
    try {
      toast.loading("Generating Invoice...", { id: "invoice-gen" });
      const response = await axiosInstance.get(`/saas/invoice/${paymentId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${paymentId.slice(-6)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Invoice downloaded successfully!", { id: "invoice-gen" });
    } catch (error) {
      toast.error("Failed to download invoice", { id: "invoice-gen" });
    }
  };

  function cycleFor(tierId: string) {
    return billingCycles[tierId] || "monthly";
  }
  function setCycleFor(tierId: string, cycle: "monthly" | "annual") {
    setBillingCycles((c) => ({ ...c, [tierId]: cycle }));
  }

  async function handlePickTier(tier: PlanTier) {
    if (!user?.companyId) return;
    setPayingTierId(tier._id);
    try {
      const ok = await loadRazorpay();
      if (!ok) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        setPayingTierId(null);
        return;
      }

      const billingCycle = cycleFor(tier._id);
      const orderRes = await axiosInstance.post("/saas/tier/create-order", {
        companyId: user.companyId,
        planTierId: tier._id,
        billingCycle,
      });
      const { id: order_id, amount, currency } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "HRMS",
        description: `${tier.name} plan (${billingCycle}) for ${user.name}`,
        image: "/hrms-logo.svg",
        order_id,
        handler: async (response: any) => {
          try {
            await axiosInstance.post("/saas/tier/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              companyId: user.companyId,
              planTierId: tier._id,
              billingCycle,
            });
            toast.success(`${tier.name} plan activated!`);
            await refreshUser();
            await fetchBillingInfo();
            await fetchHistory();
          } catch (err: any) {
            toast.error(err.response?.data?.message || "Payment verification failed");
          } finally {
            setPayingTierId(null);
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#2563eb" },
        modal: { ondismiss: () => setPayingTierId(null) },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to start payment");
      setPayingTierId(null);
    }
  }

  useEffect(() => {
    if (user?.companyId) {
      fetchHistory();
      fetchBillingInfo();
      fetchTiers();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!billing) return <div>No billing data found.</div>;

  const now = new Date();
  const isTrial = billing.subscriptionPlan === 'TRIAL';
  const expiryDate = isTrial ? new Date(billing.trialEndDate) : new Date(billing.subscriptionEndDate || billing.trialEndDate);
  const daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const employeeLimitLabel = billing.employeeLimit >= 999999 ? "Unlimited" : billing.employeeLimit;
  const atLimit = billing.employeeLimit > 0 && billing.employeeLimit < 999999 && billing.activeUserCount >= billing.employeeLimit;

  // Suggest the tier that actually fits this company's current headcount.
  const recommendedTier = tiers.find(
    (t) => billing.activeUserCount >= t.minEmployees && (t.maxEmployees === null || billing.activeUserCount <= t.maxEmployees)
  );
  const showRecommendation = recommendedTier && recommendedTier.name !== billing.planTier;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">Billing & Subscription</h1>
          <p className="text-[var(--muted-foreground)]">Manage your company's HRMS plan and payment history.</p>
        </div>
        <Button
          variant="outline"
          className="h-10 border-[var(--primary)] text-[var(--primary)]"
          onClick={() => history.length > 0 && handleDownloadInvoice(history[0]._id)}
          disabled={history.length === 0}
        >
          <Download size={16} className="mr-2" />
          Latest Invoice
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={ShieldCheck} label="Current Plan" value={billing.planTier || "No plan yet"} sub={billing.subscriptionPlan} />
        <StatCard
          icon={Users}
          label="Employees"
          value={`${billing.activeUserCount} / ${employeeLimitLabel}`}
          sub={atLimit ? "Limit reached — upgrade to add more" : "Active users in this company"}
          tone={atLimit ? "critical" : "good"}
        />
        <StatCard
          icon={Calendar}
          label={isTrial ? "Trial Days Left" : "Days Until Renewal"}
          value={daysRemaining}
          sub={`${isTrial ? "Trial" : "Plan"} ends ${expiryDate.toLocaleDateString()}`}
          tone={daysRemaining <= 7 ? "critical" : "default"}
        />
      </div>

      {showRecommendation && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--primary)]/30 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] p-4">
          <AlertCircle size={18} className="shrink-0 text-[var(--primary)]" />
          <p className="text-sm text-[var(--foreground)]">
            Your company has <span className="font-bold">{billing.activeUserCount}</span> employees — the{" "}
            <span className="font-bold">{recommendedTier!.name}</span> plan fits best.
          </p>
        </div>
      )}

      {/* Plan tiers */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">HRMS Plans</h2>
        {tiersLoading ? (
          <div className="flex justify-center py-10">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier, i) => {
              const isCurrent = tier.name === billing.planTier;
              const Icon = TIER_ICONS[i % TIER_ICONS.length];
              const cycle = cycleFor(tier._id);
              const displayPrice = cycle === "annual" ? tier.price * 12 : tier.price;
              return (
                <div
                  key={tier._id}
                  className={`flex flex-col gap-3 rounded-xl border bg-[var(--card)] p-4 ${
                    isCurrent ? "border-[var(--primary)] ring-1 ring-[var(--primary)]/30" : "border-[var(--border)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]">
                      <Icon size={18} />
                    </div>
                    {isCurrent && (
                      <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--primary)]">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-bold text-[var(--foreground)]">{tier.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      {tier.maxEmployees ? `${tier.minEmployees}-${tier.maxEmployees} employees` : `${tier.minEmployees}+ employees`}
                    </p>
                  </div>

                  <div className="flex rounded-lg bg-[var(--muted)] p-1 text-xs font-medium">
                    {(["monthly", "annual"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCycleFor(tier._id, c)}
                        className={`flex-1 rounded-md py-1.5 transition-colors ${
                          cycle === c ? "bg-[var(--card)] text-[var(--primary)] shadow-sm" : "text-[var(--muted-foreground)]"
                        }`}
                      >
                        {c === "monthly" ? "Monthly" : "Yearly"}
                      </button>
                    ))}
                  </div>

                  <p className="text-xl font-bold text-[var(--foreground)]">
                    ₹{displayPrice.toLocaleString("en-IN")}
                    <span className="text-xs font-medium text-[var(--muted-foreground)]"> {cycle === "annual" ? "/year" : "/month"}</span>
                  </p>

                  <Button className="mt-1 h-9" disabled={payingTierId === tier._id} onClick={() => handlePickTier(tier)}>
                    {payingTierId === tier._id ? "Processing..." : isCurrent ? "Renew" : "Select & Pay"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment History */}
      <Card className="border-none shadow-xl">
         <CardHeader>
            <CardTitle className="text-xl font-bold">Recent Billing History</CardTitle>
            <CardDescription>View and download your previous monthly statements.</CardDescription>
         </CardHeader>
         <CardContent>
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : history.length > 0 ? (
              <div className="rounded-md border border-[var(--border)] overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <TableCell className="font-medium whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-[var(--muted-foreground)]">
                          {item.paymentId}
                        </TableCell>
                        <TableCell className="capitalize text-xs font-medium">
                          {item.method}
                        </TableCell>
                        <TableCell className="font-bold">
                          ₹{item.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                            item.status === 'CAPTURED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:text-[var(--primary)]"
                            onClick={() => handleDownloadInvoice(item._id)}
                            title="Download Invoice"
                          >
                            <Download size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3 grayscale opacity-40">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <CreditCard size={32} />
                </div>
                <p className="font-bold text-slate-500">No payment history available yet</p>
                <p className="text-sm text-slate-400">Billing records will appear here after your first transaction.</p>
              </div>
            )}
         </CardContent>
      </Card>
    </div>
  );
}
