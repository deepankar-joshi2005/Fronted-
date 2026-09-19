/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { utils as XLSXUtils, writeFile as writeXlsx } from "xlsx";
import { Pencil, Trash2, Search, Download, Plus, ListChecks, Wallet, RefreshCw } from "lucide-react";
import AddLeaveTypeModal from "./AddLeaveType";
import DeleteLeaveTypeModal from "./DeleteLeaveTypeModal";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

interface LeaveType {
  _id: string;
  name: string;
  code: string;
  maxDays: number;
  paid: boolean;
  carryForward: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL;

const LeaveType = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [selectedLeave, setSelectedLeave] = useState<LeaveType | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const token = localStorage.getItem("token");

  /* ================= FETCH LEAVE TYPES ================= */
  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/leave-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaveTypes(res.data);
    } catch (error) {
      console.error("Failed to fetch leave types", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    if (!selectedLeave) return;

    try {
      const res = await axios.delete(
        `${API_BASE}/leave-types/${selectedLeave._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast({
        type: "success",
        title: "Leave Type Deleted",
        message: res.data?.message || "Leave type has been deleted successfully.",
      });

      setOpenDeleteModal(false);
      setSelectedLeave(null);
      fetchLeaveTypes();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        message:
          error?.response?.data?.message ||
          "Unable to delete leave type. Please try again.",
      });
    }
  };

  const filteredLeaveTypes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leaveTypes;
    return leaveTypes.filter(
      (l) => l.name?.toLowerCase().includes(q) || l.code?.toLowerCase().includes(q)
    );
  }, [leaveTypes, search]);

  const paginatedLeaveTypes = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLeaveTypes.slice(start, start + pageSize);
  }, [filteredLeaveTypes, page, pageSize]);

  const kpis = useMemo(() => {
    const total = leaveTypes.length;
    const paid = leaveTypes.filter((l) => l.paid).length;
    const carryForward = leaveTypes.filter((l) => l.carryForward).length;
    return { total, paid, carryForward };
  }, [leaveTypes]);

  const handleExport = () => {
    const sheet = XLSXUtils.json_to_sheet(
      filteredLeaveTypes.map((l) => ({
        "Leave Name": l.name,
        Code: l.code,
        "Max Days": l.maxDays,
        Paid: l.paid ? "Yes" : "No",
        "Carry Forward": l.carryForward ? "Yes" : "No",
      }))
    );
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, sheet, "Leave Types");
    writeXlsx(wb, `Leave-Types-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Leave Types & Rules
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Leave Management <span className="mx-1">›</span> Leave Types
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedLeave(null);
            setOpenAddModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Leave Type
        </button>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          label="Total Leave Types"
          value={kpis.total}
          icon={ListChecks}
          tone="primary"
          sublabel="Configured leave types"
        />
        <StatCard
          label="Paid Leave Types"
          value={kpis.paid}
          icon={Wallet}
          tone="good"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.paid / kpis.total) * 100) : 0}% of total`}
        />
        <StatCard
          label="Carry Forward Enabled"
          value={kpis.carryForward}
          icon={RefreshCw}
          tone="violet"
          sublabel="Types allowing carry forward"
        />
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leave types by name or code..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* TABLE */}
      {filteredLeaveTypes.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <ListChecks className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No leave types match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">Leave Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Max Days</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Carry Forward</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {paginatedLeaveTypes.map((leave, i) => (
                  <tr key={leave._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {(page - 1) * pageSize + i + 1}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{leave.name}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--foreground)]">
                        {leave.code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{leave.maxDays}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          leave.paid
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            leave.paid ? "bg-[var(--status-good)]" : "bg-[var(--muted-foreground)]"
                          )}
                        />
                        {leave.paid ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          leave.carryForward
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            leave.carryForward ? "bg-[var(--status-good)]" : "bg-[var(--muted-foreground)]"
                          )}
                        />
                        {leave.carryForward ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="Edit"
                          onClick={() => {
                            setSelectedLeave(leave);
                            setOpenAddModal(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => {
                            setSelectedLeave(leave);
                            setOpenDeleteModal(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[color-mix(in_oklab,var(--status-critical)_12%,transparent)] hover:text-[var(--status-critical)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
              total={filteredLeaveTypes.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="leave types"
            />
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      <AddLeaveTypeModal
        isOpen={openAddModal}
        editData={selectedLeave}
        onClose={() => {
          setOpenAddModal(false);
          setSelectedLeave(null);
          fetchLeaveTypes();
        }}
      />

      {/* DELETE MODAL */}
      <DeleteLeaveTypeModal
        isOpen={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setSelectedLeave(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default LeaveType;
