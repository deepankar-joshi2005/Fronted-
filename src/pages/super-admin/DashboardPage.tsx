import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ShieldCheck,
  Clock,
  XCircle,
  Briefcase,
  Users,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as dashboardApi from "../../api/dashboard.api.js";
import * as billingApi from "../../api/billing.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { CHART_COLORS } from "../../utils/chartColors.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import HorizontalBars from "../../components/ui/HorizontalBars.jsx";
import ChartTooltip from "../../components/ui/ChartTooltip.jsx";

const PLAN_BADGE = { trial: "brand", active: "success", suspended: "danger", expired: "neutral" };
const TIER_LABEL = { starter: "Starter", growth: "Growth", enterprise: "Enterprise" };

function StatCard({ icon: Icon, label, value, accentBg, accentText }) {
  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentBg} ${accentText}`}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-2xl font-bold text-heading">{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
    </Card>
  );
}

function formatCurrency(amount, currency) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.getSuperAdminDashboard(), billingApi.getBillingSummary()])
      .then(([dashRes, billingRes]) => {
        setData(dashRes.data.data);
        setBilling(billingRes.data.data);
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

  const statusBars = [
    { label: "Active", value: data.activeLicences, color: CHART_COLORS.success },
    { label: "Trial", value: data.trialFirms, color: CHART_COLORS.brand },
    { label: "Expired / suspended", value: data.expiredFirms, color: CHART_COLORS.danger },
  ];

  const tierColors = { starter: CHART_COLORS.brand, growth: CHART_COLORS.teal, enterprise: CHART_COLORS.gold };
  const tierBars = Object.entries(billing.byTier).map(([tier, count]) => ({
    label: TIER_LABEL[tier] || tier,
    value: count,
    color: tierColors[tier] || CHART_COLORS.brand,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-heading">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-text-muted">Active licences, revenue and system alerts across the platform.</p>
        </div>
        <Badge variant="brand">{data.totalFirms} CA firms onboarded</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={Building2}
          label="Total CA firms"
          value={data.totalFirms}
          accentBg="bg-blue-500/10"
          accentText="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={ShieldCheck}
          label="Active firms"
          value={data.activeLicences}
          accentBg="bg-teal-500/10"
          accentText="text-teal-600 dark:text-teal-400"
        />
        <StatCard
          icon={Clock}
          label="Trial firms"
          value={data.trialFirms}
          accentBg="bg-brand-soft"
          accentText="text-brand"
        />
        <StatCard
          icon={XCircle}
          label="Expired / suspended"
          value={data.expiredFirms}
          accentBg="bg-rose-500/10"
          accentText="text-rose-600 dark:text-rose-400"
        />
        <StatCard
          icon={Briefcase}
          label="Business clients"
          value={data.totalBusinessClients}
          accentBg="bg-violet-500/10"
          accentText="text-violet-600 dark:text-violet-400"
        />
        <StatCard
          icon={Users}
          label="Total users"
          value={data.totalUsers}
          accentBg="bg-amber-500/10"
          accentText="text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-heading">Firms by status</h2>
          <HorizontalBars data={statusBars} />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-heading">Firms by plan</h2>
          <HorizontalBars data={tierBars} />
        </Card>

        <Card className="p-5">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp size={16} className="text-teal" />
            <h2 className="text-base font-semibold text-heading">New firms, last 6 months</h2>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.signupTrend} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: "var(--surface-2)" }}
                  content={<ChartTooltip formatter={(value) => `${value} new firm${value === 1 ? "" : "s"}`} />}
                />
                <Bar
                  dataKey="count"
                  name="New firms"
                  fill={CHART_COLORS.brand}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-warning" />
            <h2 className="text-base font-semibold text-heading">System alerts</h2>
          </div>
          {data.expiringSoon.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No licences expiring soon" description="Everything is on track." />
          ) : (
            <ul className="flex flex-col gap-3">
              {data.expiringSoon.map((firm) => (
                <li key={firm._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-heading">{firm.name}</p>
                    <p className="text-xs text-text-muted">
                      Expires {new Date(firm.plan.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={PLAN_BADGE[firm.plan.status]}>{firm.plan.tier}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-heading">Recently onboarded</h2>
            <Link to="../ca-firms" className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          {data.recentFirms.length === 0 ? (
            <EmptyState icon={Building2} title="No CA firms yet" description="Onboard your first firm from CA Management." />
          ) : (
            <ul className="flex flex-col gap-3">
              {data.recentFirms.map((firm) => (
                <li key={firm._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-heading">{firm.name}</p>
                    <p className="text-xs text-text-muted">{new Date(firm.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={PLAN_BADGE[firm.plan.status]}>{firm.plan.tier}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-teal" />
              <h2 className="text-base font-semibold text-heading">Revenue overview</h2>
            </div>
            <Link to="../billing" className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">
              Details <ArrowUpRight size={14} />
            </Link>
          </div>
          <p className="text-2xl font-bold text-heading">
            {formatCurrency(billing.estimatedMonthlyRevenue, billing.currency)}
          </p>
          <p className="text-sm text-text-muted">Estimated monthly recurring revenue</p>
          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
            {Object.entries(billing.byTier).map(([tier, count]) => (
              <div key={tier} className="flex items-center justify-between text-sm">
                <span className="capitalize text-text-muted">{tier}</span>
                <span className="font-medium text-heading">{count} firms</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
