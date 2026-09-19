/** @format */

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  FileText,
  Upload,
  Eye,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Clock,
  XCircle,
  Lock,
  FileCheck,
} from "lucide-react";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;
const ViewAPI = API.replace("/api", "");

type DocStatus = "PENDING" | "VERIFIED" | "REJECTED";

interface UserDocument {
  _id: string;
  documentType: string;
  documentName: string;
  fileUrl: string;
  status: DocStatus;
  createdAt: string;
  rejectionReason?: string;
}

interface UserType {
  _id: string;
  name: string;
  employeeId?: string;
  designationId?: { name: string };
  departmentId?: { name: string };
}

interface DocumentTypeConfig {
  _id: string;
  key: string;
  label: string;
  description?: string;
}

/* ================= STATUS BADGE ================= */

const StatusBadge = ({ status }: { status?: DocStatus }) => {
  if (!status) return null;
  const map: Record<DocStatus, { icon: React.ReactNode; text: string; cls: string }> = {
    PENDING: {
      icon: <Clock className="h-3.5 w-3.5" />,
      text: "Pending Review",
      cls: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)] border border-[color-mix(in_oklab,var(--status-warning)_30%,transparent)]",
    },
    VERIFIED: {
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      text: "Verified",
      cls: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)] border border-[color-mix(in_oklab,var(--status-good)_30%,transparent)]",
    },
    REJECTED: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      text: "Rejected",
      cls: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)] border border-[color-mix(in_oklab,var(--status-critical)_30%,transparent)]",
    },
  };
  const { icon, text, cls } = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider", cls)}>
      {icon}
      {text}
    </span>
  );
};

