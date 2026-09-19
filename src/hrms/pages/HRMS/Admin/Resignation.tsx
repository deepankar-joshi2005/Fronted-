import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Calendar,
  User as UserIcon,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  XSquare,
  ClipboardList,
  Users,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "../Alert/Toast";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

/* ================= TYPES ================= */
type ResignationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "IN_CLEARANCE"
  | "COMPLETED";

interface Resignation {
  _id: string;
  employee: {
    name: string;
    role: string;
    employeeId: string;
    departmentId?: { name: string };
  };
  expectedLastWorkingDay: string;
  createdAt: string;
  reasonText: string;
  status: ResignationStatus;
}

/* ================= STATUS STYLES ================= */
const statusPillClass: Record<ResignationStatus, string> = {
  PENDING: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
  APPROVED: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
  REJECTED: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
  IN_CLEARANCE: "bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-[var(--primary)]",
  COMPLETED: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
};

const statusDotClass: Record<ResignationStatus, string> = {
  PENDING: "bg-[var(--status-warning)]",
  APPROVED: "bg-[var(--status-good)]",
  REJECTED: "bg-[var(--status-critical)]",
  IN_CLEARANCE: "bg-[var(--primary)]",
  COMPLETED: "bg-[var(--status-good)]",
};

const formatStatus = (status: string) =>
  status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/* ================= MAIN COMPONENT ================= */
