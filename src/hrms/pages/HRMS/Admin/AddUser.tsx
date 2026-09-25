/** @format */

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { LeadMentorForm } from "./LeadMentorForm";
import { toast } from "../Alert/Toast";
import { Eye, EyeOff, Upload, Download, X, FileText, AlertCircle, CheckCircle2, Camera, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidEmail, getPhoneNumberError } from "@/utils/validation";

const API_BASE = import.meta.env.VITE_API_URL;

/* ================= SHARED FIELD STYLES ================= */
const labelClass = "block mb-1.5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide";
const errorTextClass = "mt-1 text-xs text-[var(--status-critical)]";
const inputClass = (hasError?: boolean) =>
  cn(
    "w-full h-10 rounded-lg border bg-[var(--card)] px-3 text-sm text-[var(--foreground)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]",
    hasError ? "border-[var(--status-critical)]" : "border-[var(--border)]"
  );
const selectClass = (hasError?: boolean) =>
  cn(
    "w-full h-10 rounded-lg border bg-[var(--card)] px-3 text-sm text-[var(--foreground)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)] disabled:cursor-not-allowed",
    hasError ? "border-[var(--status-critical)]" : "border-[var(--border)]"
  );


export default function AddUser() {
  const token = localStorage.getItem("token");


  interface Role {
    _id: string;
    name: string;
  }
  const [roles, setRoles] = useState<Role[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  /* ================= PROFILE PICTURE ================= */
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const profilePicRef = useRef<HTMLInputElement>(null);

  /* ================= BULK IMPORT ================= */
  const [showBulkModal, setShowBulkModal] = useState(false);

  /* ================= BASIC INFORMATION ================= */
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    gender: "",
    dob: "",
    joiningDate: "",
    password: "",
    role: "",
    isTrainee: true,
  });

  /* ================= COMPANY & JOB ================= */
  const [job, setJob] = useState({
    companyId: "",
    branchId: "",
    departmentId: "",
    designationId: "",
    managerId: "",
    employmentType: "",
    costCenterId: "",
  });

  /* ================= DROPDOWNS ================= */
  const [companies, setCompanies] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [employeeIdPreview, setEmployeeIdPreview] = useState<string>("");

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  /* ================= FETCH MASTER ================= */
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(res.data);
    } catch (err) {
      console.log("Role fetch error", err);
    }
  };


  useEffect(() => {
    axios
      .get(`${API_BASE}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCompanies(res.data));

    axios
      .get(`${API_BASE}/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setBranches(res.data));

    axios
      .get(`${API_BASE}/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setDepartments(res.data));

    axios
      .get(`${API_BASE}/designations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setDesignations(res.data));

    axios
      .get(`${API_BASE}/users?role=manager`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setManagers(res.data || []));
  }, []);

  /* ================= FETCH COST CENTERS ================= */
  useEffect(() => {
    if (job.companyId && job.branchId) {
      axios
        .get(`${API_BASE}/cost-centers?companyId=${job.companyId}&branchId=${job.branchId}&status=Active`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setCostCenters(res.data || []))
        .catch(() => setCostCenters([]));
    } else {
      setCostCenters([]);
    }
  }, [job.companyId, job.branchId]);

  /* ================= FETCH EMPLOYEE ID PREVIEW ================= */
  useEffect(() => {
    if (job.companyId) {
      axios
        .get(`${API_BASE}/users/generate-employee-id?companyId=${job.companyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setEmployeeIdPreview(res.data.employeeId))
        .catch(() => setEmployeeIdPreview(""));
    } else {
      setEmployeeIdPreview("");
    }
  }, [job.companyId]);

  /* ================= FILTER ================= */
  const filteredBranches = branches.filter(
    (b) => b.companyId?._id === job.companyId
  );
  const filteredDepartments = departments.filter(
    (d) => d.branchId?._id === job.branchId
  );
  const filteredDesignations = designations.filter(
    (d) => d.departmentId?._id === job.departmentId
  );

  /* ================= PROFILE PICTURE HANDLER ================= */
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ type: "error", title: "Invalid File", message: "Only image files are allowed." });
        return;
      }
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  /* ================= VALIDATION ================= */
  const validate = () => {
    const e: any = {};

    Object.entries(formData).forEach(([k, v]) => {
      if (k === "isTrainee") return; // boolean checkbox — false is a valid value, not a missing one
      if (!v) e[k] = "Required";
    });

    // Format validation (only if a value was provided)
    if (formData.email && !isValidEmail(formData.email)) {
      e.email = "Enter a valid email address";
    }

    if (formData.mobile) {
      const mobileError = getPhoneNumberError(formData.mobile);
      if (mobileError) e.mobile = mobileError;
    }

    // Required job fields (costCenterId is optional)
    // IMPORTANT: Manager role doesn't need a Reporting Manager for the first hire
    const isManagerRole = formData.role.toLowerCase() === "manager";
    const requiredJobFields = ["companyId", "branchId", "departmentId", "designationId", "employmentType"];

    if (!isManagerRole) {
      requiredJobFields.push("managerId");
    }

    requiredJobFields.forEach((k) => {
      if (!job[k as keyof typeof job]) e[k] = "Required";
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      // Use FormData to support profile picture upload
      const data = new FormData();

      // BASIC
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("mobile", formData.mobile);
      data.append("address", formData.address);
      data.append("gender", formData.gender);
      data.append("dob", formData.dob);
      data.append("joiningDate", formData.joiningDate);
      data.append("password", formData.password);
      data.append("role", formData.role);
      data.append("isTrainee", String(formData.isTrainee));

      // JOB
      data.append("companyId", job.companyId);
      data.append("branchId", job.branchId);
      data.append("departmentId", job.departmentId);
      data.append("designationId", job.designationId);
      data.append("managerId", job.managerId);
      data.append("employmentType", job.employmentType);
      if (job.costCenterId) data.append("costCenterId", job.costCenterId);

      // PROFILE PICTURE
      if (profilePicFile) {
        data.append("profilePicture", profilePicFile);
      }

      const res = await axios.post(
        `${API_BASE}/users`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      toast({
        type: "success",
        title: "User Created",
        message: res.data?.message || "User has been created successfully.",
      });

      // ✅ RESET FORM
      setFormData({
        name: "",
        email: "",
        mobile: "",
        address: "",
        gender: "",
        dob: "",
        joiningDate: "",
        password: "",
        role: "",
        isTrainee: true,
      });

      setJob({
        companyId: "",
        branchId: "",
        departmentId: "",
        designationId: "",
        managerId: "",
        employmentType: "",
        costCenterId: "",
      });

      setProfilePicFile(null);
      setProfilePicPreview(null);
      setCostCenters([]);
      setErrors({});
    } catch (error: any) {
      toast({
        type: "error",
        title: "User Creation Failed",
        message:
          error?.response?.data?.message ||
          "Unable to create user. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };


  const formatRole = (role: string) => {
    return role
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };



  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Add User
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Employee <span className="mx-1">›</span> Add User
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowBulkModal(true)}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
        >
          <Upload className="h-4 w-4" />
          Bulk Import
        </button>
      </div>

      {/* ================= BASIC INFORMATION ================= */}
      <div className="card-premium shadow-premium-sm max-w-4xl">
        <div className="px-4 sm:px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Basic Information
          </h2>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* ===== PROFILE PICTURE ===== */}
          <div className="flex flex-col items-center gap-3 pb-5 border-b border-[var(--border)]">
            <div
              className="relative w-28 h-28 rounded-full border-4 border-[var(--border)] cursor-pointer group overflow-hidden bg-[var(--muted)] flex items-center justify-center shadow-premium-sm"
              onClick={() => profilePicRef.current?.click()}
            >
              {profilePicPreview ? (
                <img
                  src={profilePicPreview}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} className="text-[var(--muted-foreground)]" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <Camera size={22} className="text-white" />
              </div>
            </div>
            <input
              ref={profilePicRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePicChange}
              className="hidden"
            />
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--foreground)]">Profile Picture</p>
              <p className="text-xs text-[var(--muted-foreground)]">Click to upload (JPG, PNG, max 5MB)</p>
              {profilePicFile && (
                <button
                  type="button"
                  onClick={() => { setProfilePicFile(null); setProfilePicPreview(null); }}
                  className="text-xs text-[var(--status-critical)] hover:opacity-80 mt-1 flex items-center gap-1 mx-auto transition-opacity"
                >
                  <X size={12} /> Remove
                </button>
              )}
            </div>
          </div>

          {/* GRID FIELDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className={labelClass}>
                Full Name <span className="text-[var(--status-critical)]">*</span>
              </label>
              <input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={inputClass(!!errors.name)}
              />
              {errors.name && (
                <p className={errorTextClass}>{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>
                Email <span className="text-[var(--status-critical)]">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors((prev: any) => ({ ...prev, email: "" }));
                }}
                onBlur={(e) => {
                  if (e.target.value && !isValidEmail(e.target.value)) {
                    setErrors((prev: any) => ({ ...prev, email: "Enter a valid email address" }));
                  }
                }}
                className={inputClass(!!errors.email)}
              />
              {errors.email && (
                <p className={errorTextClass}>{errors.email}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className={labelClass}>
                Mobile <span className="text-[var(--status-critical)]">*</span>
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => {
                  setFormData({ ...formData, mobile: e.target.value });
                  if (errors.mobile) setErrors((prev: any) => ({ ...prev, mobile: "" }));
                }}
                onBlur={(e) => {
                  const mobileError = getPhoneNumberError(e.target.value);
                  if (mobileError) {
                    setErrors((prev: any) => ({ ...prev, mobile: mobileError }));
                  }
                }}
                className={inputClass(!!errors.mobile)}
              />
              {errors.mobile && (
                <p className={errorTextClass}>{errors.mobile}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className={labelClass}>Address</label>
              <input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className={inputClass()}
              />
            </div>

            {/* Gender */}
            <div>
              <label className={labelClass}>
                Gender <span className="text-[var(--status-critical)]">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                className={selectClass(!!errors.gender)}
              >
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
              </select>
              {errors.gender && (
                <p className={errorTextClass}>{errors.gender}</p>
              )}
            </div>

            {/* DOB */}
            <div>
              <label className={labelClass}>
                Date of Birth <span className="text-[var(--status-critical)]">*</span>
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
                className={inputClass(!!errors.dob)}
              />
              {errors.dob && <p className={errorTextClass}>{errors.dob}</p>}
            </div>

            {/* Joining Date */}
            <div>
              <label className={labelClass}>
                Joining Date <span className="text-[var(--status-critical)]">*</span>
              </label>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) =>
                  setFormData({ ...formData, joiningDate: e.target.value })
                }
                className={inputClass(!!errors.joiningDate)}
              />
              {errors.joiningDate && (
                <p className={errorTextClass}>{errors.joiningDate}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className={labelClass}>
                Password <span className="text-[var(--status-critical)]">*</span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={cn(inputClass(!!errors.password), "pr-10")}
                />

                {/* Eye Icon */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {errors.password && (
                <p className={errorTextClass}>{errors.password}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= COMPANY & JOB ================= */}
      <div className="card-premium shadow-premium-sm max-w-4xl">
        <div className="px-4 sm:px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Company &amp; Job Details
          </h2>
        </div>

        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Company */}
          <div>
            <label className={labelClass}>
              Company <span className="text-[var(--status-critical)]">*</span>
            </label>
            <select
              value={job.companyId}
              onChange={(e) =>
                setJob({
                  ...job,
                  companyId: e.target.value,
                  branchId: "",
                  departmentId: "",
                  designationId: "",
                  costCenterId: "",
                })
              }
              className={selectClass(!!errors.companyId)}
            >
              <option value="">Select Company</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.companyId && (
              <p className={errorTextClass}>{errors.companyId}</p>
            )}
            {employeeIdPreview && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--primary)]/30 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] px-3 py-2">
                <AlertCircle size={14} className="text-[var(--primary)] shrink-0" />
                <p className="text-xs font-medium text-[var(--primary)]">
                  Next Employee ID: <span className="font-bold">{employeeIdPreview}</span>
                </p>
              </div>
            )}
          </div>

          {/* Branch */}
          <div>
            <label className={labelClass}>
              Branch <span className="text-[var(--status-critical)]">*</span>
            </label>
            <select
              value={job.branchId}
              disabled={!job.companyId}
              onChange={(e) =>
                setJob({
                  ...job,
                  branchId: e.target.value,
                  departmentId: "",
                  designationId: "",
                  costCenterId: "",
                })
              }
              className={selectClass(!!errors.branchId)}
            >
              <option value="">Select Branch</option>
              {filteredBranches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
            {errors.branchId && (
              <p className={errorTextClass}>{errors.branchId}</p>
            )}
          </div>

          {/* Cost Center */}
          <div>
            <label className={labelClass}>Cost Center</label>
            <select
              value={job.costCenterId}
              disabled={!job.branchId}
              onChange={(e) => setJob({ ...job, costCenterId: e.target.value })}
              className={selectClass()}
            >
              <option value="">Select Cost Center (Optional)</option>
              {costCenters.map((cc) => (
                <option key={cc._id} value={cc._id}>
                  {cc.name} {cc.code ? `(${cc.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className={labelClass}>
              Department <span className="text-[var(--status-critical)]">*</span>
            </label>
            <select
              value={job.departmentId}
              disabled={!job.branchId}
              onChange={(e) =>
                setJob({
                  ...job,
                  departmentId: e.target.value,
                  designationId: "",
                })
              }
              className={selectClass(!!errors.departmentId)}
            >
              <option value="">Select Department</option>
              {filteredDepartments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.departmentId && (
              <p className={errorTextClass}>{errors.departmentId}</p>
            )}
          </div>

          {/* Designation */}
          <div>
            <label className={labelClass}>
              Designation <span className="text-[var(--status-critical)]">*</span>
            </label>
            <select
              value={job.designationId}
              disabled={!job.departmentId}
              onChange={(e) =>
                setJob({ ...job, designationId: e.target.value })
              }
              className={selectClass(!!errors.designationId)}
            >
              <option value="">Select Designation</option>
              {filteredDesignations.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.designationId && (
              <p className={errorTextClass}>{errors.designationId}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className={labelClass}>
              Role <span className="text-[var(--status-critical)]">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className={selectClass(!!errors.role)}
            >
              <option value="">Select Role</option>

              {roles.map((role) => (
                <option key={role._id} value={role.name}>
                  {formatRole(role.name)}
                </option>
              ))}
            </select>

            {errors.role && (
              <p className={errorTextClass}>{errors.role}</p>
            )}
          </div>

          {/* Reporting Manager */}
          <div>
            <label className={labelClass}>
              Reporting Manager {formData.role.toLowerCase() !== "manager" && <span className="text-[var(--status-critical)]">*</span>}
            </label>
            <select
              value={job.managerId}
              onChange={(e) => setJob({ ...job, managerId: e.target.value })}
              className={selectClass(!!errors.managerId)}
            >
              <option value="">{formData.role.toLowerCase() === "manager" ? "Select Manager (Optional)" : "Select Manager"}</option>
              {managers?.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
            {errors.managerId && (
              <p className={errorTextClass}>{errors.managerId}</p>
            )}
          </div>

          {/* Employee Type */}
          <div>
            <label className={labelClass}>
              Employee Type <span className="text-[var(--status-critical)]">*</span>
            </label>
            <select
              value={job.employmentType}
              onChange={(e) =>
                setJob({ ...job, employmentType: e.target.value })
              }
              className={selectClass(!!errors.employmentType)}
            >
              <option value="">Select Type</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Intern">Intern</option>
              <option value="Contract">Contract</option>
            </select>
            {errors.employmentType && (
              <p className={errorTextClass}>{errors.employmentType}</p>
            )}
          </div>

          {/* Trainee / Onboarding Training */}
          <div className="sm:col-span-2 flex items-start gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3.5 py-3">
            <input
              id="isTrainee"
              type="checkbox"
              checked={formData.isTrainee}
              onChange={(e) => setFormData({ ...formData, isTrainee: e.target.checked })}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border)] accent-[var(--primary)]"
            />
            <label htmlFor="isTrainee" className="text-sm text-[var(--foreground)] cursor-pointer">
              <span className="font-medium">Trainee — must complete training before accessing other modules</span>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                While checked, this employee will only see the Training module (videos + tests for their department) until HR marks their onboarding complete.
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* LEAD MENTOR EXTRA FORM */}
      {formData.role === "leadmentor" && <LeadMentorForm />}


      {/* Tumhara existing Upload Documents section exactly yahin rahega */}
      <div className="flex justify-center pt-6">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-8 py-2.5 text-sm font-semibold text-white shadow-premium-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
        >
          Add User
        </button>
      </div>

      {showBulkModal && (
        <BulkImportModal
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => {
            setShowBulkModal(false);
            // Optional: refresh list if needed
          }}
        />
      )}
    </div>
  );
}

/* ======================================================
   BULK IMPORT MODAL COMPONENT
   ====================================================== */
function BulkImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const token = localStorage.getItem("token");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview/Result

  const downloadTemplate = () => {
    const headers = [
      "Employee ID", "Name", "Email", "Mobile", "Gender", "DOB",
      "Joining Date", "Role", "Company", "Branch", "Department",
      "Designation", "Cost Center", "Reporting Manager", "Employment Type"
    ];
    const sampleData = [
      "EMP-0001", "John Doe", "john@example.com", "9876543210", "Male", "1990-05-15",
      "2026-02-01", "superadmin", "Your Company", "Main Branch", "IT",
      "Software Engineer", "", "", "Full-Time"
    ];

    const csvContent = [headers.join(","), sampleData.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Employee_Bulk_Import_Template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleParse = async () => {
    if (!file) return;
    try {
      setLoading(true);
      setError(null);
      setValidationErrors([]);

      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API_BASE}/bulk-upload/employees/parse`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setParsedData(res.data.data);
      setStep(2);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || "Parsing failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/bulk-upload/employees/save`, { employees: parsedData }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        type: "success",
        title: "Import Completed",
        message: `${res.data.results.success} users imported successfully.`,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-premium-lg w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--muted)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Bulk Employee Import</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Upload CSV/Excel to add multiple employees</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)] rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === 1 ? (
            <>
              {/* Instructions */}
              <div className="rounded-xl border border-[var(--primary)]/25 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] p-4 flex gap-3">
                <AlertCircle className="text-[var(--primary)] shrink-0" size={20} />
                <div className="text-sm text-[var(--foreground)] leading-relaxed">
                  <p className="font-semibold mb-1">How to import:</p>
                  <ul className="list-disc list-inside space-y-1 text-[var(--muted-foreground)]">
                    <li>Download the sample template below.</li>
                    <li>Fill in employee details exactly as per headers.</li>
                    <li>Ensure <strong className="text-[var(--foreground)]">Company, Branch, Department, Cost Center</strong> etc. match exactly.</li>
                    <li><strong className="text-[var(--foreground)]">Reporting Manager</strong> column accepts manager's email address.</li>
                    <li>Save as CSV/Excel and upload here.</li>
                  </ul>
                </div>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-[var(--border)] rounded-2xl p-8 hover:border-[var(--primary)] hover:bg-[color-mix(in_oklab,var(--primary)_6%,transparent)] transition-all cursor-pointer group text-center relative">
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] flex items-center justify-center text-[var(--primary)] mb-4 group-hover:scale-110 transition-transform">
                    <Upload size={24} />
                  </div>
                  {file ? (
                    <div className="flex items-center gap-2 text-[var(--foreground)] font-medium">
                      <FileText size={18} className="text-[var(--primary)]" />
                      {file.name}
                    </div>
                  ) : (
                    <>
                      <p className="text-[var(--foreground)] font-medium">Click or drag file here</p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">Accepts CSV, XLSX up to 10MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-[var(--status-critical)]/25 bg-[color-mix(in_oklab,var(--status-critical)_8%,transparent)] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[var(--status-critical)] font-semibold text-sm mb-2">
                    <AlertCircle size={16} />
                    Validation Failed ({validationErrors.length} errors)
                  </div>
                  {validationErrors.map((msg, i) => (
                    <p key={i} className="text-xs text-[var(--status-critical)] flex gap-2">
                      <span className="font-bold shrink-0">•</span> {msg}
                    </p>
                  ))}
                </div>
              )}

              {error && (
                <div className="bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] text-[var(--status-critical)] p-4 rounded-xl text-sm flex gap-2 items-center">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                >
                  <Download size={18} />
                  Download Template
                </button>
                <button
                  type="button"
                  onClick={handleParse}
                  disabled={!file || loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] text-sm font-semibold text-white shadow-premium-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? "Validating..." : "Validate & Preview"}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Preview Mode */}
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] flex items-center justify-center text-[var(--status-good)] mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)]">Ready to Import</h3>
                <p className="text-[var(--muted-foreground)]">Validated {parsedData.length} records successfully</p>
              </div>

              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--muted)] sticky top-0">
                      <tr className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Emp ID</th>
                        <th className="px-4 py-3">Cost Center</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {parsedData.slice(0, 10).map((row, i) => (
                        <tr key={i} className="transition-colors hover:bg-[var(--muted)]">
                          <td className="px-4 py-3 font-medium text-[var(--foreground)]">{row.name}</td>
                          <td className="px-4 py-3 text-[var(--muted-foreground)]">{row.email}</td>
                          <td className="px-4 py-3 text-[var(--muted-foreground)]">{row.employeeId}</td>
                          <td className="px-4 py-3 text-[var(--muted-foreground)]">{row.costCenterName || "—"}</td>
                        </tr>
                      ))}
                      {parsedData.length > 10 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-center text-[var(--muted-foreground)] italic">
                            + {parsedData.length - 10} more records
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {error && (
                <div className="bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] text-[var(--status-critical)] p-4 rounded-xl text-sm flex gap-2 items-center">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] disabled:opacity-50 disabled:pointer-events-none"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={loading}
                  className="flex-1 h-11 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] text-sm font-semibold text-white shadow-premium-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? "Importing..." : `Final Import (${parsedData.length} users)`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
