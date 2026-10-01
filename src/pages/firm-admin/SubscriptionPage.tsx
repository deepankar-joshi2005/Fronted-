import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Calendar, Wallet, Receipt, History, Sprout, Users, Building2 } from "lucide-react";
import * as caFirmApi from "../../api/caFirm.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Table from "../../components/ui/Table.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Modal from "../../components/ui/Modal.jsx";
import DateRangeFilter from "../../components/ui/DateRangeFilter.jsx";
import useResettablePage from "../../hooks/useResettablePage.js";

const PAGE_SIZE = 15;

const PLAN_BADGE = { trial: "brand", active: "success", suspended: "danger", expired: "neutral" };
const TIER_LABELS = { starter: "Starter", growth: "Growth", enterprise: "Enterprise" };
const TIER_BLURB = {
  starter: "Solo practitioners and small firms just getting started.",
  growth: "Mid-sized firms with a growing team and client base.",
  enterprise: "Large firms — highest limits, dedicated support.",
};
const TIER_ICONS = { starter: Sprout, growth: Users, enterprise: Building2 };

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-sdk")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function StatCard({ icon: Icon, label, value, sub, accentBg = "bg-brand-soft", accentText = "text-brand" }) {
  return (
    <Card className="p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentBg} ${accentText}`}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-2xl font-bold text-heading">{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
      {sub && <p className="mt-1 text-xs text-text-muted">{sub}</p>}
    </Card>
  );
}