const Resignation = () => {
  const [data, setData] = useState<Resignation[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Resignation | null>(null);
  const [processing, setProcessing] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(search);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const token = localStorage.getItem("token");

  /* ================= FETCH ================= */
  const fetchResignations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/resignation/all`, {
        params: { page, search },
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.totalRecords || 0);
    } catch (error) {
      toast({ type: "error", title: "Fetch Failed", message: "Failed to load resignation requests" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResignations();
  }, [page, search]);

  /* ================= DEBOUNCE SEARCH ================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearchParams({ page: "1", search: searchInput.trim() });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ================= ACTIONS ================= */
  const handleView = (item: Resignation) => {
    setSelected(item);
    setOpen(true);
  };

  const updateStatus = async (status: "APPROVED" | "REJECTED") => {
    if (!selected) return;
    setProcessing(true);
    try {
      await axios.patch(
        `${API}/resignation/status/${selected._id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        type: "success",
        title: status === "APPROVED" ? "Request Approved" : "Request Rejected",
        message: `Employee resignation has been marked as ${status.toLowerCase()}.`,
      });

      setOpen(false);
      fetchResignations();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Action Failed",
        message: error?.response?.data?.message || "Unable to update status",
      });
    } finally {
      setProcessing(false);
    }
  };

  /* ================= KPI ================= */
  const kpis = {
    total: totalRecords,
    pending: data.filter((d) => d.status === "PENDING").length,
    approved: data.filter((d) => d.status === "APPROVED").length,
  };

  /* ================= PAGINATION LIST ================= */
  const pageList = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set([1, totalPages, page, page - 1, page + 1]);
    return Array.from(set)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);
  })();

  const goToPage = (p: number) => setSearchParams({ page: p.toString(), search });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Resignation Pool
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Offboarding <span className="mx-1">›</span> Resignation
          </p>
        </div>
      </div>

      {/* ================= KPI ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard label="Total Requests" value={kpis.total} icon={Users} tone="primary" sublabel="All resignation submissions" />
        <StatCard label="Pending Review" value={kpis.pending} icon={Clock} tone="warning" sublabel="Awaiting a decision" />
        <StatCard label="Approved" value={kpis.approved} icon={CheckCircle2} tone="good" sublabel="Cleared for offboarding" />
      </div>

      {/* ================= TOOLBAR ================= */}
      <div className="relative sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search candidate name..."
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
        />
      </div>

      {/* ================= TABLE ================= */}
      <div className="card-premium shadow-premium-sm overflow-hidden relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--card)]/60 backdrop-blur-[1px]">
            <Loader />
          </div>
        )}

        {data.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center gap-2 p-16 text-center">
            <ClipboardList className="h-8 w-8 text-[var(--muted-foreground)]" />
            <p className="text-sm text-[var(--muted-foreground)]">No departure requests match your search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Last Working Day</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.map((item) => (
                  <tr key={item._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-sm font-semibold text-[var(--primary)]">
                          {item.employee.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{item.employee.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{item.employee.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {item.employee.departmentId?.name || "Unassigned"}
                      </div>
                      <p className="mt-0.5 text-xs">{item.employee.role}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      <div className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(item.expectedLastWorkingDay).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", statusPillClass[item.status])}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", statusDotClass[item.status])} />
                        {formatStatus(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        title="View Details"
                        onClick={() => handleView(item)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= PAGINATION ================= */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--muted-foreground)]">
            Showing <span className="font-medium text-[var(--foreground)]">{data.length}</span> of{" "}
            <span className="font-medium text-[var(--foreground)]">{totalRecords}</span> entries
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {pageList.map((p, i) => {
              const prev = pageList[i - 1];
              const showEllipsis = prev !== undefined && p - prev > 1;
              return (
                <span key={p} className="flex items-center">
                  {showEllipsis && <span className="px-1 text-xs text-[var(--muted-foreground)]">…</span>}
                  <button
                    onClick={() => goToPage(p)}
                    className={cn(
                      "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors",
                      p === page ? "bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] text-white" : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                    )}
                  >
                    {p}
                  </button>
                </span>
              );
            })}
            <button
              onClick={() => goToPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= VIEW DIALOG ================= */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-0 shadow-premium-lg">
          <DialogHeader className="border-b border-[var(--border)] bg-[var(--muted)] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--primary)_14%,transparent)]">
                <FileText className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-[var(--foreground)]">Departure Analysis</DialogTitle>
                <p className="text-xs text-[var(--muted-foreground)]">Review resignation justification and clearance timeline</p>
              </div>
            </div>
          </DialogHeader>

          {selected && (
            <div className="p-6 space-y-6">
              {/* STAFF OVERVIEW */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    <UserIcon size={12} /> Identity
                  </p>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {selected.employee.name} <span className="ml-1 text-xs text-[var(--muted-foreground)]">({selected.employee.employeeId})</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    <Building2 size={12} /> Deployment
                  </p>
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">{selected.employee.departmentId?.name || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    <Clock size={12} /> Submission
                  </p>
                  <p className="text-sm font-medium text-[var(--foreground)]">{new Date(selected.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    <Calendar size={12} /> Proposed Exit
                  </p>
                  <p className="text-sm font-medium text-[var(--primary)]">{new Date(selected.expectedLastWorkingDay).toLocaleDateString()}</p>
                </div>
              </div>

              {/* REASON BOX */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  <ClipboardList size={12} /> Supporting Statement
                </label>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4 text-sm italic leading-relaxed text-[var(--foreground)]">
                  "{selected.reasonText}"
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase text-[var(--muted-foreground)]">Phase:</span>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", statusPillClass[selected.status])}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", statusDotClass[selected.status])} />
                    {formatStatus(selected.status)}
                  </span>
                </div>

                {selected.status === "PENDING" && (
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      className="h-10 rounded-lg px-6 font-medium text-[var(--status-critical)] hover:bg-[color-mix(in_oklab,var(--status-critical)_12%,transparent)] hover:text-[var(--status-critical)]"
                      disabled={processing}
                      onClick={() => updateStatus("REJECTED")}
                    >
                      <XSquare size={16} className="mr-2" />
                      Decline
                    </Button>
                    <Button
                      className="h-10 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-8 font-medium text-white shadow-premium-sm hover:opacity-90"
                      disabled={processing}
                      onClick={() => updateStatus("APPROVED")}
                    >
                      {processing ? (
                        <Loader />
                      ) : (
                        <span className="flex items-center">
                          <CheckCircle2 size={16} className="mr-2" />
                          Approve Departure
                        </span>
                      )}
                    </Button>
                  </div>
                )}

                {selected.status !== "PENDING" && (
                  <Button variant="ghost" className="rounded-lg font-medium text-[var(--foreground)] hover:bg-[var(--muted)]" onClick={() => setOpen(false)}>
                    Close Review
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Resignation;
