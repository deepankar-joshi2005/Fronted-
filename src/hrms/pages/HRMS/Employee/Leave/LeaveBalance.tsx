/** @format */
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Loader from "../../Loader";
import { Wallet, CalendarDays, CheckCircle2, TrendingDown, Search } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

interface Leave {
  _id: string;
  leaveType: string;
  totalDays: number;
  status: string;
  fromDate: string;
  toDate: string;
}

const LeaveBalance = () => {
  const token = localStorage.getItem("token");

  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balanceRes, leaveRes] = await Promise.all([
          axios.get(`${API_BASE}/leave-balance-adjustments/my-balances`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE}/employee/leaves`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setLeaveBalances(balanceRes.data || []);
        setLeaves(leaveRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recentLeaves = useMemo(() =>
    leaves.filter((l) =>
      (l.status !== "REJECTED") &&
      (l.leaveType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.status?.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 10),
    [leaves, searchTerm]
  );

  const totalBalance = useMemo(() => leaveBalances.reduce((sum, lb) => sum + (lb.balance || 0), 0), [leaveBalances]);
  const totalUsed = useMemo(() => leaveBalances.reduce((sum, lb) => sum + (lb.used || 0), 0), [leaveBalances]);
  const totalQuota = useMemo(() => leaveBalances.reduce((sum, lb) => sum + ((lb.maxDays || 0) + (lb.adjustments || 0)), 0), [leaveBalances]);

  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-GB");

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">Leave Balance</h1>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
          Overview of your leave entitlements, usage, and adjustment history.
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Leave Balance" value={totalBalance} icon={Wallet} tone="primary" sublabel="Available days" />
        <StatCard label="Total Used" value={totalUsed} icon={TrendingDown} tone="warning" sublabel="Days consumed" />
        <StatCard label="Annual Quota" value={totalQuota} icon={CalendarDays} tone="violet" sublabel="Eligible days" />
      </div>

      {/* LEAVE TYPE BALANCE CARDS */}
      <DashboardPanel title="Leave Type Breakdown" subtitle="Your entitlement per leave category">
        {leaveBalances.length === 0 ? (
          <div className="py-10 text-center text-[var(--muted-foreground)] text-xs">
            <Wallet className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>No leave balance data available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {leaveBalances.map((lb) => {
              const totalEligible = (lb.maxDays || 0) + (lb.adjustments || 0);
              const usagePercent = totalEligible > 0 ? Math.min((lb.used / totalEligible) * 100, 100) : 0;
              const pct = Math.round(usagePercent);

              return (
                <div
                  key={lb.leaveType}
                  className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 shadow-premium-sm hover:shadow-premium transition-all relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{lb.leaveType}</h4>
                    {lb.adjustments !== 0 && (
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        lb.adjustments > 0
                          ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                          : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                      )}>
                        {lb.adjustments > 0 ? "+" : ""}{lb.adjustments} Adj
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-3xl font-black text-[var(--foreground)]">{lb.balance}</p>
                      <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase mt-1">Remaining Days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--foreground)]">{lb.used}</p>
                      <p className="text-[10px] text-[var(--muted-foreground)] font-medium">Used</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-[var(--muted-foreground)]">
                      <span>Usage: {pct}%</span>
                      <span>Quota: {totalEligible}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardPanel>

      {/* RECENT LEAVE HISTORY */}
      <DashboardPanel title="Recent Leave Summary" subtitle="Your last approved / pending leave records">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search leave type or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
            />
          </div>
        </div>

        {recentLeaves.length === 0 ? (
          <div className="py-10 text-center text-[var(--muted-foreground)] text-xs">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>No recent leave records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-semibold border-b border-[var(--border)]">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">From</th>
                  <th className="p-3">To</th>
                  <th className="p-3">Days</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                {recentLeaves.map((l) => (
                  <tr key={l._id} className="hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="p-3 font-semibold text-[var(--foreground)]">{l.leaveType}</td>
                    <td className="p-3 text-[var(--foreground)]">{formatDate(l.fromDate)}</td>
                    <td className="p-3 text-[var(--foreground)]">{formatDate(l.toDate)}</td>
                    <td className="p-3 font-bold text-[var(--primary)]">{l.totalDays}d</td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase",
                        l.status === "APPROVED"
                          ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                          : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                      )}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>
    </div>
  );
};

export default LeaveBalance;