export default function DocumentUpload() {
  const token = localStorage.getItem("token");
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = loggedInUser?.id || loggedInUser?._id;

  const [user, setUser] = useState<UserType | null>(null);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (error) {
      console.error("Failed to fetch user", error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API}/documents/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      const res = await axios.get(`${API}/document-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocumentTypes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch document types", error);
    }
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchUser(), fetchDocuments(), fetchDocumentTypes()]).finally(() =>
      setLoading(false)
    );
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDocument = (type: string) =>
    documents
      .filter((d) => d.documentType === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const handleUpload = async (file: File, type: string) => {
    try {
      setUploading(type);

      const existingDoc = getDocument(type);

      if (existingDoc?.status === "VERIFIED") {
        toast({
          type: "error",
          title: "Locked",
          message: "This document is already verified and cannot be re-uploaded",
        });
        return;
      }

      const formData = new FormData();
      formData.append("document", file);
      formData.append("documentType", type);

      if (existingDoc) {
        await axios.put(`${API}/documents/update/${existingDoc._id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        toast({
          type: "success",
          title: "Document Updated",
          message: "Document has been updated successfully",
        });
      } else {
        await axios.post(`${API}/documents/upload/${userId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        toast({
          type: "success",
          title: "Document Uploaded",
          message: "Document has been uploaded successfully",
        });
      }

      const inputRef = fileInputRefs.current[type];
      if (inputRef) inputRef.value = "";

      await fetchDocuments();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Upload Failed",
        message: error?.response?.data?.message || "Document upload failed, please try again",
      });
    } finally {
      setUploading(null);
    }
  };

  if (loading) return <Loader />;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "E";

  const uploadedCount = documentTypes.filter((d) => getDocument(d.key)).length;
  const verifiedCount = documentTypes.filter((d) => getDocument(d.key)?.status === "VERIFIED").length;
  const pendingCount = documentTypes.length - uploadedCount;
  const progress = documentTypes.length > 0 ? Math.round((uploadedCount / documentTypes.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-[var(--primary)]" />
            Document Upload & KYC Verification
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Upload mandatory KYC and personal documents required by HR.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] font-semibold text-xs shadow-premium-xs hover:bg-[var(--muted)] transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Status
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Mandatory Documents" value={documentTypes.length} icon={FileText} tone="primary" />
        <StatCard label="Uploaded Documents" value={uploadedCount} icon={CheckCircle} tone="good" />
        <StatCard label="Verified by HR" value={verifiedCount} icon={ShieldCheck} tone="violet" />
        <StatCard label="Pending Upload" value={pendingCount} icon={AlertCircle} tone="warning" />
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SIDEBAR PROFILE CARD */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 text-center sticky top-6 space-y-4 shadow-premium-sm">
            <div className="w-20 h-20 mx-auto rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-2xl font-bold shadow-premium-xs">
              {initials}
            </div>

            <div>
              <h2 className="text-base font-bold text-[var(--foreground)]">{user?.name || "Employee"}</h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{user?.employeeId || "—"}</p>
              {user?.designationId?.name && (
                <p className="text-xs font-semibold text-[var(--primary)] mt-1">{user.designationId.name}</p>
              )}
              {user?.departmentId?.name && (
                <p className="text-xs text-[var(--muted-foreground)]">{user.departmentId.name}</p>
              )}
            </div>

            {/* PROGRESS */}
            <div className="pt-4 border-t border-[var(--border)]">
              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-2 font-semibold">
                <span>Upload Progress</span>
                <span className="text-[var(--primary)]">
                  {uploadedCount}/{documentTypes.length}
                </span>
              </div>
              <div className="w-full bg-[var(--muted)] rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-center mt-2 font-bold text-[var(--foreground)]">
                {progress}% Complete
              </p>
            </div>
          </div>
        </div>

        {/* DOCUMENT LIST */}
        <div className="lg:col-span-3 space-y-4">
          <DashboardPanel title="Required Documents List" subtitle="Upload clear scan copies in PDF or image format">
            {documentTypes.length === 0 ? (
              <div className="py-12 text-center text-[var(--muted-foreground)] text-xs">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-40 text-[var(--primary)]" />
                <p className="font-semibold text-sm text-[var(--foreground)]">No document requirements configured</p>
                <p className="mt-1">Contact your administrator for document guidelines.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documentTypes.map((doc) => {
                  const uploadedDoc = getDocument(doc.key);
                  const isUploaded = !!uploadedDoc;
                  const isVerified = uploadedDoc?.status === "VERIFIED";
                  const isUploading = uploading === doc.key;

                  return (
                    <div
                      key={doc.key}
                      className={cn(
                        "bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-premium-sm hover:shadow-premium transition-all duration-200 border-l-4",
                        isVerified && "border-l-[var(--status-good)]",
                        isUploaded && !isVerified && "border-l-[var(--primary)]",
                        !isUploaded && "border-l-[var(--status-warning)]"
                      )}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* LEFT: INFO */}
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                            isUploaded
                              ? "bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] border-[color-mix(in_oklab,var(--primary)_25%,transparent)] text-[var(--primary)]"
                              : "bg-[var(--muted)] border-[var(--border)] text-[var(--muted-foreground)]"
                          )}>
                            <FileText className="h-5 w-5" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-sm text-[var(--foreground)]">{doc.label}</h3>
                              {isUploaded ? (
                                <StatusBadge status={uploadedDoc.status} />
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)] border border-[color-mix(in_oklab,var(--status-warning)_25%,transparent)]">
                                  <AlertCircle className="h-3 w-3" />
                                  Pending Upload
                                </span>
                              )}
                            </div>

                            {doc.description && (
                              <p className="text-xs text-[var(--muted-foreground)]">{doc.description}</p>
                            )}

                            {isUploaded && (
                              <div className="flex items-center gap-1.5 text-xs text-[var(--status-good)] font-medium pt-0.5">
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>
                                  Uploaded on{" "}
                                  {new Date(uploadedDoc.createdAt).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            )}

                            {uploadedDoc?.status === "REJECTED" && uploadedDoc.rejectionReason && (
                              <p className="text-xs font-semibold text-[var(--status-critical)] bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] p-2 rounded-lg border border-[color-mix(in_oklab,var(--status-critical)_25%,transparent)] mt-1">
                                Rejection reason: {uploadedDoc.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* RIGHT: ACTIONS */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isUploaded && (
                            <a
                              href={`${ViewAPI}/${uploadedDoc.fileUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors shadow-premium-xs"
                            >
                              <Eye className="h-3.5 w-3.5 text-[var(--primary)]" />
                              View Document
                            </a>
                          )}

                          {isVerified ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl font-bold bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)] border border-[color-mix(in_oklab,var(--status-good)_30%,transparent)] cursor-not-allowed"
                              title="Verified documents cannot be re-uploaded"
                            >
                              <Lock className="h-3.5 w-3.5" />
                              Verified & Locked
                            </span>
                          ) : (
                            <label
                              className={cn(
                                "inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl cursor-pointer font-semibold transition-all shadow-premium-xs active:scale-95 text-white",
                                isUploading
                                  ? "bg-[var(--primary)] opacity-70 cursor-not-allowed"
                                  : isUploaded
                                  ? "bg-[var(--primary)] hover:opacity-90"
                                  : "bg-[var(--primary)] hover:opacity-90"
                              )}
                            >
                              {isUploading ? (
                                <>
                                  <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Uploading…
                                </>
                              ) : (
                                <>
                                  {isUploaded ? <RefreshCw className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
                                  {isUploaded ? "Re-Upload" : "Upload File"}
                                </>
                              )}
                              <input
                                ref={(el) => {
                                  fileInputRefs.current[doc.key] = el;
                                }}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                hidden
                                disabled={isUploading}
                                onChange={(e) => e.target.files && handleUpload(e.target.files[0], doc.key)}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* COMPLETION BANNER */}
            {documentTypes.length > 0 && uploadedCount === documentTypes.length && (
              <div className="mt-5 flex items-center gap-3 p-4 rounded-xl bg-[color-mix(in_oklab,var(--status-good)_12%,transparent)] border border-[color-mix(in_oklab,var(--status-good)_25%,transparent)] text-[var(--status-good)]">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-xs font-bold">All mandatory documents uploaded!</p>
                  <p className="text-[11px] opacity-90">
                    Your documents are under review by the HR team for final verification.
                  </p>
                </div>
              </div>
            )}
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
