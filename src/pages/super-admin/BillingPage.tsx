import { useEffect, useState } from "react";
import { Wallet, TrendingUp, Building2 } from "lucide-react";
import * as billingApi from "../../api/billing.api.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";

const TIER_LABELS = { starter: "Starter", growth: "Growth", enterprise: "Enterprise" };
const STATUS_LABELS = { trial: "Trial", active: "Active", suspended: "Suspended", expired: "Expired" };
const STATUS_BADGE = { trial: "brand", active: "success", suspended: "danger", expired: "neutral" };

function formatCurrency(amount, currency) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default function BillingPage() {
  const [data, setData] = useState(null);
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([billingApi.getBillingSummary(), billingApi.listFirmBilling()])
      .then(([summaryRes, firmsRes]) => {
        setData(summaryRes.data.data);
        setFirms(firmsRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">Billing</h1>
        <p className="mt-1 text-sm text-text-muted">Licence revenue across every CA firm on the platform.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <TrendingUp size={20} />
          </div>
          <p className="mt-4 text-2xl font-bold text-heading">
            {formatCurrency(data.estimatedMonthlyRevenue, data.currency)}
          </p>
          <p className="text-sm text-text-muted">Estimated monthly revenue (active firms)</p>
        </Card>
        <Card className="p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Building2 size={20} />
          </div>
          <p className="mt-4 text-2xl font-bold text-heading">{data.totalFirms}</p>
          <p className="text-sm text-text-muted">Total CA firms</p>
        </Card>
        <Card className="p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Wallet size={20} />
          </div>
          <p className="mt-4 text-2xl font-bold text-heading">
            {formatCurrency(data.pricing.starter, data.currency)} / {formatCurrency(data.pricing.growth, data.currency)}
          </p>
          <p className="text-sm text-text-muted">Starter / Growth monthly price</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-heading">Firms by plan tier</h2>
          <ul className="flex flex-col gap-3">
            {Object.entries(data.byTier).map(([tier, count]) => (
              <li key={tier} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium text-text">{TIER_LABELS[tier]}</span>
                <span className="text-sm font-semibold text-heading">{count}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-heading">Firms by licence status</h2>
          <ul className="flex flex-col gap-3">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium text-text">{STATUS_LABELS[status]}</span>
                <span className="text-sm font-semibold text-heading">{count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-heading">Firm subscriptions</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="px-4 py-3 font-semibold text-text-muted">Firm</th>
                <th className="px-4 py-3 font-semibold text-text-muted">Plan</th>
                <th className="px-4 py-3 font-semibold text-text-muted">Status</th>
                <th className="px-4 py-3 font-semibold text-text-muted">Billing</th>
                <th className="px-4 py-3 font-semibold text-text-muted">Expires</th>
                <th className="px-4 py-3 font-semibold text-text-muted">Last payment</th>
              </tr>
            </thead>
            <tbody>
              {firms.map((firm) => (
                <tr key={firm._id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-text">{firm.name}</td>
                  <td className="px-4 py-3 text-text">{TIER_LABELS[firm.plan.tier]}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE[firm.plan.status] || "neutral"}>{STATUS_LABELS[firm.plan.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text capitalize">{firm.plan.billingCycle}</td>
                  <td className="px-4 py-3 text-text">
                    {firm.plan.expiryDate ? new Date(firm.plan.expiryDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-text">
                    {firm.lastPayment
                      ? `${firm.lastPayment.currency} ${firm.lastPayment.amount.toLocaleString("en-IN")} on ${new Date(
                          firm.lastPayment.createdAt
                        ).toLocaleDateString()}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {firms.length === 0 && <p className="px-4 py-8 text-center text-sm text-text-muted">No firms yet.</p>}
        </div>
      </div>
    </div>
  );
}
