/** @format */
import {
  Calendar,
  Clock,
  Briefcase,
  Umbrella,
  UserMinus,
  ShieldCheck,
  Timer,
  LogIn,
  LogOut,
  Infinity,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  Download,
  Trash2,
  Building2,
  Save,
  Hourglass,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "../../Alert/Toast";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;
const BASE_URL = API_BASE?.replace("/api", "") || "";
const token = () => localStorage.getItem("token");

type Tab = "leave" | "attendance" | "company";

interface HrPolicy {
  _id: string;
  no: number;
  name: string;
  requirements: string[];
  legalReference: string;
  documentUrl?: string;
  documentName?: string;
}

interface AttendancePolicyConfig {
  _id?: string;
  companyId: string;
  graceMinutes: number;
  lateMarkAfterMinutes: number;
  minHoursFullDay: number;
  minHoursHalfDay: number;
  earlyExitBufferMinutes: number;
  lateCountForHalfDay: number;
  overtimeEnabled: boolean;
  overtimeAfterHours: number;
  overtimeType: "Paid" | "Compensatory" | "None";
  overtimeRateType: "FIXED_PER_HOUR" | "MULTIPLIER_OF_HOURLY";
  overtimeRateValue: number;
}

/** Presentation-only helper: maps a leave type name to an icon + tone accent. */
const getLeaveVisual = (name: string) => {
  if (name.includes("Casual"))
    return {
      icon: Umbrella,
      chip: "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]",
      text: "text-[var(--primary)]",
    };
  if (name.includes("Sick"))
    return {
      icon: ShieldCheck,
      chip: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)]",
      text: "text-[var(--status-good)]",
    };
  if (name.includes("Earned"))
    return {
      icon: Briefcase,
      chip: "bg-[color-mix(in_oklab,#7C3AED_14%,transparent)]",
      text: "text-[#7C3AED]",
    };
  if (name.includes("Unpaid"))
    return {
      icon: UserMinus,
      chip: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)]",
      text: "text-[var(--status-warning)]",
    };
  return {
    icon: Briefcase,
    chip: "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]",
    text: "text-[var(--primary)]",
  };
};

