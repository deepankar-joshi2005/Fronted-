/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Search,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Clock,
  X,
  Settings2,
  FileCheck2,
  FolderClock,
} from "lucide-react";
import Loader from "../Loader";
import { toast } from "../Alert/Toast";
import DocumentTypeManagerModal from "./DocumentTypeManagerModal";
import type { DocumentTypeItem } from "./DocumentTypeManagerModal";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;
const BASE_URL = API_BASE?.replace("/api", "") || "";

/* ================= TYPES ================= */

interface DocRecord {
  _id: string;
  user: { _id: string } | string;
  documentType: string;
  documentName: string;
  fileUrl: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
}

interface EmployeeRow {
  _id: string;
  name: string;
  employeeId?: string;
  email?: string;
  role?: string;
}

/* ================= COMPONENT ================= */

export default function Document() {
  const token = localStorage.getItem("token");

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 15;
  const [selectedEmp, setSelectedEmp] = useState<EmployeeRow | null>(null);
  const [actingDocId, setActingDocId] = useState<string | null>(null);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeItem[]>([]);
  const [manageTypesOpen, setManageTypesOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  // Documents aren't paginated here — they're supporting data used to
  // compute the uploaded/verified badges for whichever employees are on the
  // current page, not the resource being listed, so the bulk fetch stays.
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [usersRes, docsRes, typesRes] = await Promise.all([
        axios.get(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page, limit, search: search || undefined },
        }),
        axios.get(`${API_BASE}/documents/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE}/document-types`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setEmployees(usersRes.data?.data || []);
      setTotalUsers(usersRes.data?.totalUsers || 0);
      setDocs(Array.isArray(docsRes.data) ? docsRes.data : []);
      setDocumentTypes(Array.isArray(typesRes.data) ? typesRes.data : []);
    } catch (error) {
      console.error("Failed to load document verification data", error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  // Returns one document per type for this employee — the most recently
  // uploaded one — so stale duplicate rows never cause the counts or the
  // review modal to reference the wrong record.
  const docsForUser = (userId: string) => {
    const all = docs.filter(
      (d) => (typeof d.user === "string" ? d.user : d.user?._id) === userId
    );
    const latestByType = new Map<string, DocRecord>();
    for (const doc of all) {
      const existing = latestByType.get(doc.documentType);
      if (
        !existing ||
        new Date(doc.createdAt).getTime() > new Date(existing.createdAt).getTime()
      ) {
        latestByType.set(doc.documentType, doc);
      }
    }
    return Array.from(latestByType.values());
  };

  const handleSetStatus = async (
    docId: string,
    status: "VERIFIED" | "REJECTED",
    rejectionReason?: string
  ) => {
    try {
      setActingDocId(docId);
      await axios.patch(
        `${API_BASE}/documents/${docId}/status`,
        status === "REJECTED" ? { status, rejectionReason } : { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        type: "success",
        title: status === "VERIFIED" ? "Document Verified" : "Document Rejected",
        message: `Document has been marked as ${status.toLowerCase()}`,
      });
      await fetchAll();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Action Failed",
        message: error?.response?.data?.message || "Could not update document status",
      });
    } finally {
      setActingDocId(null);
    }
  };

  const totalPages = Math.ceil(totalUsers / limit) || 1;

  /* ================= KPI DATA (derived from the already-fetched documents) ================= */
  const kpis = useMemo(() => {
    const total = docs.length;
    const pending = docs.filter((d) => d.status === "PENDING").length;
    const verified = docs.filter((d) => d.status === "VERIFIED").length;
    const rejected = docs.filter((d) => d.status === "REJECTED").length;
    return { total, pending, verified, rejected };
  }, [docs]);

  if (loading && initialLoad) return <Loader />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Document Verification
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Employee Management <span className="mx-1">›</span> Document Verification
          </p>
        </div>
        <button
          onClick={() => setManageTypesOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
        >
          <Settings2 className="h-4 w-4" />
          Manage Document Types
        </button>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Documents" value={kpis.total} icon={FileText} tone="primary" sublabel="Uploaded across all employees" />
        <StatCard
          label="Pending Review"
          value={kpis.pending}
          icon={FolderClock}
          tone="warning"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.pending / kpis.total) * 100) : 0}% of total`}
        />
        <StatCard
          label="Verified"
          value={kpis.verified}
          icon={FileCheck2}
          tone="good"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.verified / kpis.total) * 100) : 0}% of total`}
        />
        <StatCard
          label="Rejected"
          value={kpis.rejected}
          icon={XCircle}
          tone="critical"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.rejected / kpis.total) * 100) : 0}% of total`}
        />
      </div>

      {/* TOOLBAR */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, employee ID, email..."
          className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
        />
      </div>

      {/* TABLE */}
      {employees.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <FileText className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No employees found</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-center">Uploaded</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {employees.map((emp) => {
                  const empDocs = docsForUser(emp._id);
                  const uploadedCount = empDocs.length;
                  const verifiedCount = empDocs.filter((d) => d.status === "VERIFIED").length;
                  const rejectedCount = empDocs.filter((d) => d.status === "REJECTED").length;
                  const pendingCount = empDocs.filter((d) => d.status === "PENDING").length;
                  const total = documentTypes.length;

                  const overallStatus =
                    rejectedCount > 0
                      ? "REJECTED"
                      : total > 0 && verifiedCount === total
                      ? "VERIFIED"
                      : pendingCount > 0 || uploadedCount > 0
                      ? "PENDING"
                      : "NOT_STARTED";

                  const statusMeta: Record<string, { label: string; tone: "good" | "warning" | "critical" | "muted" }> = {
                    VERIFIED: { label: "Verified", tone: "good" },
                    PENDING: { label: "Pending Review", tone: "warning" },
                    REJECTED: { label: "Action Needed", tone: "critical" },
                    NOT_STARTED: { label: "Not Uploaded", tone: "muted" },
                  };
                  const meta = statusMeta[overallStatus];

                  return (
                    <tr key={emp._id} className="transition-colors hover:bg-[var(--muted)]">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-[var(--foreground)]">{emp.name || "—"}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {emp.employeeId || "—"}
                          {emp.email ? ` • ${emp.email}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 capitalize text-[var(--muted-foreground)]">{emp.role || "—"}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--foreground)]">
                          {uploadedCount}/{total}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                            meta.tone === "good" &&
                              "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
                            meta.tone === "warning" &&
                              "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
                            meta.tone === "critical" &&
                              "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
                            meta.tone === "muted" && "bg-[var(--muted)] text-[var(--muted-foreground)]"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              meta.tone === "good" && "bg-[var(--status-good)]",
                              meta.tone === "warning" && "bg-[var(--status-warning)]",
                              meta.tone === "critical" && "bg-[var(--status-critical)]",
                              meta.tone === "muted" && "bg-[var(--muted-foreground)]"
                            )}
                          />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setSelectedEmp(emp)}
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--muted)]"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Documents
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="border-t border-[var(--border)] px-4 py-3.5">
              <TablePagination
                page={page}
                pageSize={limit}
                total={totalUsers}
                onPageChange={setPage}
                onPageSizeChange={() => {}}
                pageSizeOptions={[limit]}
                itemLabel="employees"
              />
            </div>
          )}
        </div>
      )}

      {selectedEmp && (
        <DocumentReviewModal
          employee={selectedEmp}
          docs={docsForUser(selectedEmp._id)}
          documentTypes={documentTypes}
          actingDocId={actingDocId}
          onClose={() => setSelectedEmp(null)}
          onSetStatus={handleSetStatus}
        />
      )}

      <DocumentTypeManagerModal
        open={manageTypesOpen}
        onClose={() => setManageTypesOpen(false)}
        onChange={fetchAll}
      />
    </div>
  );
}

