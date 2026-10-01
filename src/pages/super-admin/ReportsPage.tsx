import { useEffect, useState } from "react";
import {
  Building2,
  Briefcase,
  UserCog,
  Users,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as reportsApi from "../../api/reports.api.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Input from "../../components/ui/Input.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Table from "../../components/ui/Table.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import DonutChart from "../../components/ui/DonutChart.jsx";
import ChartTooltip from "../../components/ui/ChartTooltip.jsx";
import SegmentedTabs from "../../components/ui/SegmentedTabs.jsx";
import useDebouncedValue from "../../hooks/useDebouncedValue.js";
import useResettablePage from "../../hooks/useResettablePage.js";
import { CHART_COLORS } from "../../utils/chartColors.js";

const PAGE_SIZE = 15;

const PLAN_BADGE = { trial: "brand", active: "success", suspended: "danger", expired: "neutral" };
const SUB_STATUS_BADGE = { PAID: "success", PENDING: "warning", OVERDUE: "danger" };
const SUB_PLAN_BADGE = { ACTIVE: "success", TRIAL: "brand", EXPIRED: "danger" };
const TIER_LABEL = { starter: "Starter", growth: "Growth", enterprise: "Enterprise" };
const TIER_COLOR = { starter: CHART_COLORS.brand, growth: CHART_COLORS.teal, enterprise: CHART_COLORS.gold };
const PALETTE_CYCLE = [CHART_COLORS.brand, CHART_COLORS.teal, CHART_COLORS.gold, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger];
const PERIOD_OPTIONS = [
  { value: "", label: "All time" },
  { value: "today", label: "Today" },
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "yearly", label: "This Year" },
  { value: "custom", label: "Custom" },
];

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

function daysLeftBadge(daysLeft) {
  if (daysLeft === null || daysLeft === undefined) return <Badge variant="neutral">No expiry</Badge>;
  if (daysLeft < 0) return <Badge variant="danger">Expired</Badge>;
  if (daysLeft <= 7) return <Badge variant="danger">{daysLeft} day{daysLeft === 1 ? "" : "s"} left</Badge>;
  if (daysLeft <= 30) return <Badge variant="warning">{daysLeft} days left</Badge>;
  return <Badge variant="success">{daysLeft} days left</Badge>;
}