const PAYMENT_STATUS_BADGE = { PENDING: "warning", CAPTURED: "success", FAILED: "danger" };

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [firmPlan, setFirmPlan] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyMeta, setHistoryMeta] = useState({ total: 0, totalPages: 1 });
  const [historySummary, setHistorySummary] = useState({ totalPaid: 0, successfulCount: 0 });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ preset: "all", startDate: "", endDate: "" });
  const [page, setPage] = useResettablePage(`${dateRange.startDate}|${dateRange.endDate}`);
  const [loading, setLoading] = useState(true);
  const [payingTier, setPayingTier] = useState(null);
  const [payError, setPayError] = useState({ tier: null, message: "" });
  const [paidDone, setPaidDone] = useState(false);
  const [billingCycles, setBillingCycles] = useState({ starter: "monthly", growth: "monthly", enterprise: "monthly" });

  function setCycleFor(tier, cycle) {
    setBillingCycles((c) => ({ ...c, [tier]: cycle }));
  }

  async function handlePay(tier) {
    const billingCycle = billingCycles[tier] || "monthly";
    setPayError({ tier: null, message: "" });
    setPayingTier(tier);
    try {
      const ok = await loadRazorpayScript();
      if (!ok) throw new Error("Could not load Razorpay — check your internet connection");

      const { data } = await caFirmApi.createSubscriptionOrder({ tier, billingCycle });
      const { orderId, amount: orderAmount, currency: orderCurrency, keyId, firmName } = data.data;

      const options = {
        key: keyId,
        amount: orderAmount,
        currency: orderCurrency,
        name: "Praxis",
        description: `${TIER_LABELS[tier]} plan (${billingCycle}) for ${firmName}`,
        order_id: orderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#2452c9" },
        handler: async (response) => {
          try {
            await caFirmApi.verifySubscriptionPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setPaidDone(true);
            load();
            loadHistory();
          } catch (err) {
            setPayError({ tier, message: err.response?.data?.message || "Payment verification failed" });
          } finally {
            setPayingTier(null);
          }
        },
        modal: { ondismiss: () => setPayingTier(null) },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err) {
      setPayError({ tier, message: err.response?.data?.message || err.message || "Could not start payment" });
      setPayingTier(null);
    }
  }

  async function load() {
    const [planRes, catalogRes] = await Promise.all([caFirmApi.getMyFirmPlan(), caFirmApi.getPlanCatalog()]);
    setFirmPlan(planRes.data.data);
    setCatalog(catalogRes.data.data);
    setLoading(false);
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const params: any = { page, limit: PAGE_SIZE };
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      const { data } = await caFirmApi.getSubscriptionPaymentHistory(params);
      setHistory(data.data);
      setHistoryMeta(data.meta || { total: data.data.length, totalPages: 1 });
      if (data.summary) setHistorySummary(data.summary);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, dateRange.startDate, dateRange.endDate]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  const currentTier = firmPlan?.plan?.tier;
  const expiryDate = firmPlan?.plan?.expiryDate ? new Date(firmPlan.plan.expiryDate) : null;
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const totalPaid = historySummary.totalPaid;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <CreditCard size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-heading">Subscription</h1>
          <p className="mt-1 text-sm text-text-muted">Your current plan, available tiers, and payment history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet} label="Current Plan" value={TIER_LABELS[currentTier] || "—"} sub={firmPlan?.plan?.status} />
        <StatCard
          icon={Calendar}
          label="Days Until Expiry"
          value={daysLeft !== null ? Math.max(daysLeft, 0) : "—"}
          sub={expiryDate ? `Expires ${expiryDate.toLocaleDateString()}` : "No active plan"}
          accentBg={daysLeft !== null && daysLeft <= 7 ? "bg-danger-bg" : "bg-brand-soft"}
          accentText={daysLeft !== null && daysLeft <= 7 ? "text-danger" : "text-brand"}
        />
        <StatCard
          icon={Receipt}
          label="Total Paid"
          value={`${catalog.currency} ${totalPaid.toLocaleString("en-IN")}`}
          sub={`${historySummary.successfulCount} successful payment(s)`}
          accentBg="bg-success-bg"
          accentText="text-success"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Object.entries(catalog.tiers).map(([tier, info]) => {
          const isCurrentTier = tier === currentTier;
          const isActive = isCurrentTier && firmPlan?.plan?.status === "active";
          const TierIcon = TIER_ICONS[tier];
          const cycle = billingCycles[tier] || "monthly";
          const displayPrice = cycle === "annual" ? info.price * 12 : info.price;
          return (
            <Card
              key={tier}
              className={`flex flex-col gap-4 p-5 ${isCurrentTier ? "border-brand ring-1 ring-brand/30" : ""}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <TierIcon size={20} />
                  </div>
                  {isCurrentTier && <Badge variant="brand">Current Plan</Badge>}
                </div>
                <h3 className="mt-3 text-base font-bold text-heading">{TIER_LABELS[tier]}</h3>
                <p className="mt-1 text-sm text-text-muted">{TIER_BLURB[tier]}</p>
              </div>

              <div className="flex rounded-lg bg-surface-2 p-1 text-xs font-medium">
                {[
                  { value: "monthly", label: "Monthly" },
                  { value: "annual", label: "Yearly" },
                ].map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCycleFor(tier, c.value)}
                    className={`flex-1 rounded-md py-1.5 transition-colors ${
                      cycle === c.value ? "bg-surface text-brand shadow-sm" : "text-text-muted hover:text-text"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <p className="text-2xl font-bold text-heading">
                {catalog.currency} {displayPrice.toLocaleString("en-IN")}
                <span className="text-sm font-medium text-text-muted">{cycle === "annual" ? " /year" : " /month"}</span>
              </p>

              <ul className="flex flex-1 flex-col gap-2 text-sm text-text">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-success" />
                  {info.seatLimit ? `Up to ${info.seatLimit} staff seats` : "Unlimited staff seats"}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-success" />
                  {info.businessClientLimit ? `Up to ${info.businessClientLimit} business clients` : "Unlimited business clients"}
                </li>
              </ul>

              {payError.tier === tier && (
                <p className="text-xs text-danger">{payError.message}</p>
              )}

              <Button
                variant={isActive ? "secondary" : isCurrentTier ? "brand" : "primary"}
                disabled={isActive}
                loading={payingTier === tier}
                onClick={() => handlePay(tier)}
              >
                {isActive ? "Your current plan" : isCurrentTier ? "Activate Now" : "Pay & Activate"}
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-text-muted" />
            <h2 className="text-lg font-semibold text-heading">Payment history</h2>
          </div>
          <DateRangeFilter
            preset={dateRange.preset}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
          />
        </div>
        {historyLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size={24} />
          </div>
        ) : history.length === 0 ? (
          <EmptyState icon={History} title="No payments found" description="Try adjusting the date range, or check back after your first payment." />
        ) : (
          <Table
            columns={[
              { key: "createdAt", label: "Date", render: (p) => new Date(p.createdAt).toLocaleDateString() },
              { key: "tier", label: "Plan", render: (p) => TIER_LABELS[p.tier] },
              { key: "billingCycle", label: "Billing", render: (p) => <span className="capitalize">{p.billingCycle}</span> },
              { key: "amount", label: "Amount", render: (p) => `${p.currency} ${p.amount.toLocaleString("en-IN")}` },
              {
                key: "status",
                label: "Status",
                render: (p) => <Badge variant={PAYMENT_STATUS_BADGE[p.status] || "neutral"}>{p.status}</Badge>,
              },
            ]}
            data={history}
            keyField="_id"
            pagination={{ page, totalPages: historyMeta.totalPages, total: historyMeta.total, limit: PAGE_SIZE, onChange: setPage }}
          />
        )}
      </div>

      {paidDone && (
        <Modal open onClose={() => setPaidDone(false)} title="Plan activated">
          <p className="text-sm text-text-muted">Your payment was successful and your new plan is active.</p>
          <div className="mt-5 flex justify-end">
            <Button onClick={() => setPaidDone(false)}>Done</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
