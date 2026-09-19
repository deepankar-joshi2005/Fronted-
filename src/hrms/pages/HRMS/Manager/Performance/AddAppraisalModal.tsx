/** @format */
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "../../Alert/Toast";
const API_BASE = import.meta.env.VITE_API_URL;

const AddAppraisalModal = ({ open, onClose, data, onSuccess }: any) => {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    title: "",
    type: "MID_YEAR",
    startDate: "",
    endDate: "",
    applicableFor: "All Employees",
    status: "DRAFT",
  });

  const [errors, setErrors] = useState<any>({});

  /* ================= PREFILL ================= */
  useEffect(() => {
    if (data) {
      setForm({
        title: data.title,
        type: data.type,
        startDate: data.startDate.split("T")[0],
        endDate: data.endDate.split("T")[0],
        applicableFor: data.applicableFor || "All Employees",
        status: data.status,
      });
    }
  }, [data]);

  /* ================= VALIDATION ================= */
  const validate = () => {
    const newErrors: any = {};

    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.startDate) newErrors.startDate = "Start date is required";
    if (!form.endDate) newErrors.endDate = "End date is required";
    if (!form.applicableFor || !form.applicableFor.trim()) {
      newErrors.applicableFor = "Applicable for is required";
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= SUBMIT ================= */
const submit = async () => {
  if (!validate()) return;

  try {
    let res;

    if (data) {
      res = await axios.put(`${API_BASE}/appraisals/${data._id}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        type: "success",
        title: "Appraisal Updated",
        message:
          res.data?.message || "Appraisal has been updated successfully.",
      });
    } else {
      res = await axios.post(`${API_BASE}/appraisals`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        type: "success",
        title: "Appraisal Created",
        message:
          res.data?.message || "Appraisal has been created successfully.",
      });
    }

    onSuccess();
    onClose();
  } catch (error: any) {
    toast({
      type: "error",
      title: "Operation Failed",
      message:
        error?.response?.data?.message ||
        "Unable to save appraisal. Please try again.",
    });
  }
};


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* MODAL */}
      <div
        className="relative z-10 bg-white w-full max-w-lg rounded-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">
          {data ? "Edit Appraisal" : "Create Appraisal"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full border rounded-md p-2 text-sm ${
                errors.title ? "border-red-500" : ""
              }`}
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value });
                setErrors({ ...errors, title: "" });
              }}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Type</label>
            <select
              className="w-full border rounded-md p-2 text-sm"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="MID_YEAR">Mid-Year</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={`w-full border rounded-md p-2 text-sm ${
                  errors.startDate ? "border-red-500" : ""
                }`}
                value={form.startDate}
                onChange={(e) => {
                  setForm({ ...form, startDate: e.target.value });
                  setErrors({ ...errors, startDate: "" });
                }}
              />
              {errors.startDate && (
                <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={`w-full border rounded-md p-2 text-sm ${
                  errors.endDate ? "border-red-500" : ""
                }`}
                value={form.endDate}
                onChange={(e) => {
                  setForm({ ...form, endDate: e.target.value });
                  setErrors({ ...errors, endDate: "" });
                }}
              />
              {errors.endDate && (
                <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Applicable For <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full border rounded-md p-2 text-sm ${
                errors.applicableFor ? "border-red-500" : ""
              }`}
              value={form.applicableFor}
              onChange={(e) => {
                setForm({ ...form, applicableFor: e.target.value });
                setErrors({ ...errors, applicableFor: "" });
              }}
            />
            {errors.applicableFor && (
              <p className="text-xs text-red-500 mt-1">
                {errors.applicableFor}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              className="w-full border rounded-md p-2 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-sm"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 bg-primary text-white rounded-md text-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAppraisalModal;
