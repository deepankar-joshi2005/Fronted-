/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Users,
  ShieldCheck,
  ShieldX,
  Percent,
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

/* ================= TYPES ================= */

interface User {
  _id: string;
  name: string;
  employeeId: string;
}

/* 🔴 ATTENDANCE TYPE FIX */
interface Attendance {
  user: {
    _id: string;
  };
}

interface Leave {
  employee: {
    _id: string;
  };
  status: string;
}

interface Payroll {
  employee: {
    _id: string;
  };
  status: string;
}

interface ComplianceRow {
  employee: User;
  attendanceOk: boolean;
  leaveOk: boolean;
  payrollOk: boolean;
  compliant: boolean;
}

/* ================= COMPONENT ================= */

export default function Compliance() {
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ================= FETCH ================= */

  const fetchAll = async () => {
    try {
      const [u, a, l, p] = await Promise.all([
        axios.get(`${API}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/attendance/all?month=0&year=2026`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/employee/leaves/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/payroll?month=2026-01`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setUsers(u.data || []);
      /* 🔴 ATTENDANCE RESPONSE FIX */
      setAttendance(a.data.attendance || []);
      setLeaves(l.data || []);
      setPayroll(p.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* ================= COMPLIANCE LOGIC ================= */

  const complianceData: ComplianceRow[] = useMemo(() => {
    return users.map((user) => {
      /* 🔴 ATTENDANCE LOGIC FIX */
      const hasAttendance = attendance.some((a) => a.user?._id === user._id);

      const leave = leaves.find((l) => l.employee?._id === user._id);
      const pay = payroll.find((p) => p.employee?._id === user._id);

      const attendanceOk = hasAttendance;
      const leaveOk = !leave || leave.status !== "REJECTED";
      const payrollOk = pay
        ? ["Paid", "Processed"].includes(pay.status)
        : false;

      return {
        employee: user,
        attendanceOk,
        leaveOk,
        payrollOk,
        compliant: attendanceOk && leaveOk && payrollOk,
      };
    });
  }, [users, attendance, leaves, payroll]);

  /* ================= FILTER ================= */

  const filtered = complianceData.filter((r) =>
    r.employee.name.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  /* ================= SUMMARY ================= */

  const total = filtered.length;
  const compliantCount = filtered.filter((r) => r.compliant).length;
  const nonCompliant = total - compliantCount;
  const percent = total ? Math.round((compliantCount / total) * 100) : 0;

  if (loading) return <Loader />;

  /* ================= UI ================= */

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Compliance Report
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Auditor <span className="mx-1">›</span> Compliance Reports
          </p>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Total Employees"
          value={total}
          icon={Users}
          tone="primary"
          sublabel="Matching current search"
        />
        <StatCard
          label="Compliant"
          value={compliantCount}
          icon={ShieldCheck}
          tone="good"
          sublabel={`${percent}% of total`}
        />
        <StatCard
          label="Non-Compliant"
          value={nonCompliant}
          icon={ShieldX}
          tone="critical"
          sublabel="Require review"
        />
        <StatCard label="Compliance %" value={`${percent}%`} icon={Percent} tone="violet" sublabel="Overall score" />
      </div>

      {/* TOOLBAR */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employee..."
          className="w-full sm:w-80 rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
        />
      </div>

      {/* TABLE */}
      {filtered.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <ShieldCheck className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No employees match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="border-b border-[var(--border)] px-4 sm:px-6 py-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Employee Compliance</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3 text-center">Attendance</th>
                  <th className="px-4 py-3 text-center">Leave</th>
                  <th className="px-4 py-3 text-center">Payroll</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {paginated.map((r) => (
                  <tr key={r.employee._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-[var(--foreground)]">{r.employee.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{r.employee.employeeId}</div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {r.attendanceOk ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-[var(--status-good)]" />
                      ) : (
                        <XCircle className="mx-auto h-4 w-4 text-[var(--status-critical)]" />
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {r.leaveOk ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-[var(--status-good)]" />
                      ) : (
                        <XCircle className="mx-auto h-4 w-4 text-[var(--status-critical)]" />
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {r.payrollOk ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-[var(--status-good)]" />
                      ) : (
                        <XCircle className="mx-auto h-4 w-4 text-[var(--status-critical)]" />
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          r.compliant
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            r.compliant ? "bg-[var(--status-good)]" : "bg-[var(--status-critical)]"
                          )}
                        />
                        {r.compliant ? "COMPLIANT" : "NON-COMPLIANT"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[var(--border)] px-4 py-3.5">
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="employees"
            />
          </div>
        </div>
      )}
    </div>
  );
}