export default function Policies() {
  const [activeTab, setActiveTab] = useState<Tab>("leave");
  const [leaves, setLeaves] = useState<any[]>([]);
  const [hrPolicies, setHrPolicies] = useState<HrPolicy[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await axios.get(`${API_BASE}/leave-types`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        setLeaves(res.data || []);
      } catch (error) {
        console.error("Failed to fetch leave types:", error);
      }
    };
    fetchLeaves();
  }, []);

  useEffect(() => {
    if (activeTab === "company") fetchHrPolicies();
  }, [activeTab]);

  const fetchHrPolicies = async () => {
    try {
      const res = await axios.get(`${API_BASE}/hr-policies`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setHrPolicies(res.data || []);
    } catch (err) {
      console.error("Failed to fetch HR policies", err);
    }
  };

  const handleUpload = async (policyId: string, file: File) => {
    setUploadingId(policyId);
    const formData = new FormData();
    formData.append("document", file);
    try {
      const res = await axios.post(
        `${API_BASE}/hr-policies/${policyId}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token()}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast({ type: "success", title: "Uploaded", message: "Document uploaded successfully" });
      setHrPolicies((prev) =>
        prev.map((p) => (p._id === policyId ? res.data.policy : p))
      );
    } catch (err) {
      toast({ type: "error", title: "Upload Failed", message: "Could not upload document" });
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemoveDocument = async (policyId: string) => {
    try {
      const res = await axios.delete(
        `${API_BASE}/hr-policies/${policyId}/document`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      toast({ type: "success", title: "Removed", message: "Document removed" });
      setHrPolicies((prev) =>
        prev.map((p) => (p._id === policyId ? res.data.policy : p))
      );
    } catch (err) {
      toast({ type: "error", title: "Error", message: "Could not remove document" });
    }
  };

  const getDocumentHref = (url: string) =>
    url.startsWith("http") ? url : `${BASE_URL}/${url.replace(/\\/g, "/")}`;

  /* ================= ATTENDANCE POLICY ================= */
  const [attendanceCompanies, setAttendanceCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [policy, setPolicy] = useState<AttendancePolicyConfig | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policySaving, setPolicySaving] = useState(false);

  const defaultPolicyTemplate = (companyId: string): AttendancePolicyConfig => ({
    companyId,
    graceMinutes: 10,
    lateMarkAfterMinutes: 15,
    minHoursFullDay: 8,
    minHoursHalfDay: 4,
    earlyExitBufferMinutes: 30,
    lateCountForHalfDay: 3,
    overtimeEnabled: true,
    overtimeAfterHours: 8,
    overtimeType: "Paid",
    overtimeRateType: "MULTIPLIER_OF_HOURLY",
    overtimeRateValue: 1.5,
  });

  const fetchAttendancePolicy = async () => {
    try {
      setPolicyLoading(true);
      let compId = selectedCompanyId;

      if (!compId) {
        const companiesRes = await axios.get(`${API_BASE}/companies`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        setAttendanceCompanies(companiesRes.data);
        compId = companiesRes.data[0]?._id || "";
        if (compId) setSelectedCompanyId(compId);
      }

      if (!compId) return;

      try {
        const res = await axios.get(`${API_BASE}/attendance-policy/${compId}`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        setPolicy(res.data);
      } catch {
        setPolicy(defaultPolicyTemplate(compId));
      }
    } finally {
      setPolicyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "attendance") fetchAttendancePolicy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedCompanyId]);

  const handleSavePolicy = async () => {
    if (!policy || !selectedCompanyId) return;
    try {
      setPolicySaving(true);
      const res = await axios.post(
        `${API_BASE}/attendance-policy`,
        { ...policy, companyId: selectedCompanyId },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      setPolicy(res.data.policy);
      toast({
        type: "success",
        title: "Policy Saved",
        message: "Attendance policy updated successfully",
      });
    } catch {
      toast({
        type: "error",
        title: "Save Failed",
        message: "Failed to update attendance policy",
      });
    } finally {
      setPolicySaving(false);
    }
  };

  const tabs: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: "leave", icon: <Calendar size={16} />, label: "Leave Policies" },
    { key: "attendance", icon: <Clock size={16} />, label: "Attendance Policies" },
    { key: "company", icon: <Building2 size={16} />, label: "Company HR Policies" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            HR Policies
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            System Configuration <span className="mx-1">›</span> HR Policies
          </p>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="inline-flex w-fit items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
              activeTab === tab.key
                ? "bg-[var(--card)] text-[var(--primary)] shadow-premium-xs"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================= LEAVE POLICIES ================= */}
      {activeTab === "leave" && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Leave Entitlements</h2>
            <p className="text-[var(--muted-foreground)] mt-2 leading-relaxed">
              Standardized leave allocations and carry-forward rules designed to ensure
              work-life balance and operational consistency.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaves.map((leave) => {
              const visual = getLeaveVisual(leave.name as string);
              const LeaveIcon = visual.icon;
              return (
                <div
                  key={leave.id}
                  className="card-premium card-hover shadow-premium-sm p-6"
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                      visual.chip,
                      visual.text
                    )}
                  >
                    <LeaveIcon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">{leave.name}</h3>
                  <p className={cn("font-semibold text-2xl mb-4", visual.text)}>
                    {leave.maxDays} <span className="text-sm font-normal text-[var(--muted-foreground)]">Days / Year</span>
                  </p>
                  <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--muted-foreground)]">Accrual Mode</span>
                      <span className="font-medium px-2 py-0.5 bg-[var(--muted)] rounded text-[var(--foreground)]">Yearly</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--muted-foreground)]">Carry Forward</span>
                      <span
                        className={cn(
                          "flex items-center gap-1 font-medium",
                          leave.carryForward ? "text-[var(--status-good)]" : "text-[var(--muted-foreground)]"
                        )}
                      >
                        {leave.carryForward ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {leave.carryForward ? "Allowed" : "Not Allowed"}
                      </span>
                    </div>
                    {leave.carryForward && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[var(--muted-foreground)] pl-4">Max Cap</span>
                        <span className="font-medium text-[var(--foreground)]">{leave.maxDays} Days</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--muted-foreground)]">Compensation</span>
                      <span
                        className={cn(
                          "font-medium",
                          leave.paid ? "text-[var(--status-good)]" : "text-[var(--status-critical)]"
                        )}
                      >
                        {leave.paid ? "Paid Full" : "Unpaid"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= ATTENDANCE POLICIES ================= */}
      {activeTab === "attendance" && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Time & Attendance Rules</h2>
              <p className="text-[var(--muted-foreground)] mt-2 leading-relaxed">
                These rules decide who counts as on-time, late, half-day, or absent — and
                feed directly into the attendance grid and payroll calculations.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
              >
                <option value="">Select Company</option>
                {attendanceCompanies.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={handleSavePolicy}
                disabled={policySaving || !policy}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Save size={16} />
                {policySaving ? "Saving..." : "Save Policy"}
              </button>
            </div>
          </div>

          {policyLoading && <p className="text-sm text-[var(--muted-foreground)]">Loading policy...</p>}

          {policy && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card-premium card-hover shadow-premium-sm p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)] mb-4">
                  <Timer size={22} />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Grace Period</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">Buffer after office start time before lateness even starts counting.</p>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]">
                  <input
                    type="number"
                    min={0}
                    value={policy.graceMinutes}
                    onChange={(e) => setPolicy({ ...policy, graceMinutes: Number(e.target.value) })}
                    className="w-20 text-2xl font-bold text-[var(--primary)] bg-transparent outline-none border-b-2 border-[var(--border)] focus:border-[var(--primary)]"
                  />
                  <span className="text-sm font-normal text-[var(--primary)]">Mins</span>
                </div>
              </div>

              <div className="card-premium card-hover shadow-premium-sm p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--status-warning)_12%,transparent)] text-[var(--status-warning)] mb-4">
                  <LogIn size={22} />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Late Threshold</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">Additional minutes on top of grace before someone is marked LATE.</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs py-1 border-b border-[var(--border)]">
                    <span className="text-[var(--muted-foreground)]">Late After (+grace)</span>
                    <input
                      type="number"
                      min={0}
                      value={policy.lateMarkAfterMinutes}
                      onChange={(e) => setPolicy({ ...policy, lateMarkAfterMinutes: Number(e.target.value) })}
                      className="w-16 text-right font-semibold text-[var(--foreground)] border border-[var(--border)] rounded px-1.5 py-0.5 outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs py-1">
                    <span className="text-[var(--muted-foreground)]">Penalty Rule</span>
                    <span className="flex items-center gap-1 font-semibold text-[var(--status-warning)]">
                      <input
                        type="number"
                        min={0}
                        value={policy.lateCountForHalfDay}
                        onChange={(e) => setPolicy({ ...policy, lateCountForHalfDay: Number(e.target.value) })}
                        className="w-12 text-right border border-[var(--border)] rounded px-1 py-0.5 outline-none focus:border-[var(--primary)]"
                      />
                      Lates = 0.5 Day
                    </span>
                  </div>
                </div>
              </div>

              <div className="card-premium card-hover shadow-premium-sm p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--status-critical)_12%,transparent)] text-[var(--status-critical)] mb-4">
                  <LogOut size={22} />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Early Exit</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">Rules for departing before the official shift end time (informational).</p>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[color-mix(in_oklab,var(--status-critical)_8%,transparent)]">
                  <input
                    type="number"
                    min={0}
                    value={policy.earlyExitBufferMinutes}
                    onChange={(e) => setPolicy({ ...policy, earlyExitBufferMinutes: Number(e.target.value) })}
                    className="w-20 text-2xl font-bold text-[var(--status-critical)] bg-transparent outline-none border-b-2 border-[var(--border)] focus:border-[var(--status-critical)]"
                  />
                  <span className="text-sm font-normal text-[var(--status-critical)]">Mins</span>
                </div>
              </div>

              <div className="card-premium card-hover shadow-premium-sm lg:col-span-3 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--status-good)_12%,transparent)] text-[var(--status-good)] mb-4">
                  <Hourglass size={22} />
                </div>
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Minimum Work Hours</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  Decides who gets marked full day, half day, or absent. On a weekday marked
                  "Half Day" in Working Days, meeting the half-day bar counts as a full pay-day.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  <div>
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">Full Day (hours)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={policy.minHoursFullDay}
                      onChange={(e) => setPolicy({ ...policy, minHoursFullDay: Number(e.target.value) })}
                      className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--status-good)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">Half Day (hours)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={policy.minHoursHalfDay}
                      onChange={(e) => setPolicy({ ...policy, minHoursHalfDay: Number(e.target.value) })}
                      className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--status-good)]"
                    />
                  </div>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-3">Below half-day hours worked = marked Absent for the day.</p>
              </div>

              <div className="lg:col-span-3 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] p-8 shadow-premium text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                  <Clock size={160} />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between gap-6 flex-wrap">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                          <Infinity size={20} />
                        </div>
                        <h3 className="text-2xl font-bold">Overtime Policy</h3>
                      </div>
                      <p className="text-white/80 max-w-md text-sm">
                        Hours worked beyond the threshold are paid automatically in payroll using the rate below.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-medium bg-white/20 px-4 py-2 rounded-xl border border-white/30 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={policy.overtimeEnabled}
                        onChange={(e) => setPolicy({ ...policy, overtimeEnabled: e.target.checked })}
                        className="w-4 h-4"
                      />
                      Enabled
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="px-5 py-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                      <p className="text-xs text-white/80 uppercase tracking-widest mb-1">Threshold (Hrs)</p>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={policy.overtimeAfterHours}
                        onChange={(e) => setPolicy({ ...policy, overtimeAfterHours: Number(e.target.value) })}
                        className="w-20 text-xl font-bold bg-transparent outline-none border-b-2 border-white/50 focus:border-white text-white placeholder-white/60"
                      />
                    </div>
                    <div className="px-5 py-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                      <p className="text-xs text-white/80 uppercase tracking-widest mb-1">Benefit Type</p>
                      <select
                        value={policy.overtimeType}
                        onChange={(e) => setPolicy({ ...policy, overtimeType: e.target.value as AttendancePolicyConfig["overtimeType"] })}
                        className="bg-transparent text-white font-bold outline-none [&>option]:text-gray-900"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Compensatory">Compensatory</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                    <div className="px-5 py-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                      <p className="text-xs text-white/80 uppercase tracking-widest mb-1">Rate Type</p>
                      <select
                        value={policy.overtimeRateType}
                        onChange={(e) => setPolicy({ ...policy, overtimeRateType: e.target.value as AttendancePolicyConfig["overtimeRateType"] })}
                        className="bg-transparent text-white font-bold outline-none [&>option]:text-gray-900"
                      >
                        <option value="MULTIPLIER_OF_HOURLY">Multiplier of hourly rate</option>
                        <option value="FIXED_PER_HOUR">Fixed ₹ / hour</option>
                      </select>
                    </div>
                    <div className="px-5 py-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                      <p className="text-xs text-white/80 uppercase tracking-widest mb-1">
                        {policy.overtimeRateType === "FIXED_PER_HOUR" ? "Rate (₹/hr)" : "Multiplier (×)"}
                      </p>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={policy.overtimeRateValue}
                        onChange={(e) => setPolicy({ ...policy, overtimeRateValue: Number(e.target.value) })}
                        className="w-20 text-xl font-bold bg-transparent outline-none border-b-2 border-white/50 focus:border-white text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= COMPANY HR POLICIES ================= */}
      {activeTab === "company" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Company HR Policies</h2>
            <p className="text-[var(--muted-foreground)] mt-2 leading-relaxed">
              Statutory and best-practice HR policies as per Indian Labour Laws. Upload the official policy document for each policy to make it accessible to your team.
            </p>
          </div>

          <div className="card-premium shadow-premium-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--muted)]">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    <th className="px-4 py-3 w-10">No.</th>
                    <th className="px-4 py-3">HR Policy</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Top 5 Requirements</th>
                    <th className="px-4 py-3 hidden md:table-cell">Key Legal Reference</th>
                    <th className="px-4 py-3 text-center w-44">Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {hrPolicies.map((policy) => (
                    <tr key={policy._id} className="transition-colors hover:bg-[var(--muted)] group">
                      <td className="px-4 py-4 text-center">
                        <span className="w-7 h-7 rounded-full bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-[var(--primary)] text-xs font-bold flex items-center justify-center mx-auto">
                          {policy.no}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[var(--foreground)] text-[13px]">{policy.name}</p>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <ol className="list-decimal list-inside space-y-0.5 text-xs text-[var(--muted-foreground)]">
                          {policy.requirements.map((req, i) => (
                            <li key={i}>{req}</li>
                          ))}
                        </ol>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-xs text-[var(--muted-foreground)] italic">{policy.legalReference}</span>
                      </td>
                      <td className="px-4 py-4">
                        {policy.documentUrl ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <a
                              href={getDocumentHref(policy.documentUrl)}
                              download={policy.documentName}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)] rounded-lg text-xs font-bold hover:bg-[color-mix(in_oklab,var(--primary)_20%,transparent)] transition-colors w-full justify-center"
                            >
                              <Download size={13} />
                              Download
                            </a>
                            <p className="text-[10px] text-[var(--muted-foreground)] truncate max-w-[130px] text-center" title={policy.documentName}>
                              {policy.documentName}
                            </p>
                            <button
                              onClick={() => handleRemoveDocument(policy._id)}
                              className="flex items-center gap-1 text-[10px] text-[color-mix(in_oklab,var(--status-critical)_70%,transparent)] hover:text-[var(--status-critical)] transition-colors"
                            >
                              <Trash2 size={11} /> Remove
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5">
                            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[color-mix(in_oklab,var(--status-warning)_12%,transparent)] text-[var(--status-warning)] rounded-lg text-xs font-bold hover:bg-[color-mix(in_oklab,var(--status-warning)_20%,transparent)] transition-colors cursor-pointer w-full justify-center">
                              {uploadingId === policy._id ? (
                                <span className="w-3 h-3 border-2 border-[var(--status-warning)] border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Upload size={13} />
                              )}
                              {uploadingId === policy._id ? "Uploading..." : "Upload"}
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                ref={(el) => { fileInputRefs.current[policy._id] = el; }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUpload(policy._id, file);
                                }}
                              />
                            </label>
                            <p className="text-[10px] text-[var(--muted-foreground)]">PDF / Word / Image</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {hrPolicies.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-sm text-[var(--muted-foreground)] italic">
                        <FileText size={32} className="mx-auto mb-3 opacity-30" />
                        Loading HR Policies...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 items-center text-xs text-[var(--muted-foreground)] pt-2">
            <span className="flex items-center gap-1.5">
              <Download size={13} className="text-[var(--primary)]" />
              Download uploaded policy document
            </span>
            <span className="flex items-center gap-1.5">
              <Upload size={13} className="text-[var(--status-warning)]" />
              Upload policy document (PDF / Word / Image)
            </span>
          </div>
        </div>
      )}

      {/* ================= FOOTER ================= */}
      <div className="pt-8 border-t border-[var(--border)] flex items-start gap-4">
        <div className="bg-[var(--muted)] p-2 rounded-lg text-[var(--muted-foreground)]">
          <ShieldCheck size={20} />
        </div>
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-2xl">
          <span className="font-semibold text-[var(--foreground)] block mb-1 uppercase text-[10px] tracking-wider">Access Control Policy</span>
          Only authorized HR personnel and System Administrators retain permissions to modify these core organizational thresholds.
          Any approved adjustments integrate synchronously across performance and payroll modules.
        </p>
      </div>
    </div>
  );
}
