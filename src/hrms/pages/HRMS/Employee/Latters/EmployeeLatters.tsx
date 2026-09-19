/** @format */

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  FileText,
  Download,
  Eye,
  Search,
  Calendar,
  User as UserIcon,
  CheckCircle2,
} from "lucide-react";
import Loader from "../../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";

const API = import.meta.env.VITE_API_URL;
const ViewAPI = API.replace("/api", "");

type LetterType =
  | "OFFER"
  | "APPOINTMENT"
  | "PROMOTION"
  | "WARNING"
  | "RELIEVING"
  | "FF_SETTLEMENT"
  | "EXPERIENCE"
  | "TERMINATION"
  | "APPRECIATION"
  | "TRAINING"
  | "ALL";

interface Letter {
  _id: string;
  letterType: LetterType;
  fileName: string;
  originalName: string;
  filePath: string;
  message?: string;
  createdAt: string;
  sentBy: {
    name: string;
    role: string;
  };
}

const LETTER_OPTIONS: { label: string; value: LetterType }[] = [
  { label: "All Letters", value: "ALL" },
  { label: "Offer Letter", value: "OFFER" },
  { label: "Appointment Letter", value: "APPOINTMENT" },
  { label: "Promotion Letter", value: "PROMOTION" },
  { label: "Experience Letter", value: "EXPERIENCE" },
  { label: "Relieving Letter", value: "RELIEVING" },
  { label: "Termination Letter", value: "TERMINATION" },
  { label: "Appreciation Letter", value: "APPRECIATION" },
  { label: "Warning Letter", value: "WARNING" },
  { label: "Training Letter", value: "TRAINING" },
];

export default function EmployeeLetters() {
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedType, setSelectedType] = useState<LetterType>("ALL");

  useEffect(() => {
    fetchLetters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLetters = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${API}/letters/user/${currentUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLetters(res.data || []);
    } catch (error) {
      console.error("Error fetching letters:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLetters = useMemo(() => {
    return letters.filter((l) => {
      const matchesSearch =
        l.originalName?.toLowerCase().includes(search.toLowerCase()) ||
        l.letterType?.toLowerCase().includes(search.toLowerCase()) ||
        l.sentBy?.name?.toLowerCase().includes(search.toLowerCase());

      const matchesType = selectedType === "ALL" || l.letterType === selectedType;

      return matchesSearch && matchesType;
    });
  }, [letters, search, selectedType]);

  const handleDownload = async (letter: Letter) => {
    try {
      const response = await axios.get(`${ViewAPI}${letter.filePath}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", letter.originalName || `${letter.letterType}_letter.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const formatLetterType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
            <FileText className="h-6 w-6 text-[var(--primary)]" />
            Letters & Documents
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            View and download official company letters issued to your profile.
          </p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Letters Issued" value={letters.length} icon={FileText} tone="primary" />
        <StatCard label="Offer & Appointment" value={letters.filter((l) => l.letterType === "OFFER" || l.letterType === "APPOINTMENT").length} icon={CheckCircle2} tone="good" />
        <StatCard label="Appreciation & Experience" value={letters.filter((l) => l.letterType === "APPRECIATION" || l.letterType === "EXPERIENCE").length} icon={FileText} tone="violet" />
      </div>

      {/* PANEL & CARDS */}
      <DashboardPanel title="Document Vault" subtitle="Search and download issued letters">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search document name or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as LetterType)}
              className="px-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] font-medium"
            >
              {LETTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredLetters.length === 0 ? (
          <div className="py-16 text-center text-[var(--muted-foreground)] text-xs">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-40 text-[var(--primary)]" />
            <p className="font-semibold text-sm text-[var(--foreground)]">No document letters found</p>
            <p className="mt-1">Official HR letters issued to you will be listed here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLetters.map((letter) => (
              <div
                key={letter._id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-premium-sm hover:shadow-premium transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-[var(--primary)]">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[var(--foreground)] line-clamp-1">{letter.originalName}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-[var(--muted)] text-[var(--muted-foreground)]">
                          {formatLetterType(letter.letterType)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {letter.message && (
                    <p className="text-xs text-[var(--muted-foreground)] italic line-clamp-2 bg-[var(--muted)]/40 p-2.5 rounded-xl">
                      "{letter.message}"
                    </p>
                  )}

                  <div className="space-y-1 text-[11px] text-[var(--muted-foreground)] border-t border-[var(--border)] pt-2.5">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Issued: {new Date(letter.createdAt).toLocaleDateString("en-GB")}</span>
                    </div>
                    {letter.sentBy?.name && (
                      <div className="flex items-center gap-1">
                        <UserIcon className="h-3.5 w-3.5" />
                        <span>Issued by: {letter.sentBy.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-5 pt-3 border-t border-[var(--border)]">
                  <a
                    href={`${ViewAPI}${letter.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDownload(letter)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 transition-all shadow-premium-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
