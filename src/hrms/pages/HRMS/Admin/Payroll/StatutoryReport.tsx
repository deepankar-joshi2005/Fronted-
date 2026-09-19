/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Users, IndianRupee, MinusCircle, Wallet } from "lucide-react";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import Loader from "../../Loader";

const API_BASE = import.meta.env.VITE_API_URL;

interface StatutoryReportRow {
  _id: string;
  employee?: { name: string; email: string };
  grossSalary: number;
  pf: number;
  esi: number;
  pt: number;
  tds: number;
  totalDeduction: number;
  netSalary: number;
}

const StatutoryReport = () => {
  const token = localStorage.getItem("token");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reports, setReports] = useState<StatutoryReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/statutory-reports`, {
        params: { month },
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(res.data);
    } catch (error: any) {
      toast({
        type: "error",
        title: "Fetch Failed",
        message: "Unable to load statutory reports.",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReports = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(
        `${API_BASE}/statutory-reports/generate`,
        { month },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        type: "success",
        title: "Reports Generated",
        message: res.data.message,
      });
      fetchReports();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Generation Failed",
        message: error.response?.data?.message || "Failed to generate reports.",
      });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const totals = useMemo(() => {
    const sum = (key: keyof StatutoryReportRow) =>
      reports.reduce((s, r) => s + (Number(r[key]) || 0), 0);
    return {
      employees: reports.length,
      gross: sum("grossSalary"),
      deduction: sum("totalDeduction"),
      net: sum("netSalary"),
    };
  }, [reports]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Statutory Reports
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">Dashboard &gt; Payroll &gt; Statutory Reports</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
          />
          <button
            onClick={generateReports}
            disabled={generating}
            className="rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {generating ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Employees Reported" value={totals.employees} icon={Users} tone="primary" sublabel="This month" />
        <StatCard
          label="Total Gross"
          value={`₹${totals.gross.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          tone="good"
          sublabel="This month"
        />
        <StatCard
          label="Total Statutory Deductions"
          value={`₹${totals.deduction.toLocaleString("en-IN")}`}
          icon={MinusCircle}
          tone="critical"
          sublabel="PF + ESI + PT + TDS"
        />
        <StatCard
          label="Total Net Payable"
          value={`₹${totals.net.toLocaleString("en-IN")}`}
          icon={Wallet}
          tone="violet"
          sublabel="This month"
        />
      </div>

      {/* TABLE */}
      <div className="card-premium shadow-premium-sm overflow-hidden relative min-h-[200px]">
        {loading && (
          <div className="relative min-h-[200px]">
            <Loader />
          </div>
        )}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Gross
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                    PF
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--status-good)]">
                    ESI
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#7C3AED]">
                    PT
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--status-critical)]">
                    TDS
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Total Ded.
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--status-good)]">
                    Net Salary
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-sm text-[var(--muted-foreground)]">
                      No reports found for this month. Click "Generate Report" to create them.
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r._id} className="hover:bg-[var(--muted)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--foreground)]">{r.employee?.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{r.employee?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--foreground)]">
                        ₹{r.grossSalary.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--primary)]">₹{r.pf.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right text-[var(--status-good)]">
                        ₹{r.esi.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right text-[#7C3AED]">₹{r.pt.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right text-[var(--status-critical)]">
                        ₹{r.tds.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[var(--status-critical)]">
                        ₹{r.totalDeduction.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[var(--status-good)]">
                        ₹{r.netSalary.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatutoryReport;
