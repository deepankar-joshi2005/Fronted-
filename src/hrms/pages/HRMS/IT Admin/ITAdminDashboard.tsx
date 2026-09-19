/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Users,
  Boxes,
  ShieldCheck,
  UserPlus,
  AlertTriangle,
  Laptop,
  ClipboardCheck,
  RefreshCcw,
  UserX,
  Undo2,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { DonutChart, type DonutSlice } from "@/components/ui/donut-chart";

const API = import.meta.env.VITE_API_URL;

/* ================= TYPES ================= */

interface User {
  _id: string;
}

interface Asset {
  status: string;
}

interface License {
  status: string;
}

interface OnboardingTask {
  status: string;
}

interface QuickActionItem {
  title: string;
  icon: React.ElementType;
  tone: "primary" | "good" | "warning" | "critical" | "violet";
  onClick: () => void;
}

const toneClasses: Record<string, string> = {
  primary: "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]",
  good: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
  warning: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
  critical: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
  violet: "bg-[color-mix(in_oklab,#7C3AED_14%,transparent)] text-[#7C3AED]",
};

/* ================= DASHBOARD ================= */

export default function ITAdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingTask[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [userRes, assetRes, licenseRes, onboardingRes] = await Promise.all([
        axios.get(`${API}/users`, { headers }),
        axios.get(`${API}/asset`, { headers }),
        axios.get(`${API}/license/assigned`, { headers }),
        axios.get(`${API}/onboarding-tasks`, { headers }),
      ]);

      setUsers(userRes.data || []);
      setAssets(assetRes.data || []);
      setLicenses(licenseRes.data || []);
      setOnboarding(onboardingRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= CALCULATIONS ================= */

  const totalUsers = users.length;

  const totalAssets = assets.length;
  const assignedAssets = assets.filter((a) => a.status === "ASSIGNED").length;
  const availableAssets = assets.filter((a) => a.status === "AVAILABLE").length;

  const totalLicenses = licenses.length;
  const pendingLicenses = licenses.filter((l) => l.status !== "ACTIVE").length;
  const activeLicenses = totalLicenses - pendingLicenses;

  const totalOnboarding = onboarding.length;
  const pendingOnboarding = onboarding.filter((o) => o.status === "PENDING").length;
  const completedOnboarding = totalOnboarding - pendingOnboarding;

  const assetStatusData: DonutSlice[] = useMemo(
    () => [
      { label: "Assigned", value: assignedAssets, color: "var(--status-warning)" },
      { label: "Available", value: availableAssets, color: "var(--status-good)" },
    ],
    [assignedAssets, availableAssets]
  );

  const licenseStatusData: DonutSlice[] = useMemo(
    () => [
      { label: "Active", value: activeLicenses, color: "var(--status-good)" },
      { label: "Revoked", value: pendingLicenses, color: "var(--status-critical)" },
    ],
    [activeLicenses, pendingLicenses]
  );

  const onboardingStatusData: DonutSlice[] = useMemo(
    () => [
      { label: "Completed", value: completedOnboarding, color: "var(--status-good)" },
      { label: "Pending", value: pendingOnboarding, color: "var(--status-warning)" },
    ],
    [completedOnboarding, pendingOnboarding]
  );

  const quickActions: QuickActionItem[] = [
    {
      title: "IT Onboarding Tasks",
      icon: ClipboardCheck,
      tone: "primary",
      onClick: () => navigate("/hrms/it/onboarding"),
    },
    {
      title: "Asset Inventory",
      icon: Boxes,
      tone: "good",
      onClick: () => navigate("/hrms/it/assets"),
    },
    {
      title: "Assign / Reassign Asset",
      icon: RefreshCcw,
      tone: "violet",
      onClick: () => navigate("/hrms/it/assets/assign"),
    },
    {
      title: "Software Licenses",
      icon: ShieldCheck,
      tone: "primary",
      onClick: () => navigate("/hrms/it/software"),
    },
    {
      title: "Access Deactivation",
      icon: UserX,
      tone: "critical",
      onClick: () => navigate("/hrms/it/offboarding/access"),
    },
    {
      title: "Asset Return Clearance",
      icon: Undo2,
      tone: "warning",
      onClick: () => navigate("/hrms/it/offboarding/assets"),
    },
  ];

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          IT Admin Dashboard
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {formattedDate} · System access, assets &amp; onboarding overview
        </p>
      </div>

      {/* ================= TOP STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Employees" value={totalUsers} icon={Users} tone="primary" />
        <StatCard
          label="Total Assets"
          value={totalAssets}
          icon={Boxes}
          tone="violet"
          sublabel={`${availableAssets} available`}
        />
        <StatCard
          label="Active Licenses"
          value={totalLicenses}
          icon={ShieldCheck}
          tone="good"
          sublabel="Currently assigned"
        />
        <StatCard
          label="Pending Onboarding"
          value={pendingOnboarding}
          icon={UserPlus}
          tone="warning"
          sublabel="Needs completion"
        />
      </div>

      {/* ================= SECOND ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          label="Assigned Assets"
          value={assignedAssets}
          icon={Laptop}
          tone="primary"
          sublabel={`${totalAssets > 0 ? Math.round((assignedAssets / totalAssets) * 100) : 0}% of total assets`}
        />
        <StatCard
          label="Pending Licenses"
          value={pendingLicenses}
          icon={AlertTriangle}
          tone="critical"
          sublabel="Requires review"
        />
        <StatCard
          label="Total Onboarding Tasks"
          value={totalOnboarding}
          icon={UserPlus}
          tone="violet"
          sublabel={`${completedOnboarding} completed`}
        />
      </div>

      {/* ================= STATUS BREAKDOWNS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <DashboardPanel title="Asset status" subtitle="Assigned vs. available">
          {totalAssets === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">No assets to show yet</p>
          ) : (
            <DonutChart centerLabel="Assets" data={assetStatusData} />
          )}
        </DashboardPanel>

        <DashboardPanel title="License status" subtitle="Active vs. revoked">
          {totalLicenses === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">No licenses to show yet</p>
          ) : (
            <DonutChart centerLabel="Licenses" data={licenseStatusData} />
          )}
        </DashboardPanel>

        <DashboardPanel title="Onboarding progress" subtitle="Completed vs. pending">
          {totalOnboarding === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">No onboarding tasks yet</p>
          ) : (
            <DonutChart centerLabel="Tasks" data={onboardingStatusData} />
          )}
        </DashboardPanel>
      </div>

      {/* ================= QUICK ACTIONS ================= */}
      <DashboardPanel title="Quick Actions" subtitle="Common IT admin tasks">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((item) => (
            <button
              key={item.title}
              onClick={item.onClick}
              className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-4 text-left transition-colors hover:bg-[var(--muted)]"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[item.tone]}`}
              >
                <item.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--foreground)]">
                {item.title}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
            </button>
          ))}
        </div>
      </DashboardPanel>
    </div>
  );
}
