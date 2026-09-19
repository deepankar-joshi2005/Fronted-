/** @format */

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "../../Alert/Toast";
const API_BASE = import.meta.env.VITE_API_URL;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  mode: "add" | "view" | "edit";
}

const ViewEditJobModal = ({ isOpen, onClose, job, mode }: Props) => {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    jobTitle: "",
    department: "",
    location: "",
    openings: 1,
    status: "Open",
    recruitingManager: "",
    file: null as File | null,
  });

  const [errors, setErrors] = useState({
    jobTitle: "",
    department: "",
    location: "",
  });

  const [managers, setManagers] = useState<any[]>([]);

  /* ================= FETCH MANAGERS ================= */
  const fetchManagers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users?role=manager`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.data || res.data;
      setManagers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch managers", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchManagers();
    }
  }, [isOpen]);

  /* ================= RESET FORM ================= */
  const resetForm = () => {
    setForm({
      jobTitle: "",
      department: "",
      location: "",
      openings: 1,
      status: "Open",
      recruitingManager: "",
      file: null,
    });

    setErrors({
      jobTitle: "",
      department: "",
      location: "",
    });
  };

  /* ================= SAFE CLOSE ================= */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  /* ================= PREFILL ================= */
  useEffect(() => {
    if ((mode === "edit" || mode === "view") && job) {
      setForm({
        ...form,
        jobTitle: job.jobTitle,
        department: job.department,
        location: job.location,
        openings: job.openings,
        status: job.status,
        recruitingManager: job.recruitingManager?._id || job.recruitingManager || "",
      });
    }

    if (mode === "add" && isOpen) {
      resetForm();
    }
  }, [job, mode, isOpen]);

  if (!isOpen) return null;

  const disabled = mode === "view";

  /* ================= VALIDATION ================= */
  const validate = () => {
    let valid = true;

    const newErrors = {
      jobTitle: "",
      department: "",
      location: "",
    };

    if (!form.jobTitle.trim()) {
      newErrors.jobTitle = "Job title is required";
      valid = false;
    }

    if (!form.department.trim()) {
      newErrors.department = "Department is required";
      valid = false;
    }

    if (!form.location.trim()) {
      newErrors.location = "Location is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append("jobTitle", form.jobTitle);
    formData.append("department", form.department);
    formData.append("location", form.location);
    formData.append("openings", form.openings.toString());
    formData.append("status", form.status);
    formData.append("recruitingManager", form.recruitingManager);
    if (form.file) {
      formData.append("file", form.file);
    }

    try {
      if (mode === "add") {
        const res = await axios.post(`${API_BASE}/job-openings`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          },
        });
        toast({
          type: "success",
          title: "Job Added",
          message: res.data?.message || "Job Added successfully.",
        });
      }

      if (mode === "edit") {
        const res = await axios.put(`${API_BASE}/job-openings/${job._id}`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          },
        });
        toast({
          type: "success",
          title: "Job Updated",
          message: res.data?.message || "Job updated successfully.",
        });
      }

      handleClose();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Action Failed",
        message: error.response?.data?.message || "Something went wrong.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* MODAL */}
      <div
        className="relative z-10 bg-white w-[460px] rounded-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-5">
          {mode === "add" && "Add Job Opening"}
          {mode === "view" && "View Job Opening"}
          {mode === "edit" && "Edit Job Opening"}
        </h2>

        {/* Job Title */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              disabled={disabled}
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              className={`w-full border px-3 py-2 rounded mt-1 text-sm ${
                errors.jobTitle ? "border-red-500" : ""
              }`}
            />
            {errors.jobTitle && (
              <p className="text-xs text-red-500 mt-1">{errors.jobTitle}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">
              Department <span className="text-red-500">*</span>
            </label>
            <input
              disabled={disabled}
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className={`w-full border px-3 py-2 rounded mt-1 text-sm ${
                errors.department ? "border-red-500" : ""
              }`}
            />
            {errors.department && (
              <p className="text-xs text-red-500 mt-1">{errors.department}</p>
            )}
          </div>
        </div>

        {/* Location & Openings */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              disabled={disabled}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={`w-full border px-3 py-2 rounded mt-1 text-sm ${
                errors.location ? "border-red-500" : ""
              }`}
            />
            {errors.location && (
              <p className="text-xs text-red-500 mt-1">{errors.location}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Openings</label>
            <input
              type="number"
              disabled={disabled}
              value={form.openings}
              onChange={(e) =>
                setForm({
                  ...form,
                  openings: Number(e.target.value),
                })
              }
              className="w-full border px-3 py-2 rounded mt-1 text-sm"
            />
          </div>
        </div>

        {/* Recruiting Manager */}
        <div className="mb-3">
          <label className="block text-xs font-bold text-gray-500 uppercase">
            Recruiting Manager
          </label>
          {disabled ? (
             <input
              disabled
              value={job?.recruitingManager?.name || "-"}
              className="w-full border px-3 py-2 rounded mt-1 text-sm bg-gray-50"
            />
          ) : (
            <select
              className="w-full border px-3 py-2 rounded mt-1 text-sm bg-white"
              value={form.recruitingManager}
              onChange={(e) => setForm({ ...form, recruitingManager: e.target.value })}
            >
              <option value="">Select Manager</option>
              {managers.map((m: any) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.employeeId})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Job Description Document */}
        <div className="mb-3">
          <label className="block text-xs font-bold text-gray-500 uppercase">
            Job Description (JD)
          </label>
          {mode !== "view" ? (
            <input
              type="file"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
              className="w-full border px-3 py-1.5 rounded mt-1 text-xs file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              accept=".pdf,.doc,.docx"
            />
          ) : (
            <div className="mt-1">
              {job?.jobDocument ? (
                <a 
                  href={`${API_BASE.replace("/api", "")}/${job.jobDocument}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-orange-500 hover:underline text-sm font-medium"
                >
                  View JD Document
                </a>
              ) : (
                <span className="text-gray-400 text-sm">No JD uploaded</span>
              )}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-gray-500 uppercase">Status</label>
          <select
            disabled={disabled}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full border px-3 py-2 rounded mt-1 text-sm"
          >
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 border rounded-md text-sm"
          >
            {mode === "view" ? "Close" : "Cancel"}
          </button>

          {mode !== "view" && (
            <button
              onClick={handleSubmit}
              className="bg-orange-500 text-white px-4 py-2 rounded-md text-sm"
            >
              {mode === "add" ? "Save" : "Update"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewEditJobModal;
