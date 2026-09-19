import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import Loader from "../Loader";
import { toast } from "../Alert/Toast";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

const AllAttendanceRequests = () => {
  const token = localStorage.getItem("token");
  const [searchParams, setSearchParams] = useSearchParams();

  const [requests, setRequests] = useState<any[]>([]);
  const [view, setView] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // 🔍 URL params
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";

  // 🔍 local input (typing)
  const [searchInput, setSearchInput] = useState(search);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/attendance-request/all`, {
        params: { page, search },
        headers: { Authorization: `Bearer ${token}` },
      });
      // Handle both paginated and non-paginated responses for safety
      if (res.data.data) {
        setRequests(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalUsers(res.data.totalUsers || 0);
      } else {
        setRequests(res.data || []);
        setTotalPages(1);
        setTotalUsers(res.data.length || 0);
      }
    } catch (err) {
      console.error("Failed to fetch requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
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

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/attendance-request/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast({
        type: "success",
        title: "Status Updated",
        message:
          res.data?.message ||
          `Attendance request has been ${status.toLowerCase()} successfully.`,
      });

      fetchRequests();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Update Failed",
        message:
          error?.response?.data?.message ||
          "Failed to update attendance request status.",
      });
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-GB");

  const statusStyle = (status: string) => {
    if (status === "APPROVED")
      return "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)] border-[color-mix(in_oklab,var(--status-good)_30%,transparent)]";
    if (status === "REJECTED")
      return "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)] border-[color-mix(in_oklab,var(--status-critical)_30%,transparent)]";
    return "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)] border-[color-mix(in_oklab,var(--status-warning)_30%,transparent)]";
  };

  if (loading && requests.length === 0) {
    return (
      <div className="p-10 flex justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Attendance Requests</h2>
        <input
          type="text"
          placeholder="Search employee, type, status..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full md:w-80 h-10 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      <div className="card-premium shadow-premium-sm overflow-x-auto min-h-[400px]">
        <table className="min-w-full text-sm text-center">
          <thead className="bg-[var(--muted)]">
            <tr>
              <th className="p-3 text-[var(--muted-foreground)]">Employee</th>
              <th className="p-3 text-[var(--muted-foreground)]">Date</th>
              <th className="p-3 text-[var(--muted-foreground)]">Type</th>
              <th className="p-3 text-[var(--muted-foreground)]">Punch In</th>
              <th className="p-3 text-[var(--muted-foreground)]">Punch Out</th>
              <th className="p-3 text-[var(--muted-foreground)]">Status</th>
              <th className="p-3 text-[var(--muted-foreground)]">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border)]">
            {requests.map((r) => (
              <tr key={r._id} className="hover:bg-[var(--muted)] transition-colors">
                <td className="p-3 font-medium text-[var(--foreground)]">{r.user?.name || "Unknown"}</td>
                <td className="p-3 text-[var(--foreground)]">{formatDate(r.date)}</td>
                <td className="p-3 text-[var(--foreground)]">{r.type}</td>
                <td className="p-3 text-[var(--foreground)]">{r.punchIn || "-"}</td>
                <td className="p-3 text-[var(--foreground)]">{r.punchOut || "-"}</td>

                <td className="p-3">
                  <select
                    value={r.status}
                    onChange={(e) => updateStatus(r._id, e.target.value)}
                    className={`px-2 py-1 rounded-md border text-xs font-semibold outline-none cursor-pointer
    ${statusStyle(r.status)}
  `}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </td>

                <td
                  className="p-3 text-[var(--primary)] font-medium text-xs cursor-pointer hover:underline"
                  onClick={() => setView(r)}
                >
                  View
                </td>
              </tr>
            ))}

            {requests.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="p-10 text-[var(--muted-foreground)]">
                  No attendance requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card-premium shadow-premium-sm mt-6 flex justify-between items-center p-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          Showing <span className="font-medium text-[var(--foreground)]">{requests.length}</span> of{" "}
          <span className="font-medium text-[var(--foreground)]">{totalUsers}</span> requests
        </p>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setSearchParams({ page: p.toString(), search })}
        />
      </div>

      {/* ================= VIEW MODAL ================= */}
      {view && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="card-premium shadow-premium-lg rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 border-b border-[var(--border)] pb-2 text-[var(--foreground)]">
              Attendance Request Detail
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)] font-medium">Employee:</span>
                <span className="font-semibold text-[var(--foreground)]">{view.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)] font-medium">Date:</span>
                <span className="text-[var(--foreground)]">{formatDate(view.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)] font-medium">Type:</span>
                <span className="capitalize text-[var(--foreground)]">{view.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)] font-medium">Punch In:</span>
                <span className="text-[var(--foreground)]">{view.punchIn || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)] font-medium">Punch Out:</span>
                <span className="text-[var(--foreground)]">{view.punchOut || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)] font-medium">Status:</span>
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", statusStyle(view.status))}>
                  {view.status}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-[var(--muted-foreground)] font-medium block mb-1">Reason:</span>
                <p className="bg-[var(--muted)] p-2 rounded text-[var(--foreground)] italic border border-[var(--border)]">
                  {view.reason || "No reason provided"}
                </p>
              </div>
            </div>

            <div className="text-right mt-6">
              <button
                onClick={() => setView(null)}
                className="px-6 py-2 text-sm font-medium bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAttendanceRequests;