function HeroStat({ icon: Icon, label, value, sub, accentBg, accentText }) {
  return (
    <Card className="relative overflow-hidden p-5 transition-shadow hover:shadow-md">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentBg} ${accentText}`}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-heading">{value}</p>
      <p className="text-sm font-medium text-text-muted">{label}</p>
      {sub && <p className="mt-1 text-xs text-text-muted">{sub}</p>}
    </Card>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState("overview");
  const [period, setPeriod] = useState("");
  const [customRange, setCustomRange] = useState({ startDate: "", endDate: "" });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);

  const [caFirms, setCaFirms] = useState([]);
  const [caFirmsMeta, setCaFirmsMeta] = useState({ total: 0, totalPages: 1 });
  const [caFirmsSearch, setCaFirmsSearch] = useState("");
  const debouncedCaFirmsSearch = useDebouncedValue(caFirmsSearch);

  const [businessClients, setBusinessClients] = useState([]);
  const [businessClientsMeta, setBusinessClientsMeta] = useState({ total: 0, totalPages: 1 });
  const [businessClientsSearch, setBusinessClientsSearch] = useState("");
  const debouncedBusinessClientsSearch = useDebouncedValue(businessClientsSearch);

  const [subscriptions, setSubscriptions] = useState(null);
  const [subscriptionsMeta, setSubscriptionsMeta] = useState(null);
  const [expandedFirms, setExpandedFirms] = useState(new Set());

  const periodKey = period === "custom" ? `custom|${customRange.startDate}|${customRange.endDate}` : period;
  const [caFirmsPage, setCaFirmsPage] = useResettablePage(`${periodKey}|${debouncedCaFirmsSearch}`);
  const [businessClientsPage, setBusinessClientsPage] = useResettablePage(`${periodKey}|${debouncedBusinessClientsSearch}`);
  const [firmSubPage, setFirmSubPage] = useState(1);
  const [clientSubPage, setClientSubPage] = useState(1);

  function toggleFirm(id) {
    setExpandedFirms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function periodParams() {
    if (!period) return {};
    if (period === "custom") {
      if (!customRange.startDate && !customRange.endDate) return {};
      return { period: "custom", startDate: customRange.startDate, endDate: customRange.endDate };
    }
    return { period };
  }

  // Overview / CA Firms / Business Clients are scoped to the selected sign-up
  // period; Subscriptions is about upcoming expiry, not sign-up date, so it's
  // fetched once (then re-paginated locally) and left alone.
  useEffect(() => {
    const isFirstLoad = subscriptions === null;
    if (isFirstLoad) setLoading(true);
    else setRefreshing(true);

    const requests = [
      reportsApi.getReportsOverview(periodParams()),
      reportsApi.getCaFirmsReport({ ...periodParams(), page: caFirmsPage, limit: PAGE_SIZE, search: debouncedCaFirmsSearch || undefined }),
      reportsApi.getBusinessClientsReport({
        ...periodParams(),
        page: businessClientsPage,
        limit: PAGE_SIZE,
        search: debouncedBusinessClientsSearch || undefined,
      }),
    ];
    if (isFirstLoad) requests.push(reportsApi.getSubscriptionsReport({ firmPage: 1, firmLimit: PAGE_SIZE, clientPage: 1, clientLimit: PAGE_SIZE }));

    Promise.all(requests)
      .then(([ov, firms, clients, subs]) => {
        setOverview(ov.data.data);
        setCaFirms(firms.data.data);
        setCaFirmsMeta(firms.data.meta || { total: firms.data.data.length, totalPages: 1 });
        setBusinessClients(clients.data.data);
        setBusinessClientsMeta(clients.data.meta || { total: clients.data.data.length, totalPages: 1 });
        if (subs) {
          setSubscriptions(subs.data.data);
          setSubscriptionsMeta(subs.data.meta);
        }
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodKey, caFirmsPage, businessClientsPage, debouncedCaFirmsSearch, debouncedBusinessClientsSearch]);

  // Subscriptions tables paginate independently, off the already-fetched
  // (full) lists — re-request just those two pages rather than everything else.
  useEffect(() => {
    if (subscriptions === null) return;
    reportsApi
      .getSubscriptionsReport({ firmPage: firmSubPage, firmLimit: PAGE_SIZE, clientPage: clientSubPage, clientLimit: PAGE_SIZE })
      .then(({ data }) => {
        setSubscriptions(data.data);
        setSubscriptionsMeta(data.meta);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmSubPage, clientSubPage]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  const statusPie = [
    { label: "Active", value: overview.firmsByStatus.active, color: CHART_COLORS.success },
    { label: "Trial", value: overview.firmsByStatus.trial, color: CHART_COLORS.brand },
    { label: "Expired", value: overview.firmsByStatus.expired, color: CHART_COLORS.danger },
    { label: "Suspended", value: overview.firmsByStatus.suspended, color: CHART_COLORS.warning },
  ];

  const tierPie = Object.entries(overview.firmsByTier).map(([tier, count]) => ({
    label: TIER_LABEL[tier] || tier,
    value: count,
    color: TIER_COLOR[tier] || CHART_COLORS.brand,
  }));

  const clientPlanPie = Object.entries(overview.clientsByHrmsPlan).map(([tier, count], i) => ({
    label: tier,
    value: count,
    color: tier === "Unassigned" ? CHART_COLORS.warning : PALETTE_CYCLE[i % PALETTE_CYCLE.length],
  }));

  const staffPie = [
    { label: "Admins", value: overview.staffByRole.admins, color: CHART_COLORS.brand },
    { label: "Staff", value: overview.staffByRole.staff, color: CHART_COLORS.teal },
  ];

  const clientUsagePie = [
    { label: "Uses HRMS", value: overview.clientsByUsage.hrms, color: CHART_COLORS.brand },
    { label: "Excel-based", value: overview.clientsByUsage.excel, color: CHART_COLORS.gold },
  ];

  const employeeSourcePie = [
    { label: "HRMS", value: overview.employeesBySource.hrms, color: CHART_COLORS.brand },
    { label: "Excel-based", value: overview.employeesBySource.excel, color: CHART_COLORS.gold },
  ];

  const businessClientColumns = [
    {
      key: "name",
      label: "Business Client",
      render: (row) => (
        <div className="max-w-56">
          <p className="truncate font-medium text-heading" title={row.name}>
            {row.name}
          </p>
          <p className="truncate text-xs text-text-muted">{row.caFirmName}</p>
        </div>
      ),
    },
    {
      key: "planTier",
      label: "HRMS Plan",
      render: (row) => (row.useHrms === false ? <span className="text-text-muted">Excel-based</span> : row.planTier || "—"),
    },
    {
      key: "status",
      label: "Status",
      render: (row) =>
        row.useHrms === false ? (
          <Badge variant={row.isActive ? "success" : "danger"}>{row.isActive ? "Active" : "Suspended"}</Badge>
        ) : row.subscriptionStatus ? (
          <Badge variant={SUB_STATUS_BADGE[row.subscriptionStatus] || "neutral"}>{row.subscriptionStatus}</Badge>
        ) : (
          "—"
        ),
    },
    { key: "employeeCount", label: "Employees", align: "right" },
    { key: "createdAt", label: "Since", render: (row) => fmtDate(row.createdAt) },
  ];

  const caFirmSubColumns = [
    {
      key: "firmName",
      label: "CA Firm",
      render: (row) => (
        <div className="max-w-56">
          <p className="truncate font-medium text-heading">{row.firmName}</p>
          <p className="truncate text-xs text-text-muted">{row.adminName ? `${row.adminName} · ${row.adminEmail}` : "No admin"}</p>
        </div>
      ),
    },
    { key: "planTier", label: "Plan", render: (row) => <Badge variant={TIER_LABEL[row.planTier] ? "brand" : "neutral"}>{row.planTier}</Badge> },
    { key: "status", label: "Status", render: (row) => <Badge variant={PLAN_BADGE[row.status] || "neutral"}>{row.status}</Badge> },
    { key: "expiryDate", label: "Expiry", render: (row) => fmtDate(row.expiryDate) },
    { key: "daysLeft", label: "", render: (row) => daysLeftBadge(row.daysLeft) },
  ];

  const clientSubColumns = [
    {
      key: "clientName",
      label: "Business Client",
      render: (row) => (
        <div className="max-w-56">
          <p className="truncate font-medium text-heading">{row.clientName}</p>
          <p className="truncate text-xs text-text-muted">{row.firmName}</p>
        </div>
      ),
    },
    { key: "planTier", label: "Plan", render: (row) => row.planTier || "—" },
    {
      key: "subscriptionStatus",
      label: "Status",
      render: (row) => <Badge variant={SUB_STATUS_BADGE[row.subscriptionStatus] || "neutral"}>{row.subscriptionStatus}</Badge>,
    },
    { key: "expiryDate", label: "Expiry", render: (row) => fmtDate(row.expiryDate) },
    { key: "daysLeft", label: "", render: (row) => daysLeftBadge(row.daysLeft) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-heading">
            <Sparkles size={22} className="text-brand" /> Reports
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Every role, every firm, every plan — one place to see how the whole platform is doing.
          </p>
        </div>
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "overview", label: "Overview" },
            { value: "ca-firms", label: "CA Firms" },
            { value: "business-clients", label: "Business Clients" },
            { value: "subscriptions", label: "Subscriptions" },
          ]}
        />
      </div>

      {tab !== "subscriptions" && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-text-muted">Sign-ups in:</span>
            <SegmentedTabs value={period} onChange={setPeriod} options={PERIOD_OPTIONS} />
            {refreshing && <Spinner size={16} />}
          </div>
          {period === "custom" && (
            <div className="flex items-end gap-3">
              <div className="w-40">
                <Input
                  label="From"
                  type="date"
                  value={customRange.startDate}
                  max={customRange.endDate || undefined}
                  onChange={(e) => setCustomRange((r) => ({ ...r, startDate: e.target.value }))}
                />
              </div>
              <div className="w-40">
                <Input
                  label="To"
                  type="date"
                  value={customRange.endDate}
                  min={customRange.startDate || undefined}
                  onChange={(e) => setCustomRange((r) => ({ ...r, endDate: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "overview" && (
        <div className="flex flex-col gap-6">
          {period && (
            <p className="text-sm text-text-muted">
              Showing sign-ups from <strong className="text-text">{PERIOD_OPTIONS.find((p) => p.value === period)?.label}</strong> only.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <HeroStat
              icon={Building2}
              label={period ? "New CA Firms" : "Total CA Firms"}
              value={overview.totals.caFirms}
              accentBg="bg-blue-500/10"
              accentText="text-blue-600 dark:text-blue-400"
            />
            <HeroStat
              icon={Briefcase}
              label={period ? "New Business Clients" : "Business Clients"}
              value={overview.totals.businessClients}
              accentBg="bg-violet-500/10"
              accentText="text-violet-600 dark:text-violet-400"
            />
            <HeroStat
              icon={UserCog}
              label={period ? "New CA Staff" : "Total CA Staff"}
              value={overview.totals.caStaff}
              sub={`${overview.totals.caFirmAdmins} admins · ${overview.totals.caFirmStaff} staff`}
              accentBg="bg-amber-500/10"
              accentText="text-amber-600 dark:text-amber-400"
            />
            <HeroStat
              icon={Users}
              label={period ? "New Employees" : "Total Employees"}
              value={overview.totals.employees}
              sub="Across every business client"
              accentBg="bg-rose-500/10"
              accentText="text-rose-600 dark:text-rose-400"
            />
            <HeroStat
              icon={ShieldCheck}
              label="Active CA Licences"
              value={overview.firmsByStatus.active}
              sub={period ? "Among this period's sign-ups" : undefined}
              accentBg="bg-teal-500/10"
              accentText="text-teal-600 dark:text-teal-400"
            />
            <HeroStat
              icon={CreditCard}
              label="Active HRMS Subscriptions"
              value={overview.hrmsSubscriptions.active}
              sub={`${overview.hrmsSubscriptions.trial} trial · ${overview.hrmsSubscriptions.expired} expired`}
              accentBg="bg-emerald-500/10"
              accentText="text-emerald-600 dark:text-emerald-400"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card className="p-5">
              <h2 className="mb-4 text-base font-semibold text-heading">CA firms by status</h2>
              <DonutChart data={statusPie} />
            </Card>
            <Card className="p-5">
              <h2 className="mb-4 text-base font-semibold text-heading">CA firms by plan</h2>
              <DonutChart data={tierPie} />
            </Card>
            <Card className="p-5">
              <h2 className="mb-4 text-base font-semibold text-heading">Business clients by HRMS plan</h2>
              {clientPlanPie.length === 0 ? (
                <EmptyState icon={Briefcase} title="No HRMS subscriptions yet" />
              ) : (
                <DonutChart data={clientPlanPie} />
              )}
            </Card>
            <Card className="p-5">
              <h2 className="mb-4 text-base font-semibold text-heading">CA staff — admins vs. staff</h2>
              <DonutChart data={staffPie} />
            </Card>
            <Card className="p-5">
              <h2 className="mb-4 text-base font-semibold text-heading">Business clients — HRMS vs. Excel</h2>
              <DonutChart data={clientUsagePie} />
            </Card>
            <Card className="p-5">
              <h2 className="mb-4 text-base font-semibold text-heading">Employees — HRMS vs. Excel-based</h2>
              <DonutChart data={employeeSourcePie} />
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="mb-4 text-base font-semibold text-heading">New sign-ups, last 6 months</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overview.signupTrend} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} width={28} />
                  <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
                  <Bar dataKey="caFirms" name="New CA firms" fill={CHART_COLORS.brand} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="businessClients" name="New business clients" fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {tab === "ca-firms" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            {caFirmsMeta.total} CA firm{caFirmsMeta.total === 1 ? "" : "s"}
            {period ? ` signed up ${PERIOD_OPTIONS.find((p) => p.value === period)?.label.toLowerCase()}` : ""} — expand a firm to see every
            business client under it, its HRMS plan, and its real employee headcount.
          </p>
          <Card className="max-w-sm p-4">
            <Input label="Search" placeholder="Search CA firms by name..." value={caFirmsSearch} onChange={(e) => setCaFirmsSearch(e.target.value)} />
          </Card>
          {caFirms.length === 0 ? (
            <EmptyState icon={Building2} title="No CA firms found" description="Try adjusting your search or date range." />
          ) : (
            <div className="flex flex-col gap-3">
              {caFirms.map((firm) => {
                const isOpen = expandedFirms.has(firm._id);
                return (
                  <Card key={firm._id} className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleFirm(firm._id)}
                      className="flex w-full flex-wrap items-center gap-4 p-4 text-left hover:bg-surface-2/60"
                    >
                      {isOpen ? (
                        <ChevronDown size={16} className="shrink-0 text-text-muted" />
                      ) : (
                        <ChevronRight size={16} className="shrink-0 text-text-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-heading">{firm.name}</p>
                        <p className="truncate text-xs text-text-muted">
                          {firm.adminName ? `${firm.adminName} · ${firm.adminEmail}` : "No admin"}
                        </p>
                      </div>
                      <Badge variant={PLAN_BADGE[firm.plan?.status] || "neutral"}>
                        {firm.plan?.tier} · {firm.plan?.status}
                      </Badge>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-heading">{firm.businessClientCount}</p>
                          <p className="text-[11px] text-text-muted">Clients</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-heading">{firm.staffCount}</p>
                          <p className="text-[11px] text-text-muted">CA Staff</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-heading">{firm.employeeCount}</p>
                          <p className="text-[11px] text-text-muted">Employees</p>
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-border px-4 pb-4 pt-3">
                        {firm.businessClients.length === 0 ? (
                          <p className="py-3 text-sm text-text-muted">No business clients under this firm yet.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-left text-sm">
                              <thead>
                                <tr className="border-b border-border bg-surface-2">
                                  <th className="px-3 py-2 font-semibold text-text-muted">Business Client</th>
                                  <th className="px-3 py-2 font-semibold text-text-muted">HRMS Plan</th>
                                  <th className="px-3 py-2 font-semibold text-text-muted">Status</th>
                                  <th className="px-3 py-2 text-right font-semibold text-text-muted">Employees</th>
                                </tr>
                              </thead>
                              <tbody>
                                {firm.businessClients.map((client) => (
                                  <tr key={client._id} className="border-b border-border last:border-0">
                                    <td className="px-3 py-2 font-medium text-text">{client.name}</td>
                                    <td className="px-3 py-2 text-text">
                                      {client.useHrms === false ? (
                                        <span className="text-text-muted">Excel-based</span>
                                      ) : (
                                        client.planTier || "—"
                                      )}
                                    </td>
                                    <td className="px-3 py-2">
                                      {client.useHrms === false ? (
                                        <Badge variant={client.isActive ? "success" : "danger"}>
                                          {client.isActive ? "Active" : "Suspended"}
                                        </Badge>
                                      ) : client.subscriptionStatus ? (
                                        <Badge variant={SUB_STATUS_BADGE[client.subscriptionStatus] || "neutral"}>
                                          {client.subscriptionStatus}
                                        </Badge>
                                      ) : (
                                        "—"
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold text-heading">{client.employeeCount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
              <Card className="p-0">
                <Pagination
                  page={caFirmsPage}
                  totalPages={caFirmsMeta.totalPages}
                  total={caFirmsMeta.total}
                  limit={PAGE_SIZE}
                  onChange={setCaFirmsPage}
                />
              </Card>
            </div>
          )}
        </div>
      )}

      {tab === "business-clients" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            {businessClientsMeta.total} business client{businessClientsMeta.total === 1 ? "" : "s"}
            {period ? ` signed up ${PERIOD_OPTIONS.find((p) => p.value === period)?.label.toLowerCase()}` : " across every CA firm"}, with real
            employee headcount.
          </p>
          <Card className="max-w-sm p-4">
            <Input
              label="Search"
              placeholder="Search business clients by name..."
              value={businessClientsSearch}
              onChange={(e) => setBusinessClientsSearch(e.target.value)}
            />
          </Card>
          {businessClients.length === 0 ? (
            <EmptyState icon={Briefcase} title="No business clients found" description="Try adjusting your search or date range." />
          ) : (
            <Table
              columns={businessClientColumns}
              data={businessClients}
              keyField="_id"
              pagination={{
                page: businessClientsPage,
                totalPages: businessClientsMeta.totalPages,
                total: businessClientsMeta.total,
                limit: PAGE_SIZE,
                onChange: setBusinessClientsPage,
              }}
            />
          )}
        </div>
      )}

      {tab === "subscriptions" && (
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning" />
              <h2 className="text-base font-semibold text-heading">Expiring in the next 30 days</h2>
            </div>
            {subscriptions.expiringSoon.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="Nothing expiring soon" description="Every licence and subscription is comfortably ahead." />
            ) : (
              <ul className="flex flex-col gap-3">
                {subscriptions.expiringSoon.map((row, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-heading">{row.name}</p>
                      <p className="text-xs text-text-muted">
                        {row.type === "ca_firm" ? "CA Firm licence" : "Business Client subscription"} · {row.planTier || "—"} · expires{" "}
                        {fmtDate(row.expiryDate)}
                      </p>
                    </div>
                    {daysLeftBadge(row.daysLeft)}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-heading">CA firm licences</h2>
            {subscriptions.caFirmSubscriptions.length === 0 ? (
              <EmptyState icon={Building2} title="No CA firms yet" />
            ) : (
              <Table
                columns={caFirmSubColumns}
                data={subscriptions.caFirmSubscriptions}
                keyField="_id"
                pagination={
                  subscriptionsMeta && {
                    page: firmSubPage,
                    totalPages: subscriptionsMeta.caFirmSubscriptions.totalPages,
                    total: subscriptionsMeta.caFirmSubscriptions.total,
                    limit: PAGE_SIZE,
                    onChange: setFirmSubPage,
                  }
                }
              />
            )}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-heading">Business client subscriptions</h2>
            {subscriptions.businessClientSubscriptions.length === 0 ? (
              <EmptyState icon={Briefcase} title="No HRMS subscriptions yet" />
            ) : (
              <Table
                columns={clientSubColumns}
                data={subscriptions.businessClientSubscriptions}
                keyField="_id"
                pagination={
                  subscriptionsMeta && {
                    page: clientSubPage,
                    totalPages: subscriptionsMeta.businessClientSubscriptions.totalPages,
                    total: subscriptionsMeta.businessClientSubscriptions.total,
                    limit: PAGE_SIZE,
                    onChange: setClientSubPage,
                  }
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
