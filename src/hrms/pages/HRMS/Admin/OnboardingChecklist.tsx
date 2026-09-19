import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Building2,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileCheck,
  Users,
  FileStack,
} from "lucide-react";
import { toast } from "../Alert/Toast";
import Loader from "../Loader";
import { Pagination } from "@/components/ui/pagination";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

type DocStatus = "PENDING" | "VERIFIED" | "REJECTED" | "NOT_UPLOADED";

interface Document {
  type: string;
  status: DocStatus;
}

interface DocumentTypeConfig {
  _id: string;
  key: string;
  label: string;
  description?: string;
}

interface ChecklistRow {
  userId: string;
  name: string;
  role: string;
  email: string;
  employeeId: string;
  documents: Document[];
}

const statusToneClasses: Record<DocStatus, string> = {
  VERIFIED: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
  REJECTED: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
  PENDING: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
  NOT_UPLOADED: "bg-[var(--muted)] text-[var(--muted-foreground)]",
};

const statusIcons: Record<DocStatus, React.ReactNode> = {
  VERIFIED: <CheckCircle2 className="h-3 w-3" />,
  REJECTED: <XCircle className="h-3 w-3" />,
  PENDING: <Clock className="h-3 w-3" />,
  NOT_UPLOADED: <AlertCircle className="h-3 w-3" />,
};

const StatusBadge = ({ status }: { status: DocStatus }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
      statusToneClasses[status]
    )}
  >
    {statusIcons[status]}
    {status.replace("_", " ")}
  </span>
);

const OnboardingChecklist = () => {
  const [data, setData] = useState<ChecklistRow[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(search);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const token = localStorage.getItem("token");

  /* ================= FETCH ================= */
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/documents/onboarding/checklist`, {
        params: { page, search },
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.totalRecords || 0);
    } catch (error) {
      toast({ type: "error", title: "Fetch Failed", message: "Failed to load onboarding checklist" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);

  /* ================= FETCH DOCUMENT TYPES ================= */
  const fetchDocumentTypes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/document-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocumentTypes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load document types", error);
    }
  };

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  /* ================= DEBOUNCE SEARCH ================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearchParams({ page: "1", search: searchInput.trim() });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const requiredKeys = documentTypes.map((dt) => dt.key);

  const getDocStatus = (docs: Document[], type: string): DocStatus => {
    const doc = docs.find((d) => d.type === type);
    return (doc?.status as DocStatus) || "NOT_UPLOADED";
  };

  const getUploadedCount = (docs: Document[]) => {
    return docs.filter((d) => requiredKeys.includes(d.type)).length;
  };

  /* ================= KPIs (from genuinely fetched data) ================= */
  const kpis = useMemo(() => {
    const fullyDocumented = data.filter(
      (row) => documentTypes.length > 0 && getUploadedCount(row.documents) === documentTypes.length
    ).length;
    const incomplete = data.length - fullyDocumented;
    return { fullyDocumented, incomplete };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, documentTypes]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Onboarding Checklist
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Onboarding <span className="mx-1">›</span> Checklist
          </p>
        </div>
      </div>

      {/* ================= KPI ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Talent Records" value={totalRecords} icon={Users} tone="primary" sublabel="Across all pages" />
        <StatCard label="Document Types Tracked" value={documentTypes.length} icon={FileStack} tone="violet" sublabel="Required per profile" />
        <StatCard
          label="Fully Documented"
          value={kpis.fullyDocumented}
          icon={FileCheck}
          tone="good"
          sublabel={`Of ${data.length} shown on this page`}
        />
        <StatCard
          label="Incomplete"
          value={kpis.incomplete}
          icon={AlertCircle}
          tone="warning"
          sublabel={`Of ${data.length} shown on this page`}
        />
      </div>

      {/* ================= TOOLBAR ================= */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search active talent by name or email..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="card-premium shadow-premium-sm overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-[var(--card)]/60 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <Loader />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-[var(--muted)]">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="px-4 py-3 min-w-[240px]">Candidate</th>
                <th className="px-4 py-3 text-center">Progress</th>
                {documentTypes.map((dt) => (
                  <th key={dt.key} className="px-4 py-3">
                    {dt.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.length === 0 && !loading ? (
                <tr>
                  <td colSpan={2 + documentTypes.length} className="px-4 py-20 text-center text-sm text-[var(--muted-foreground)]">
                    No onboarding profiles match your search
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.userId} className="transition-colors hover:bg-[var(--muted)] group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)] font-semibold">
                          {row.name.charAt(0)}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-medium text-[var(--foreground)] flex items-center gap-1.5">
                            {row.name}
                            {documentTypes.length > 0 && getUploadedCount(row.documents) === documentTypes.length && (
                              <FileCheck className="h-3.5 w-3.5 text-[var(--status-good)]" />
                            )}
                          </p>
                          <div className="flex flex-col gap-0.5">
                            <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {row.role}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {row.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-[var(--foreground)]">
                          {getUploadedCount(row.documents)} <span className="text-[var(--muted-foreground)]">/</span> {documentTypes.length}
                        </span>
                        <div className="w-20 h-1 bg-[var(--muted)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--primary)] transition-all duration-500"
                            style={{
                              width: `${
                                documentTypes.length > 0
                                  ? (getUploadedCount(row.documents) / documentTypes.length) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {documentTypes.map((dt) => (
                      <td key={dt.key} className="px-4 py-3.5">
                        <StatusBadge status={getDocStatus(row.documents, dt.key)} />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--border)] px-4 py-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--muted-foreground)]">
            Showing <span className="font-medium text-[var(--foreground)]">{data.length}</span> of{" "}
            <span className="font-medium text-[var(--foreground)]">{totalRecords}</span> talent records
          </p>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => setSearchParams({ page: p.toString(), search })}
          />
        </div>
      </div>
    </div>
  );
};

export default OnboardingChecklist;
