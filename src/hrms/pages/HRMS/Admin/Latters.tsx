/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Archive,
  ArchiveRestore,
  Award,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eraser,
  Eye,
  FileText,
  Filter,
  Search,
  Send,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Loader from "../Loader";
import { toast } from "../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;
const ViewAPI = API_BASE.replace("/api", "");

/* ================= MODAL ================= */
const Modal = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) => {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-3xl max-h-[90vh] flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-premium-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

/* ================= INTERFACES ================= */
interface User {
  _id: string;
  name: string;
  role: string;
}

interface LetterHistory {
  _id: string;
  letterType: string;
  createdAt: string;
  filePath: string;
  user: {
    name: string;
    role: string;
  };
  message?: string;
  isArchived: boolean;
}

const LETTER_TYPES = [
  { label: "Offer Letter", value: "OFFER" },
  { label: "Appointment Letter", value: "APPOINTMENT" },
  { label: "Promotion Letter", value: "PROMOTION" },
  { label: "Warning Letter", value: "WARNING" },
  { label: "Relieving Letter", value: "RELIEVING" },
  { label: "F&F Settlement Letter", value: "FF_SETTLEMENT" },
  { label: "Experience Letter", value: "EXPERIENCE" },
  { label: "Termination Letter", value: "TERMINATION" },
  { label: "Appreciation Letter", value: "APPRECIATION" },
  { label: "Training Letter", value: "TRAINING" },
];

const Letters = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [letters, setLetters] = useState<LetterHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSendModal, setOpenSendModal] = useState(false);
  const [viewLetter, setViewLetter] = useState<LetterHistory | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "ARCHIVE">("ALL");
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: "ARCHIVE" | "UNARCHIVE" } | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    letterType: "",
    startDate: "",
    endDate: "",
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [form, setForm] = useState({
    letterType: "",
    userId: "",
    message: "",
    file: null as File | null,
  });

  const [errors, setErrors] = useState({
    letterType: "",
    userId: "",
    file: "",
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ================= FETCH DATA ================= */
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users`, {
        params: { excludeRoles: "superadmin" },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(res.data.data || res.data); // Handle both paginated and non-paginated user fetch safely
    } catch (err) {
      console.error("Failed to fetch users");
    }
  };

  const fetchLetters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (filters.letterType && filters.letterType !== "all_types") params.append("letterType", filters.letterType);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const res = await axios.get(`${API_BASE}/letters?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setLetters(res.data);
    } catch (err) {
      console.error("Failed to fetch letters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLetters();
  }, [debouncedSearch, filters.letterType, filters.startDate, filters.endDate]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.letterType, filters.startDate, filters.endDate, activeTab, pageSize]);

  /* ================= VALIDATION ================= */
  const validate = () => {
    let valid = true;
    const e = { letterType: "", userId: "", file: "" };

    if (!form.letterType) (e.letterType = "Required"), (valid = false);
    if (!form.userId) (e.userId = "Required"), (valid = false);
    if (!form.file) (e.file = "Upload letter"), (valid = false);

    setErrors(e);
    return valid;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("letterType", form.letterType);
      fd.append("userId", form.userId);
      fd.append("message", form.message);
      fd.append("file", form.file as File);

      const res = await axios.post(`${API_BASE}/letters`, fd, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        type: "success",
        title: "Letter Sent",
        message: res.data?.message || "Letter has been sent successfully.",
      });

      setForm({ letterType: "", userId: "", message: "", file: null });
      setOpenSendModal(false);
      fetchLetters();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Failed to Send Letter",
        message: error?.response?.data?.message || "Unable to send the letter.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= TOGGLE ARCHIVE ================= */
  const handleToggleArchive = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await axios.patch(
        `${API_BASE}/letters/${id}/toggle-archive`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      toast({
        type: "success",
        title: "Status Updated",
        message: res.data?.message || "Operation successful.",
      });

      fetchLetters();
      if (viewLetter && viewLetter._id === id) {
        setViewLetter({ ...viewLetter, isArchived: !viewLetter.isArchived });
      }
      setConfirmAction(null);
    } catch (error: any) {
      toast({
        type: "error",
        title: "Action Failed",
        message: error?.response?.data?.message || "Something went wrong.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      letterType: "",
      startDate: "",
      endDate: "",
    });
  };

  const filteredLetters = letters.filter((l) =>
    activeTab === "ALL" ? !l.isArchived : l.isArchived
  );

  const paginatedLetters = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLetters.slice(start, start + pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLetters, page, pageSize]);

  /* ================= KPI DATA (derived from the currently fetched/filtered letters) ================= */
  const kpis = useMemo(() => {
    const total = letters.length;
    const active = letters.filter((l) => !l.isArchived).length;

    const typeCounts: Record<string, number> = {};
    letters.forEach((l) => {
      typeCounts[l.letterType] = (typeCounts[l.letterType] || 0) + 1;
    });
    const topEntry = Object.entries(typeCounts).reduce<[string, number] | null>(
      (best, entry) => (!best || entry[1] > best[1] ? entry : best),
      null
    );
    const topTypeLabel = topEntry
      ? LETTER_TYPES.find((t) => t.value === topEntry[0])?.label || topEntry[0]
      : "—";
    const topTypeCount = topEntry ? topEntry[1] : 0;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentlyAdded = letters.filter((l) => new Date(l.createdAt).getTime() >= thirtyDaysAgo).length;

    return { total, active, topTypeLabel, topTypeCount, recentlyAdded };
  }, [letters]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Letters
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Employee Management <span className="mx-1">›</span> Letters
          </p>
        </div>
        <Button
          onClick={() => setOpenSendModal(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
        >
          <Send className="h-4 w-4" />
          Send Letter
        </Button>
      </div>

      {/* ================= KPI ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Letters" value={kpis.total} icon={FileText} tone="primary" sublabel="Matching current filters" />
        <StatCard
          label="Active Letters"
          value={kpis.active}
          icon={CheckCircle2}
          tone="good"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.active / kpis.total) * 100) : 0}% of total`}
        />
        <StatCard
          label="Most Issued Type"
          value={kpis.topTypeCount}
          icon={Award}
          tone="violet"
          sublabel={kpis.topTypeLabel}
        />
        <StatCard
          label="Recently Added"
          value={kpis.recentlyAdded}
          icon={CalendarPlus}
          tone="warning"
          sublabel="In last 30 days"
        />
      </div>

      {/* ================= FILTERS SECTION ================= */}
      <div className="card-premium shadow-premium-sm overflow-hidden">
        <div
          className="flex cursor-pointer items-center justify-between bg-[var(--muted)] px-6 py-3"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
            <Filter size={18} />
            <span>Search & Filters</span>
          </div>
          {showFilters ? <ChevronUp size={18} className="text-[var(--muted-foreground)]" /> : <ChevronDown size={18} className="text-[var(--muted-foreground)]" />}
        </div>

        {showFilters && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              {/* Search Employee */}
              <div className="space-y-1.5 md:col-span-3">
                <Label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Search Employee</Label>
                <div className="relative">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <Input
                    placeholder="Search by name..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Letter Type */}
              <div className="space-y-1.5 md:col-span-3">
                <Label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Letter Type</Label>
                <Select value={filters.letterType} onValueChange={(v) => setFilters({ ...filters, letterType: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_types">All Types</SelectItem>
                    {LETTER_TYPES.map((lt) => (
                      <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-1.5 md:col-span-4">
                <Label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="text-xs flex-1"
                  />
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="text-xs flex-1"
                  />
                </div>
              </div>

              {/* Clear Button */}
              <div className="md:col-span-2 flex justify-start">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full h-[40px] gap-2 border-[var(--border)] bg-[var(--card)] px-3 text-[10px] font-bold uppercase text-[var(--foreground)] hover:bg-[var(--muted)]"
                  title="Clear all filters"
                >
                  <Eraser size={14} />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= TABS ================= */}
      <div className="flex gap-4 border-b border-[var(--border)]">
        <button
          className={cn(
            "pb-2 px-4 transition-all",
            activeTab === "ALL"
              ? "border-b-2 border-[var(--primary)] font-semibold text-[var(--primary)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
          onClick={() => setActiveTab("ALL")}
        >
          All Letters
        </button>
        <button
          className={cn(
            "pb-2 px-4 transition-all",
            activeTab === "ARCHIVE"
              ? "border-b-2 border-[var(--primary)] font-semibold text-[var(--primary)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
          onClick={() => setActiveTab("ARCHIVE")}
        >
          Archived Documents
        </button>
      </div>

      {/* ================= TABLE ================= */}
      {loading ? (
        <div className="py-20 flex justify-center"><Loader /></div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Sr.No</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3 text-center">Letter Type</th>
                  <th className="px-4 py-3 text-center">Issued On</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredLetters.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center italic text-[var(--muted-foreground)]">
                      No letters found matching the criteria.
                    </td>
                  </tr>
                )}
                {paginatedLetters.map((l, i) => (
                  <tr key={l._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{(page - 1) * pageSize + i + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-xs font-bold uppercase text-[var(--primary)]">
                          {l.user?.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--foreground)]">{l.user?.name}</div>
                          <div className="text-[10px] font-bold uppercase tracking-tighter text-[var(--muted-foreground)]">{l.user?.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="rounded-full bg-[var(--muted)] px-3 py-1 text-[10px] font-bold text-[var(--foreground)]">
                        {LETTER_TYPES.find((t) => t.value === l.letterType)?.label || l.letterType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-medium text-[var(--muted-foreground)]">
                      {new Date(l.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="View"
                          className="text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                          onClick={() => setViewLetter(l)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title={activeTab === "ALL" ? "Archive" : "Unarchive"}
                          className={cn(
                            "text-[var(--muted-foreground)]",
                            activeTab === "ALL"
                              ? "hover:bg-[color-mix(in_oklab,var(--status-warning)_12%,transparent)] hover:text-[var(--status-warning)]"
                              : "hover:bg-[color-mix(in_oklab,var(--status-good)_12%,transparent)] hover:text-[var(--status-good)]"
                          )}
                          onClick={() => setConfirmAction({ id: l._id, type: activeTab === "ALL" ? "ARCHIVE" : "UNARCHIVE" })}
                          disabled={actionLoading}
                        >
                          {activeTab === "ALL" ? <Archive size={16} /> : <ArchiveRestore size={16} />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="md:hidden space-y-4 p-4">
            {filteredLetters.length === 0 && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-10 text-center italic text-[var(--muted-foreground)]">
                No letters found.
              </div>
            )}
            {paginatedLetters.map((l) => (
              <div key={l._id} className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-premium-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-xs font-bold text-[var(--primary)]">
                      {l.user?.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold leading-tight text-[var(--foreground)]">{l.user?.name}</div>
                      <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">{l.user?.role}</div>
                    </div>
                  </div>
                  <span className="rounded bg-[var(--muted)] px-2 py-0.5 text-[9px] font-bold text-[var(--foreground)]">
                    {LETTER_TYPES.find((t) => t.value === l.letterType)?.label || l.letterType}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
                  <div className="text-[10px] font-medium text-[var(--muted-foreground)]">
                    {new Date(l.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 border-[var(--border)] px-3 text-[10px] font-bold text-[var(--foreground)] hover:bg-[var(--muted)]"
                      onClick={() => setViewLetter(l)}
                    >
                      View
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className={cn(
                        "text-[var(--muted-foreground)]",
                        activeTab === "ALL" ? "hover:text-[var(--status-warning)]" : "hover:text-[var(--status-good)]"
                      )}
                      onClick={() => setConfirmAction({ id: l._id, type: activeTab === "ALL" ? "ARCHIVE" : "UNARCHIVE" })}
                      disabled={actionLoading}
                    >
                      {activeTab === "ALL" ? <Archive size={14} /> : <ArchiveRestore size={14} />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLetters.length > 0 && (
            <div className="border-t border-[var(--border)] px-4 py-3.5">
              <TablePagination
                page={page}
                pageSize={pageSize}
                total={filteredLetters.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                itemLabel="letters"
              />
            </div>
          )}
        </div>
      )}

      {/* ================= SEND MODAL ================= */}
      {openSendModal && (
        <Modal title="Send Letter" onClose={() => setOpenSendModal(false)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Letter Type *</Label>
              <Select value={form.letterType} onValueChange={(v) => setForm({ ...form, letterType: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  {LETTER_TYPES.map((lt) => (
                    <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.letterType && <p className="mt-1 text-[10px] font-bold text-[var(--status-critical)]">{errors.letterType}</p>}
            </div>

            <div>
              <Label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Select User *</Label>
              <Select value={form.userId} onValueChange={(v) => setForm({ ...form, userId: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto z-[10000]">
                  {users.map((u) => (
                    <SelectItem key={u._id} value={u._id}>{u.name} — {u.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && <p className="mt-1 text-[10px] font-bold text-[var(--status-critical)]">{errors.userId}</p>}
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Upload Letter *</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                className="mt-1"
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
              />
              {errors.file && <p className="mt-1 text-[10px] font-bold text-[var(--status-critical)]">{errors.file}</p>}
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Message</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-1 min-h-[100px]"
                placeholder="Enter message for the employee..."
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 border-t border-[var(--border)] pt-4">
              <Button
                variant="outline"
                className="border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
                onClick={() => setOpenSendModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="gap-2 bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-8 text-white shadow-premium-sm transition-transform hover:opacity-90 active:scale-95"
              >
                {loading ? "Sending..." : "Send Letter"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= VIEW MODAL ================= */}
      {viewLetter && (
        <Modal title="Letter Details" onClose={() => setViewLetter(null)}>
          <div className="space-y-8 py-4 px-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-[var(--border)] pb-8">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Employee Information</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-lg font-bold text-[var(--primary)] shadow-premium-sm">
                    {viewLetter.user?.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-tight text-[var(--foreground)]">{viewLetter.user?.name}</p>
                    <p className="text-xs font-bold uppercase tracking-tight text-[var(--muted-foreground)]">{viewLetter.user?.role}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Letter Record</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-[var(--muted)] p-2">
                    <p className="text-[9px] font-bold uppercase text-[var(--muted-foreground)]">Document Type</p>
                    <p className="text-sm font-bold text-[var(--foreground)]">
                      {LETTER_TYPES.find((t) => t.value === viewLetter.letterType)?.label || viewLetter.letterType}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--muted)] p-2">
                    <p className="text-[9px] font-bold uppercase text-[var(--muted-foreground)]">Issued Date</p>
                    <p className="text-sm font-bold text-[var(--foreground)]">
                      {new Date(viewLetter.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Notes / Message</p>
              <div className="min-h-[80px] rounded-xl border border-[var(--border)] bg-[var(--muted)] p-5 text-sm italic leading-relaxed text-[var(--muted-foreground)]">
                {viewLetter.message || "No specific notes provided for this letter."}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] p-5 shadow-premium-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-[var(--card)] p-3 text-[var(--primary)] shadow-premium-sm">
                  <ArrowUpRight size={24} />
                </div>
                <div>
                  <p className="text-base font-bold text-[var(--foreground)]">Official Document Patch</p>
                  <p className="text-[10px] font-medium italic text-[var(--muted-foreground)]">Click to view the attached PDF/DOC file</p>
                </div>
              </div>
              <Button
                size="lg"
                className="gap-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-8 text-white shadow-premium-sm transition-transform hover:opacity-90 active:scale-95"
                onClick={() => window.open(`${ViewAPI}/${viewLetter.filePath.replace(/\\/g, '/')}`, "_blank", "noopener,noreferrer")}
              >
                Open File
              </Button>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border)] pt-8">
              <Button
                variant="ghost"
                className="gap-2 font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                onClick={() => setConfirmAction({ id: viewLetter._id, type: viewLetter.isArchived ? "UNARCHIVE" : "ARCHIVE" })}
                disabled={actionLoading}
              >
                {viewLetter.isArchived ? (
                  <>
                    <ArchiveRestore size={18} />
                    Unarchive Record
                  </>
                ) : (
                  <>
                    <Archive size={18} />
                    Move to Archive
                  </>
                )}
              </Button>
              <Button
                onClick={() => setViewLetter(null)}
                variant="secondary"
                className="bg-[var(--muted)] px-8 text-[10px] font-bold uppercase text-[var(--foreground)] hover:bg-[var(--border)]"
              >
                Close Details
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= CONFIRMATION MODAL ================= */}
      {confirmAction && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-premium-lg">
            <div className="flex flex-col items-center space-y-5 text-center">
              <div
                className={cn(
                  "rounded-3xl p-5",
                  confirmAction.type === "ARCHIVE"
                    ? "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                    : "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)] shadow-inner"
                )}
              >
                {confirmAction.type === "ARCHIVE" ? <Archive size={40} /> : <ArchiveRestore size={40} />}
              </div>
              <div>
                <h3 className="text-xl font-bold leading-tight text-[var(--foreground)]">
                  {confirmAction.type === "ARCHIVE" ? "Archive this document?" : "Restore from Archive?"}
                </h3>
                <p className="mt-2 px-4 text-xs leading-relaxed text-[var(--muted-foreground)]">
                  {confirmAction.type === "ARCHIVE"
                    ? "This record will be moved to the archive list for long-term storage."
                    : "This record will be restored and moved back to the active letters list."}
                </p>
              </div>
              <div className="flex w-full gap-3 pt-4">
                <Button
                  variant="ghost"
                  className="flex-1 font-bold text-[var(--muted-foreground)]"
                  onClick={() => setConfirmAction(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  className={cn(
                    "flex-1 rounded-xl font-bold text-white shadow-premium-sm",
                    confirmAction.type === "ARCHIVE"
                      ? "bg-[var(--status-warning)] hover:opacity-90"
                      : "bg-[var(--status-good)] hover:opacity-90"
                  )}
                  onClick={() => handleToggleArchive(confirmAction.id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Wait..." : confirmAction.type === "ARCHIVE" ? "Confirm Archive" : "Confirm Restore"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Letters;
