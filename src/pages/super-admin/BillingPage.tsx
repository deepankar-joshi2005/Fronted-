import { useEffect, useState } from "react";
import { Wallet, TrendingUp, Building2 } from "lucide-react";
import * as billingApi from "../../api/billing.api.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Input from "../../components/ui/Input.jsx";
import Table from "../../components/ui/Table.jsx";
import DateRangeFilter from "../../components/ui/DateRangeFilter.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import useDebouncedValue from "../../hooks/useDebouncedValue.js";
import useResettablePage from "../../hooks/useResettablePage.js";

const TIER_LABELS = { starter: "Starter", growth: "Growth", enterprise: "Enterprise" };
const STATUS_LABELS = { trial: "Trial", active: "Active", suspended: "Suspended", expired: "Expired" };
const STATUS_BADGE = { trial: "brand", active: "success", suspended: "danger", expired: "neutral" };
const PAGE_SIZE = 15;

function formatCurrency(amount, currency) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default function BillingPage() {
  const [data, setData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [firms, setFirms] = useState([]);
  const [firmsLoading, setFirmsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [dateRange, setDateRange] = useState({ preset: "all", startDate: "", endDate: "" });
  const [page, setPage] = useResettablePage(`${debouncedSearch}|${dateRange.startDate}|${dateRange.endDate}`);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    billingApi
      .getBillingSummary()
      .then(({ data }) => setData(data.data))
      .finally(() => setSummaryLoading(false));
  }, []);

  useEffect(() => {
    setFirmsLoading(true);
    const params: any = { page, limit: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (dateRange.startDate) params.startDate = dateRange.startDate;
    if (dateRange.endDate) params.endDate = dateRange.endDate;
    billingApi
      .listFirmBilling(params)
      .then(({ data }) => {
        setFirms(data.data);
        setMeta(data.meta || { total: data.data.length, totalPages: 1 });
      })
      .finally(() => setFirmsLoading(false));
  }, [page, debouncedSearch, dateRange.startDate, dateRange.endDate]);

  if (summaryLoading) {
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

        <Card className="mb-4 flex flex-wrap items-end gap-3 p-4">
          <div className="w-full max-w-sm">
            <Input label="Search" placeholder="Search by firm name..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <DateRangeFilter
            preset={dateRange.preset}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
          />
        </Card>

        {firmsLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : firms.length === 0 ? (
          <EmptyState icon={Building2} title="No firms found" description="Try adjusting your search or date range." />
        ) : (
          <Table
            columns={[
              { key: "name", label: "Firm" },
              { key: "tier", label: "Plan", render: (firm) => TIER_LABELS[firm.plan.tier] },
              {
                key: "status",
                label: "Status",
                render: (firm) => <Badge variant={STATUS_BADGE[firm.plan.status] || "neutral"}>{STATUS_LABELS[firm.plan.status]}</Badge>,
              },
              { key: "billingCycle", label: "Billing", render: (firm) => <span className="capitalize">{firm.plan.billingCycle}</span> },
              {
                key: "expiryDate",
                label: "Expires",
                render: (firm) => (firm.plan.expiryDate ? new Date(firm.plan.expiryDate).toLocaleDateString() : "—"),
              },
              {
                key: "lastPayment",
                label: "Last payment",
                render: (firm) =>
                  firm.lastPayment
                    ? `${firm.lastPayment.currency} ${firm.lastPayment.amount.toLocaleString("en-IN")} on ${new Date(
                        firm.lastPayment.createdAt
                      ).toLocaleDateString()}`
                    : "—",
              },
            ]}
            data={firms}
            keyField="_id"
            pagination={{ page, totalPages: meta.totalPages, total: meta.total, limit: PAGE_SIZE, onChange: setPage }}
          />
        )}
      </div>
    </div>
  );
}
