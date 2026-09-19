import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Contact2,
  ClipboardCheck,
  PiggyBank,
  UserCog,
  Briefcase,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
} from "lucide-react";
import * as caFirmApi from "../../api/caFirm.api.js";
import * as crmApi from "../../api/crm.api.js";
import * as complianceApi from "../../api/compliance.api.js";
import * as financeTrackerApi from "../../api/financeTracker.api";
import * as staffApi from "../../api/staff.api.js";
import * as businessClientApi from "../../api/businessClient.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { ROLES } from "../../config/roles.js";
import { CHART_COLORS } from "../../utils/chartColors.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import HorizontalBars from "../../components/ui/HorizontalBars.jsx";

const PLAN_BADGE = { trial: "brand", active: "success", suspended: "danger", expired: "neutral" };

function StatCard({ icon: Icon, label, value, sub, onClick, accentBg = "bg-brand-soft", accentText = "text-brand" }) {
  return (
    <Card
      className={`p-5 transition-shadow hover:shadow-md ${onClick ? "cursor-pointer hover:bg-surface-2" : ""}`}
      onClick={onClick}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentBg} ${accentText}`}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-2xl font-bold text-heading">{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
      {sub && <p className="mt-1 text-xs text-text-muted">{sub}</p>}
    </Card>
  );
}

export default function FirmDashboardPage() {
  const { user, basePath } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === ROLES.CA_FIRM_ADMIN;

  const [firmPlan, setFirmPlan] = useState(null);
  const [crm, setCrm] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [financeProfileCount, setFinanceProfileCount] = useState(0);
  const [seats, setSeats] = useState(null);
  const [clientLimit, setClientLimit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calls = [
      caFirmApi.getMyFirmPlan().then(({ data }) => setFirmPlan(data.data)),
      crmApi.getCrmDashboard().then(({ data }) => setCrm(data.data)),
      complianceApi.getComplianceDashboard().then(({ data }) => setCompliance(data.data)),
      financeTrackerApi.listFinanceProfiles().then(({ data }) => setFinanceProfileCount(data.meta.total)),
    ];
    if (isAdmin) {
      calls.push(staffApi.listStaff().then(({ data }) => setSeats(data.seats)));
      calls.push(businessClientApi.listMyBusinessClients().then(({ data }) => setClientLimit(data.limit)));
    }
    // allSettled, not all — one failing call (e.g. a dashboard widget's API being
    // temporarily down) shouldn't leave loading stuck true or crash the render on
    // a still-null state further down while other calls are still in flight.
    Promise.allSettled(calls).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  const expiryDate = firmPlan?.plan?.expiryDate ? new Date(firmPlan.plan.expiryDate) : null;
  const daysToExpiry = expiryDate ? Math.ceil((expiryDate - new Date()) / (24 * 60 * 60 * 1000)) : null;
  const showTrialWarning = firmPlan?.plan?.status === "trial" && daysToExpiry !== null && daysToExpiry <= 7;

  // Past expiry but still inside the 7-day grace period — full functionality
  // continues (enforced server-side), this banner is the only visible change.
  const showGraceWarning = firmPlan?.inGracePeriod;
  const daysLeftInGrace = firmPlan?.graceEndDate
    ? Math.max(Math.ceil((new Date(firmPlan.graceEndDate) - new Date()) / (24 * 60 * 60 * 1000)), 0)
    : null;

  const pipelineBars = [
    { label: "New", value: crm.pipeline.new, color: CHART_COLORS.brand },
    { label: "Contacted", value: crm.pipeline.contacted, color: CHART_COLORS.teal },
    { label: "Qualified", value: crm.pipeline.qualified, color: CHART_COLORS.gold },
    { label: "Converted", value: crm.pipeline.converted, color: CHART_COLORS.success },
    { label: "Lost", value: crm.pipeline.lost, color: CHART_COLORS.danger },
  ];
  const complianceBars = [
    { label: "Pending", value: compliance.counts.pending, color: CHART_COLORS.warning },
    { label: "In progress", value: compliance.counts.in_progress, color: CHART_COLORS.brand },
    { label: "Done", value: compliance.counts.done, color: CHART_COLORS.success },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-heading">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-text-muted">{firmPlan?.firmName}</p>
        </div>
        <Badge variant={PLAN_BADGE[firmPlan?.plan?.status] || "neutral"}>
          {firmPlan?.plan?.tier} · {firmPlan?.plan?.status}
        </Badge>
      </div>

      {showTrialWarning && (
        <div
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft px-3.5 py-2.5 text-sm text-brand"
          onClick={() => isAdmin && navigate(`${basePath}/subscription`)}
        >
          <AlertTriangle size={15} />
          Your trial ends in {Math.max(daysToExpiry, 0)} day{daysToExpiry === 1 ? "" : "s"}.
          {isAdmin && <span className="ml-1 font-medium underline">Subscribe now</span>}
        </div>
      )}

      {showGraceWarning && (
        <div
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger"
          onClick={() => isAdmin && navigate(`${basePath}/subscription`)}
        >
          <AlertTriangle size={15} />
          Your subscription has expired. Your workspace becomes read-only in {daysLeftInGrace} day
          {daysLeftInGrace === 1 ? "" : "s"} unless you renew.
          {isAdmin && <span className="ml-1 font-medium underline">Renew now</span>}
        </div>
      )}

      <div className={`grid grid-cols-1 gap-4 ${isAdmin ? "sm:grid-cols-3 lg:grid-cols-6" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        <StatCard
          icon={Contact2}
          label="Open leads"
          value={crm.total - crm.pipeline.converted - crm.pipeline.lost}
          sub={crm.overdueFollowUp > 0 ? `${crm.overdueFollowUp} follow-up overdue` : "CRM pipeline"}
          onClick={() => navigate(`${basePath}/crm`)}
          accentBg="bg-blue-500/10"
          accentText="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Compliance tasks open"
          value={compliance.counts.pending + compliance.counts.in_progress}
          sub={compliance.overdue > 0 ? `${compliance.overdue} overdue` : "On track"}
          onClick={() => navigate(`${basePath}/compliance`)}
          accentBg="bg-amber-500/10"
          accentText="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={CalendarClock}
          label="Due this week"
          value={compliance.dueThisWeek}
          sub="Compliance deadlines"
          onClick={() => navigate(`${basePath}/compliance`)}
          accentBg="bg-teal-500/10"
          accentText="text-teal-600 dark:text-teal-400"
        />
        <StatCard
          icon={PiggyBank}
          label="Tracked profiles"
          value={financeProfileCount}
          sub="Personal Finance Tracker"
          onClick={() => navigate(`${basePath}/finance-tracker`)}
          accentBg="bg-violet-500/10"
          accentText="text-violet-600 dark:text-violet-400"
        />
        {isAdmin && seats && (
          <StatCard
            icon={UserCog}
            label="Staff seats used"
            value={`${seats.used} / ${seats.limit ?? "∞"}`}
            sub="Staff"
            onClick={() => navigate(`${basePath}/staff`)}
            accentBg="bg-brand-soft"
            accentText="text-brand"
          />
        )}
        {isAdmin && clientLimit && (
          <StatCard
            icon={Briefcase}
            label="Business clients"
            value={`${clientLimit.used} / ${clientLimit.max ?? "∞"}`}
            sub="Business Clients"
            onClick={() => navigate(`${basePath}/clients`)}
            accentBg="bg-rose-500/10"
            accentText="text-rose-600 dark:text-rose-400"
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-heading">CRM pipeline</h2>
          <HorizontalBars data={pipelineBars} />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-heading">Compliance tasks by status</h2>
          <HorizontalBars data={complianceBars} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-heading">Recent leads</h2>
            <button
              className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
              onClick={() => navigate(`${basePath}/crm`)}
            >
              View CRM <ArrowRight size={14} />
            </button>
          </div>
          {crm.recentLeads.length === 0 ? (
            <p className="text-sm text-text-muted">No leads yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {crm.recentLeads.map((lead) => (
                <li key={lead._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-text">{lead.name}</p>
                    <p className="text-xs text-text-muted">{lead.company || "—"}</p>
                  </div>
                  <Badge variant="neutral">{lead.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-heading">Upcoming compliance deadlines</h2>
            <button
              className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
              onClick={() => navigate(`${basePath}/compliance`)}
            >
              View Compliance <ArrowRight size={14} />
            </button>
          </div>
          {compliance.upcoming.length === 0 ? (
            <p className="text-sm text-text-muted">Nothing due.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {compliance.upcoming.map((task) => {
                const overdue = new Date(task.dueDate) < new Date();
                return (
                  <li key={task._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-text">{task.title}</p>
                      <p className="text-xs text-text-muted">{task.clientId?.name}</p>
                    </div>
                    <span className={`text-xs font-medium ${overdue ? "text-danger" : "text-text-muted"}`}>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