/* ================= REVIEW MODAL ================= */

function DocumentReviewModal({
  employee,
  docs,
  documentTypes,
  actingDocId,
  onClose,
  onSetStatus,
}: {
  employee: EmployeeRow;
  docs: DocRecord[];
  documentTypes: DocumentTypeItem[];
  actingDocId: string | null;
  onClose: () => void;
  onSetStatus: (docId: string, status: "VERIFIED" | "REJECTED", rejectionReason?: string) => void;
}) {
  const getDoc = (key: string) => docs.find((d) => d.documentType === key);
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const startReject = (docId: string) => {
    setRejectingDocId(docId);
    setRejectReason("");
  };

  const cancelReject = () => {
    setRejectingDocId(null);
    setRejectReason("");
  };

  const confirmReject = (docId: string) => {
    if (!rejectReason.trim()) return;
    onSetStatus(docId, "REJECTED", rejectReason.trim());
    setRejectingDocId(null);
    setRejectReason("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl max-h-[85vh] flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-premium-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">{employee.name}</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {employee.employeeId || "—"} • {employee.role || "—"}
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto p-5">
          {documentTypes.length === 0 && (
            <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">
              No document types configured yet. Use "Manage Document Types" to add one.
            </p>
          )}
          {documentTypes.map((dt) => {
            const doc = getDoc(dt.key);
            const isActing = !!doc && actingDocId === doc._id;
            return (
              <div key={dt.key} className="space-y-2 rounded-lg border border-[var(--border)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{dt.label}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{dt.description}</p>
                  </div>
                  {doc ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                        doc.status === "VERIFIED"
                          ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                          : doc.status === "REJECTED"
                          ? "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                          : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                      )}
                    >
                      {doc.status === "VERIFIED" ? (
                        <ShieldCheck size={12} />
                      ) : doc.status === "REJECTED" ? (
                        <XCircle size={12} />
                      ) : (
                        <Clock size={12} />
                      )}
                      {doc.status === "PENDING" ? "Pending Review" : doc.status === "VERIFIED" ? "Verified" : "Rejected"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-[var(--muted)] px-2.5 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                      Not Uploaded
                    </span>
                  )}
                </div>

                {doc?.status === "REJECTED" && doc.rejectionReason && (
                  <p className="rounded-md border border-[color-mix(in_oklab,var(--status-critical)_30%,transparent)] bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] px-2 py-1 text-xs text-[var(--status-critical)]">
                    Rejection reason: {doc.rejectionReason}
                  </p>
                )}

                {doc && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <a
                      href={
                        doc.fileUrl.startsWith("http")
                          ? doc.fileUrl
                          : `${BASE_URL}/${doc.fileUrl.replace(/\\/g, "/")}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                    >
                      <Eye size={13} /> View Document
                    </a>

                    {doc.status === "VERIFIED" ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-[var(--status-good)]">
                        <ShieldCheck size={13} /> Locked — employee cannot re-upload
                      </span>
                    ) : rejectingDocId === doc._id ? null : (
                      <div className="flex items-center gap-2">
                        <button
                          disabled={isActing}
                          onClick={() => startReject(doc._id)}
                          className="flex items-center gap-1 rounded-lg border border-[color-mix(in_oklab,var(--status-critical)_30%,transparent)] px-3 py-1.5 text-xs font-semibold text-[var(--status-critical)] transition-colors hover:bg-[color-mix(in_oklab,var(--status-critical)_12%,transparent)] disabled:opacity-50"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                        <button
                          disabled={isActing}
                          onClick={() => onSetStatus(doc._id, "VERIFIED")}
                          className="flex items-center gap-1 rounded-lg bg-[var(--status-good)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                        >
                          <CheckCircle2 size={13} /> {isActing ? "Saving..." : "Verify"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {doc && rejectingDocId === doc._id && (
                  <div className="mt-2 space-y-2 border-t border-[var(--border)] pt-2">
                    <label className="text-xs font-semibold text-[var(--foreground)]">
                      Reason for rejection <span className="text-[var(--status-critical)]">*</span>
                    </label>
                    <textarea
                      autoFocus
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Tell the employee why this document is being rejected..."
                      rows={2}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-xs text-[var(--foreground)] outline-none focus:border-[var(--status-critical)]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={cancelReject}
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={isActing || !rejectReason.trim()}
                        onClick={() => confirmReject(doc._id)}
                        className="flex items-center gap-1 rounded-lg bg-[var(--status-critical)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                      >
                        <XCircle size={13} /> {isActing ? "Rejecting..." : "Confirm Reject"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
