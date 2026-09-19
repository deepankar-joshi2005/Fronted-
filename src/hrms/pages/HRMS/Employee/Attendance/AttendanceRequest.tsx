/** @format */

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import AttendanceRequestModal from "./AttendanceRequestModel";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

export default function AttendanceRequest() {
  const token = localStorage.getItem("token");

  const api = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` },
  });

  const [requests, setRequests] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"ADD" | "EDIT" | "VIEW" | "DELETE">("ADD");
  const [form, setForm] = useState<any>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRequests = async () => {
    try {
      const res = await api.get("/attendance-request/me");
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to fetch attendance requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = (type: any, data?: any) => {
    setMode(type);
    setSelectedId(data?._id || null);
    setForm(data || {});
    setOpen(true);
  };

  const submit = async () => {
    try {
      if (mode === "ADD") {
        const res = await api.post("/attendance-request", form);
        toast({
          type: "success",
          title: "Request Submitted",
          message: res.data?.message || "Attendance request added successfully",
        });
      }
      if (mode === "EDIT") {
        const res = await api.put(`/attendance-request/${selectedId}`, form);
        toast({
          type: "success",
          title: "Request Updated",
          message: res.data?.message || "Attendance request updated successfully",
        });
      }
      if (mode === "DELETE") {
        const res = await api.delete(`/attendance-request/${selectedId}`);
        toast({
          type: "success",
          title: "Request Deleted",
          message: res.data?.message || "Attendance request deleted successfully",
        });
      }

      setOpen(false);
      setSelectedId(null);
      setForm({});
      fetchRequests();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Action Failed",
        message: error?.response?.data?.message || "Something went wrong, please try again",
      });
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) =>
      r.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requests, searchTerm]);

  const pendingCount = useMemo(() => requests.filter((r) => r.status === "PENDING").length, [requests]);
  const approvedCount = useMemo(() => requests.filter((r) => r.status === "APPROVED").length, [requests]);
  const rejectedCount = useMemo(() => requests.filter((r) => r.status === "REJECTED").length, [requests]);

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Attendance Requests
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Submit and manage your attendance correction requests.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openModal("ADD")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-semibold text-xs shadow-premium-sm hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          New Request
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={requests.length} icon={ClipboardList} tone="primary" />
        <StatCard label="Pending Review" value={pendingCount} icon={Clock} tone="warning" />
        <StatCard label="Approved" value={approvedCount} icon={CheckCircle2} tone="good" />
        <StatCard label="Rejected" value={rejectedCount} icon={XCircle} tone="critical" />
      </div>

      {/* TABLE PANEL */}
      <DashboardPanel title="My Correction Requests" subtitle="Your submitted attendance regularizations">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by type or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
            />
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="py-12 text-center text-[var(--muted-foreground)] text-xs">
            <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm text-[var(--foreground)]">No requests found</p>
            <p className="text-xs mt-1">Click "New Request" to submit an attendance correction.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-semibold border-b border-[var(--border)]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Request Type</th>
                  <th className="p-3">Punch In</th>
                  <th className="p-3">Punch Out</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                {filteredRequests.map((r, i) => {
                  const isApproved = r.status === "APPROVED";
                  const isRejected = r.status === "REJECTED";
                  return (
                    <tr key={r._id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="p-3 text-[var(--muted-foreground)]">{i + 1}</td>
                      <td className="p-3 font-medium text-[var(--foreground)]">
                        {new Date(r.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-3 font-semibold text-[var(--foreground)]">{r.type}</td>
                      <td className="p-3 text-[var(--foreground)]">{r.punchIn || "—"}</td>
                      <td className="p-3 text-[var(--foreground)]">{r.punchOut || "—"}</td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase",
                          isApproved && "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
                          isRejected && "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
                          !isApproved && !isRejected && "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                        )}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openModal("VIEW", r)}
                            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--primary)] hover:bg-[var(--muted)] transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {r.status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                onClick={() => openModal("EDIT", r)}
                                className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                                title="Edit"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openModal("DELETE", r)}
                                className="p-1.5 rounded-lg border border-[color-mix(in_oklab,var(--status-critical)_25%,transparent)] text-[var(--status-critical)] hover:bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>

      <AttendanceRequestModal
        open={open}
        mode={mode}
        form={form}
        setForm={setForm}
        onClose={() => setOpen(false)}
        onSubmit={submit}
      />
    </div>
  );
}
