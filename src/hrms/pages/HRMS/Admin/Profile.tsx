/** @format */

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  Mail,
  Phone,
  User,
  Calendar,
  Briefcase,
  Building2,
  Users,
  Pencil,
  X,
  Camera,
  MapPin,
  DollarSign,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Key,
} from "lucide-react";
import ChangePasswordModal from "../ChangePasswordModal";
import Loader from "../Loader";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;
const BASE_URL = API?.replace("/api", "") || "";

interface UserType {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  mobile: string;
  address?: string;
  gender: string;
  dob: string;
  joiningDate: string;
  role: string;
  status: string;
  employmentType: string;
  employmentStatus: "PROBATION" | "CONFIRMED";
  probationEndDate: string;
  profilePicture?: string;
  companyId?: { _id: string; name: string };
  branchId?: { _id: string; name: string };
  departmentId?: { _id: string; name: string };
  designationId?: { _id: string; name: string };
  managerId?: { _id: string; name: string };
  costCenterId?: { _id: string; name: string; code?: string };
  // New fields
  probationJustification?: string;
  isResigned?: boolean;
  isTerminated?: boolean;
  terminationDate?: string;
  terminationReason?: string;
  confirmationDate?: string;
}

interface UserDoc {
  _id: string;
  documentType: string;
  fileUrl: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  documentName?: string;
}

interface Company {
  _id: string;
  name: string;
}

interface Branch {
  _id: string;
  name: string;
  companyId: { _id: string };
}

interface Department {
  _id: string;
  name: string;
  branchId: { _id: string };
}

interface Designation {
  _id: string;
  name: string;
  departmentId: { _id: string };
}

interface EmployeeMini {
  _id: string;
  name: string;
}

interface CostCenter {
  _id: string;
  name: string;
  code?: string;
}

const DOC_LABEL_MAP: Record<string, string> = {
  AADHAAR: "Aadhaar Card",
  PAN: "PAN Card",
  MARKSHEET_10: "10th Marksheet",
  MARKSHEET_12: "12th Marksheet",
  DEGREE_CERTIFICATE: "Degree Certificate",
  PASSBOOK: "Bank Passbook",
};


export default function Profile() {
  const token = localStorage.getItem("token");
  const { id: userId } = useParams<{ id: string }>();

  const [user, setUser] = useState<UserType | null>(null);
  const [userDocs, setUserDocs] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [openPersonal, setOpenPersonal] = useState(false);
  const [openContact, setOpenContact] = useState(false);
  const [openJobInfo, setOpenJobInfo] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [managers, setManagers] = useState<EmployeeMini[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);

  const [form, setForm] = useState({
    name: "",
    gender: "",
    dob: "",
    email: "",
    mobile: "",
    address: "",
  });

  const [jobForm, setJobForm] = useState({
    companyId: "",
    branchId: "",
    departmentId: "",
    designationId: "",
    managerId: "",
    costCenterId: "",
    employmentType: "",
    employmentStatus: "",
    probationEndDate: "",
  });

  // Flow State
  const [flowState, setFlowState] = useState({
    isConfirmed: false,
    confirmationDate: "",
    probationJustification: "",
    isResigned: false,
    isTerminated: false,
    terminationDate: "",
    terminationReason: "",
  });

  // Profile picture upload
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const picRef = useRef<HTMLInputElement>(null);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(res.data);

      setForm({
        name: res.data.name,
        gender: res.data.gender,
        dob: res.data.dob?.slice(0, 10),
        email: res.data.email,
        mobile: res.data.mobile,
        address: res.data.address || "",
      });

      setJobForm({
        companyId: res.data.companyId?._id || "",
        branchId: res.data.branchId?._id || "",
        departmentId: res.data.departmentId?._id || "",
        designationId: res.data.designationId?._id || "",
        managerId: res.data.managerId?._id || "",
        costCenterId: res.data.costCenterId?._id || "",
        employmentType: res.data.employmentType,
        employmentStatus: res.data.employmentStatus,
        probationEndDate: res.data.probationEndDate?.slice(0, 10),
      });

      setFlowState({
        isConfirmed: res.data.employmentStatus === "CONFIRMED",
        confirmationDate: res.data.confirmationDate?.slice(0, 10) || "",
        probationJustification: res.data.probationJustification || "",
        isResigned: !!res.data.isResigned,
        isTerminated: !!res.data.isTerminated,
        terminationDate: res.data.terminationDate?.slice(0, 10) || "",
        terminationReason: res.data.terminationReason || "",
      });

    } catch (err) {
      console.error("Failed to fetch user", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDocs = async () => {
    try {
      const res = await axios.get(`${API}/documents/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserDocs(res.data || []);
    } catch (err) {
      console.error("Failed to fetch user documents", err);
    }
  };

  const fetchCompanies = async () => {
    const res = await axios.get(`${API}/companies`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCompanies(res.data);
  };

  const fetchBranches = async (companyId: string) => {
    const res = await axios.get(`${API}/branches?companyId=${companyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setBranches(res.data);
  };

  const fetchDepartments = async (branchId: string) => {
    const res = await axios.get(`${API}/departments?branchId=${branchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDepartments(res.data);
  };

  const fetchDesignations = async (departmentId: string) => {
    const res = await axios.get(
      `${API}/designations?departmentId=${departmentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setDesignations(res.data);
  };

  const fetchManagers = async () => {
    const res = await axios.get(`${API}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setManagers(res.data);
  };

  const fetchCostCenters = async (companyId: string, branchId: string) => {
    try {
      const res = await axios.get(
        `${API}/cost-centers?companyId=${companyId}&branchId=${branchId}&status=Active`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCostCenters(res.data || []);
    } catch {
      setCostCenters([]);
    }
  };

  const updateUser = async (payload: Partial<UserType>) => {
    try {
      await axios.patch(`${API}/users/${userId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUser();
    } catch (err) {
      console.error("Failed to update user", err);
    }
  };

  const handleUpdateDocStatus = async (docId: string, status: string) => {
    try {
      await axios.patch(`${API}/documents/${docId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUserDocs(); // Refresh documents
    } catch (err) {
      console.error("Failed to update doc status", err);
    }
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePicPreview(reader.result as string);
    reader.readAsDataURL(file);
    // Auto-upload
    try {
      setUploadingPic(true);
      const fd = new FormData();
      fd.append("profilePicture", file);
      await axios.patch(`${API}/users/${userId}/profile-picture`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      fetchUser();
    } catch (err) {
      console.error("Profile pic upload failed", err);
    } finally {
      setUploadingPic(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchUserDocs();
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchManagers();
  }, []);

  useEffect(() => {
    if (jobForm.companyId) fetchBranches(jobForm.companyId);
  }, [jobForm.companyId]);

  useEffect(() => {
    if (jobForm.branchId) fetchDepartments(jobForm.branchId);
  }, [jobForm.branchId]);

  useEffect(() => {
    if (jobForm.departmentId) fetchDesignations(jobForm.departmentId);
  }, [jobForm.departmentId]);

  useEffect(() => {
    if (jobForm.companyId && jobForm.branchId) {
      fetchCostCenters(jobForm.companyId, jobForm.branchId);
    } else {
      setCostCenters([]);
    }
  }, [jobForm.companyId, jobForm.branchId]);


  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  if (!user) return <div className="p-6 text-[var(--status-critical)]">User not found</div>;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const profilePicUrl = profilePicPreview ||
    (user.profilePicture
      ? (user.profilePicture.startsWith("http") ? user.profilePicture : `${BASE_URL}${user.profilePicture}`)
      : null);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Personal Information
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">Employee Profile</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ================= LEFT SIDEBAR ================= */}
        <div className="lg:col-span-1 space-y-6">
          {/* Main Card */}
          <div className="card-premium shadow-premium-sm p-6 text-center">
            {/* Avatar with upload button */}
            <div className="relative w-24 h-24 mx-auto mb-1">
              {profilePicUrl ? (
                <img
                  src={profilePicUrl}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-[var(--card)] shadow-premium-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--primary)] to-[#7C3AED] flex items-center justify-center text-white text-3xl font-semibold shadow-premium-sm">
                  {initials}
                </div>
              )}
              {/* Camera overlay */}
              <button
                type="button"
                onClick={() => picRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] rounded-full flex items-center justify-center text-white shadow-premium-sm hover:opacity-90 transition-opacity"
                title="Change profile picture"
              >
                {uploadingPic ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
              </button>
              <input
                ref={picRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePicChange}
              />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">{user.name}</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{user.employeeId}</p>

            <span
              className={cn(
                "inline-flex items-center gap-1.5 mt-2 rounded-full px-2.5 py-1 text-xs font-medium",
                user.status === "ACTIVE"
                  ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                  : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  user.status === "ACTIVE" ? "bg-[var(--status-good)]" : "bg-[var(--status-critical)]"
                )}
              />
              {user.status === "ACTIVE" ? "Active Employee" : "Inactive Employee"}
            </span>

            <div className="mt-3 text-sm">
              <p className="font-medium text-[var(--foreground)]">{user.designationId?.name}</p>
              <p className="text-[var(--muted-foreground)]">{user.departmentId?.name}</p>
            </div>

            <span
              className={cn(
                "inline-flex items-center gap-1.5 mt-3 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                user.employmentStatus === "CONFIRMED"
                  ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                  : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  user.employmentStatus === "CONFIRMED" ? "bg-[var(--status-good)]" : "bg-[var(--status-warning)]"
                )}
              />
              {user.employmentStatus}
            </span>

            <div className="mt-4 text-xs text-[var(--muted-foreground)]">
              Joined on{" "}
              <span className="font-medium text-[var(--foreground)]">
                {new Date(user.joiningDate).toDateString()}
              </span>
            </div>

            <button
              onClick={() => setOpenChangePassword(true)}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-premium-sm active:scale-95"
            >
              <Key size={16} />
              Change Password
            </button>
          </div>

          {/* Uploaded Documents Section */}
          <div className="card-premium shadow-premium-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--foreground)] uppercase">Uploaded Documents</h3>
              <FileText size={16} className="text-[var(--muted-foreground)]" />
            </div>
            <div className="p-4 space-y-4">
              {userDocs && userDocs.length > 0 ? (
                userDocs.map((doc) => (
                  <div key={doc._id} className="p-3 border border-[var(--border)] rounded-lg bg-[var(--muted)]/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[var(--foreground)] truncate mr-2" title={DOC_LABEL_MAP[doc.documentType] || doc.documentType}>
                        {DOC_LABEL_MAP[doc.documentType] || doc.documentType}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          doc.status === "VERIFIED"
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : doc.status === "REJECTED"
                            ? "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                            : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            doc.status === "VERIFIED"
                              ? "bg-[var(--status-good)]"
                              : doc.status === "REJECTED"
                              ? "bg-[var(--status-critical)]"
                              : "bg-[var(--status-warning)]"
                          )}
                        />
                        {doc.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)] mb-3 truncate">
                      {doc.documentName || doc.fileUrl.split('/').pop()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `${BASE_URL}/${doc.fileUrl.replace(/\\/g, '/')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)] rounded text-[10px] font-bold hover:bg-[color-mix(in_oklab,var(--primary)_20%,transparent)] transition-colors"
                      >
                        <Eye size={12} /> View
                      </a>
                      <button
                        onClick={() => handleUpdateDocStatus(doc._id, "VERIFIED")}
                        className="p-1.5 bg-[color-mix(in_oklab,var(--status-good)_12%,transparent)] text-[var(--status-good)] rounded hover:bg-[color-mix(in_oklab,var(--status-good)_20%,transparent)] transition-colors"
                        title="Verify"
                      >
                        <CheckCircle2 size={12} />
                      </button>
                      <button
                        onClick={() => handleUpdateDocStatus(doc._id, "REJECTED")}
                        className="p-1.5 bg-[color-mix(in_oklab,var(--status-critical)_12%,transparent)] text-[var(--status-critical)] rounded hover:bg-[color-mix(in_oklab,var(--status-critical)_20%,transparent)] transition-colors"
                        title="Reject"
                      >
                        <XCircle size={12} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--muted-foreground)] text-center py-4 italic">No documents uploaded</p>
              )}
            </div>
          </div>
        </div>


        {/* ================= RIGHT DETAILS ================= */}
        <div className="lg:col-span-3 space-y-6">
          <Section
            title="Personal Details"
            onEdit={() => setOpenPersonal(true)}
          >
            <Info label="Full Name" value={user.name} icon={<User />} />
            <Info label="Gender" value={user.gender} />
            <Info
              label="Date of Birth"
              value={new Date(user.dob).toDateString()}
              icon={<Calendar />}
            />
          </Section>

          <Section
            title="Contact Information"
            onEdit={() => setOpenContact(true)}
          >
            <Info label="Email" value={user.email} icon={<Mail />} />
            <Info label="Mobile" value={user.mobile} icon={<Phone />} />
            <Info label="Address" value={user.address} icon={<MapPin />} />
          </Section>

          <Section title="Job Information" onEdit={() => setOpenJobInfo(true)}>
            <Info
              label="Company"
              value={user.companyId?.name}
              icon={<Building2 />}
            />
            <Info label="Branch" value={user.branchId?.name} />
            <Info label="Department" value={user.departmentId?.name} />
            <Info
              label="Designation"
              value={user.designationId?.name}
              icon={<Briefcase />}
            />
            <Info
              label="Reporting Manager"
              value={user.managerId?.name || "—"}
              icon={<Users />}
            />
            <Info label="Employment Type" value={user.employmentType} />
            <Info
              label="Cost Center"
              value={
                user.costCenterId
                  ? `${user.costCenterId.name}${user.costCenterId.code ? ` (${user.costCenterId.code})` : ""}`
                  : "—"
              }
              icon={<DollarSign />}
            />
            <Info
              label="Probation Ends"
              value={user.probationEndDate ? new Date(user.probationEndDate).toDateString() : "—"}
            />
          </Section>

          {/* ================= PROBATION CONFIRMATION SECTION ================= */}
          <div className="card-premium shadow-premium-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm font-bold text-[var(--foreground)] uppercase">Probation Confirmation:</span>
                  <input
                    type="checkbox"
                    checked={flowState.isConfirmed}
                    onChange={(e) => setFlowState({ ...flowState, isConfirmed: e.target.checked })}
                    className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--muted-foreground)]">Date:</span>
                  <input
                    type="date"
                    value={flowState.confirmationDate}
                    onChange={(e) => setFlowState({ ...flowState, confirmationDate: e.target.value })}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  updateUser({
                    employmentStatus: flowState.isConfirmed ? "CONFIRMED" : "PROBATION",
                    confirmationDate: flowState.confirmationDate,
                    probationJustification: flowState.probationJustification,
                  });
                }}
                className="px-4 py-1.5 bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-premium-sm"
              >
                Save Confirmation
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Free Text (Evaluation Criteria / Justification)</label>
              <textarea
                value={flowState.probationJustification}
                onChange={(e) => setFlowState({ ...flowState, probationJustification: e.target.value })}
                placeholder="Enter evaluation criteria based on which resource is moved from probation to confirmation..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4 text-sm text-[var(--foreground)] h-32 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              />
            </div>
          </div>

          {/* ================= RESIGNATION / TERMINATION SECTION ================= */}
          <div className="card-premium shadow-premium-sm p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-8 border-b border-[var(--border)] pb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm font-bold text-[var(--foreground)] uppercase">Resigned:</span>
                <input
                  type="checkbox"
                  checked={flowState.isResigned}
                  onChange={(e) => setFlowState({ ...flowState, isResigned: e.target.checked, isTerminated: false })}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm font-bold text-[var(--foreground)] uppercase">Terminated:</span>
                <input
                  type="checkbox"
                  checked={flowState.isTerminated}
                  onChange={(e) => setFlowState({ ...flowState, isTerminated: e.target.checked, isResigned: false })}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Date:</span>
                <input
                  type="date"
                  value={flowState.terminationDate}
                  onChange={(e) => setFlowState({ ...flowState, terminationDate: e.target.value })}
                  className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                />
              </div>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={() => {
                    updateUser({
                      isResigned: flowState.isResigned,
                      isTerminated: flowState.isTerminated,
                      terminationDate: flowState.terminationDate,
                      terminationReason: flowState.terminationReason,
                      status: (flowState.isResigned || flowState.isTerminated) ? "INACTIVE" : "ACTIVE",
                    });
                  }}
                  className="px-4 py-1.5 bg-[var(--status-critical)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-premium-sm"
                >
                  Save Status Changes
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Reason (Free Text)</label>
              <textarea
                value={flowState.terminationReason}
                onChange={(e) => setFlowState({ ...flowState, terminationReason: e.target.value })}
                placeholder="Manager enter the reasons based on which a resource has resigned or is terminated..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4 text-sm text-[var(--foreground)] h-32 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= PERSONAL MODAL ================= */}
      {openPersonal && (
        <Modal
          title="Edit Personal Details"
          onClose={() => setOpenPersonal(false)}
        >
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e: any) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Gender"
            value={form.gender}
            onChange={(e: any) => setForm({ ...form, gender: e.target.value })}
          />
          <Input
            type="date"
            label="Date of Birth"
            value={form.dob}
            onChange={(e: any) => setForm({ ...form, dob: e.target.value })}
          />
          <ModalActions
            onSave={() => {
              updateUser({
                name: form.name,
                gender: form.gender,
                dob: form.dob,
              });
              setOpenPersonal(false);
            }}
            onCancel={() => setOpenPersonal(false)}
          />
        </Modal>
      )}

      {/* ================= CONTACT MODAL ================= */}
      {openContact && (
        <Modal
          title="Edit Contact Information"
          onClose={() => setOpenContact(false)}
        >
          <Input
            label="Email"
            value={form.email}
            onChange={(e: any) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Mobile"
            value={form.mobile}
            onChange={(e: any) => setForm({ ...form, mobile: e.target.value })}
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e: any) => setForm({ ...form, address: e.target.value })}
          />
          <ModalActions
            onSave={() => {
              updateUser({ email: form.email, mobile: form.mobile, address: form.address });
              setOpenContact(false);
            }}
            onCancel={() => setOpenContact(false)}
          />
        </Modal>
      )}

      {/* ================= JOB INFO MODAL ================= */}
      {openJobInfo && (
        <Modal
          title="Edit Job Information"
          onClose={() => setOpenJobInfo(false)}
        >
          {/* Company */}
          <Select
            label="Company"
            value={jobForm.companyId}
            onChange={(e: any) =>
              setJobForm({
                ...jobForm,
                companyId: e.target.value,
                branchId: "",
                departmentId: "",
                designationId: "",
                costCenterId: "",
              })
            }
          >
            <option value="">Select Company</option>
            {companies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>

          {/* Branch */}
          <Select
            label="Branch"
            value={jobForm.branchId}
            onChange={(e: any) =>
              setJobForm({
                ...jobForm,
                branchId: e.target.value,
                departmentId: "",
                designationId: "",
                costCenterId: "",
              })
            }
          >
            <option value="">Select Branch</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </Select>

          {/* Cost Center */}
          <Select
            label="Cost Center"
            value={jobForm.costCenterId}
            onChange={(e: any) =>
              setJobForm({ ...jobForm, costCenterId: e.target.value })
            }
          >
            <option value="">Select Cost Center (Optional)</option>
            {costCenters.map((cc) => (
              <option key={cc._id} value={cc._id}>
                {cc.name} {cc.code ? `(${cc.code})` : ""}
              </option>
            ))}
          </Select>

          {/* Department */}
          <Select
            label="Department"
            value={jobForm.departmentId}
            onChange={(e: any) =>
              setJobForm({
                ...jobForm,
                departmentId: e.target.value,
                designationId: "",
              })
            }
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </Select>

          {/* Designation */}
          <Select
            label="Designation"
            value={jobForm.designationId}
            onChange={(e: any) =>
              setJobForm({ ...jobForm, designationId: e.target.value })
            }
          >
            <option value="">Select Designation</option>
            {designations.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </Select>

          {/* Manager */}
          <Select
            label="Reporting Manager"
            value={jobForm.managerId}
            onChange={(e: any) =>
              setJobForm({ ...jobForm, managerId: e.target.value })
            }
          >
            <option value="">Select Manager</option>
            {managers.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </Select>

          <Select
            label="Employment Type"
            value={jobForm.employmentType}
            onChange={(e: any) =>
              setJobForm({ ...jobForm, employmentType: e.target.value })
            }
          >
            <option value="">Select Employment Type</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Intern">Intern</option>
            <option value="Contract">Contract</option>
          </Select>

          <Select
            label="Employment Status"
            value={jobForm.employmentStatus}
            onChange={(e: any) =>
              setJobForm({ ...jobForm, employmentStatus: e.target.value })
            }
          >
            <option value="">Select Status</option>
            <option value="PROBATION">PROBATION</option>
            <option value="CONFIRMED">CONFIRMED</option>
          </Select>

          <Input
            type="date"
            label="Probation End Date"
            value={jobForm.probationEndDate}
            onChange={(e: any) =>
              setJobForm({ ...jobForm, probationEndDate: e.target.value })
            }
          />

          <ModalActions
            onSave={() => {
              updateUser({
                companyId: jobForm.companyId as any,
                branchId: jobForm.branchId as any,
                departmentId: jobForm.departmentId as any,
                designationId: jobForm.designationId as any,
                managerId: jobForm.managerId as any,
                costCenterId: jobForm.costCenterId as any,
                employmentType: jobForm.employmentType,
                employmentStatus: jobForm.employmentStatus as any,
                probationEndDate: jobForm.probationEndDate,
              });
              setOpenJobInfo(false);
            }}
            onCancel={() => setOpenJobInfo(false)}
          />
        </Modal>
      )}
      {/* ================= CHANGE PASSWORD MODAL ================= */}
      <ChangePasswordModal
        isOpen={openChangePassword}
        userId={userId || ""}
        isAdminView={true}
        onClose={() => setOpenChangePassword(false)}
      />
    </div>
  );
}

/* ================= SHARED COMPONENTS ================= */

const Section = ({ title, children, onEdit }: any) => (
  <div className="card-premium shadow-premium-sm p-5 relative">
    <h3 className="text-sm font-bold text-[var(--foreground)] mb-4 uppercase tracking-wide">
      {title}
    </h3>
    {onEdit && (
      <button
        onClick={onEdit}
        className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 hover:bg-[var(--muted)] rounded transition-colors"
      >
        <Pencil size={16} />
      </button>
    )}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
);

const Info = ({ label, value, icon }: any) => (
  <div className="flex items-start gap-3">
    {icon && <div className="mt-1 text-[var(--muted-foreground)]">{icon}</div>}
    <div>
      <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-tighter">{label}</p>
      <p className="text-sm font-medium text-[var(--foreground)]">{value || "—"}</p>
    </div>
  </div>
);

const Modal = ({ title, children, onClose }: any) => (
  <div
    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="bg-[var(--card)] w-full max-w-md rounded-xl relative flex flex-col max-h-[90vh] shadow-premium-lg overflow-hidden border border-[var(--border)]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0 bg-[var(--muted)]">
        <h2 className="text-lg font-bold text-[var(--foreground)]">{title}</h2>
        <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg p-1 hover:bg-[var(--muted)]">
          <X size={20} />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="px-6 py-5 overflow-y-auto flex-1">
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  </div>
);


const Input = ({ label, ...props }: any) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{label}</label>
    <input
      {...props}
      className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all"
    />
  </div>
);

const ModalActions = ({ onSave, onCancel }: any) => (
  <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)] mt-4">
    <button onClick={onCancel} className="px-5 py-2 text-sm font-semibold text-[var(--muted-foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
      Cancel
    </button>
    <button
      onClick={onSave}
      className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] text-white rounded-lg hover:opacity-90 transition-opacity shadow-premium-sm active:scale-95"
    >
      Save Changes
    </button>
  </div>
);

const Select = ({ label, children, ...props }: any) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{label}</label>
    <select
      {...props}
      className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all cursor-pointer"
    >
      {children}
    </select>
  </div>
);
