/** @format */

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "../../Alert/Toast";
import { EARNING_COMPONENTS, DEDUCTION_COMPONENTS } from "./salaryStructureFields";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  editData: any | null;
}

interface Employee {
  _id: string;
  name: string;
  employeeId: string;
}

const emptyValues = () => {
  const values: Record<string, string> = {};
  for (const [key] of [...EARNING_COMPONENTS, ...DEDUCTION_COMPONENTS]) values[key] = "0";
  return values;
};

const API_BASE = import.meta.env.VITE_API_URL;

const AddSalaryStructureModal = ({ isOpen, onClose, editData }: Props) => {
  const token = localStorage.getItem("token");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employee, setEmployee] = useState("");
  // Kept as raw strings (not numbers) while editing — a controlled
  // type="number" input bound to a coerced/clamped number fights the user
  // mid-keystroke (e.g. typing "10" gets its leading digit stripped as soon
  // as "1" is parsed and re-rendered back), which is what was happening here.
  const [values, setValues] = useState<Record<string, string>>(emptyValues());

  const setField = (key: string, val: string) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  // Normalize on blur only, so we don't rewrite the field while the user is
  // still typing — empty becomes "0", stray minus signs are dropped.
  const normalizeField = (key: string) =>
    setValues((prev) => ({ ...prev, [key]: String(Math.max(0, Number(prev[key]) || 0)) }));

  const numericValue = (key: string) => Math.max(0, Number(values[key]) || 0);

  /* CALCULATIONS */
  const totalEarnings = EARNING_COMPONENTS.reduce((sum, [key]) => sum + numericValue(key), 0);
  const totalDeductions = DEDUCTION_COMPONENTS.reduce((sum, [key]) => sum + numericValue(key), 0);
  const netSalary = totalEarnings - totalDeductions;

  /* PREFILL */
  useEffect(() => {
    if (editData) {
      setEmployee(editData.employee?._id || "");
      const next = emptyValues();
      for (const key of Object.keys(next)) next[key] = String(editData[key] ?? 0);
      setValues(next);
    } else {
      setEmployee("");
      setValues(emptyValues());
    }
  }, [editData, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    axios
      .get(`${API_BASE}/users`, {
        params: { excludeRoles: "superadmin,hr-admin" },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setEmployees(res.data));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      if (!employee) {
        toast({ type: "error", title: "Error", message: "Please select an employee" });
        return;
      }

      const numericValues = Object.fromEntries(
        Object.keys(values).map((key) => [key, numericValue(key)])
      );
      const payload = { employee, ...numericValues };

      if (editData) {
        await axios.put(
          `${API_BASE}/salary-structures/${editData._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast({ type: "success", title: "Success", message: "Salary structure updated" });
      } else {
        await axios.post(`${API_BASE}/salary-structures`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ type: "success", title: "Success", message: "Salary structure added" });
      }

      onClose();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Save Failed",
        message: error?.response?.data?.message || "Failed to save salary structure",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg flex flex-col max-h-[95vh] overflow-hidden border">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
          <h2 className="text-lg font-semibold text-gray-800">
            {editData ? "Edit Salary Structure" : "Add Salary Structure"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {/* Employee Selection */}
          <div className="mb-5">
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Employee <span className="text-red-500">*</span></label>
            <select
              className="w-full border px-3 py-2 rounded mt-1 text-sm outline-none focus:border-orange-500"
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              disabled={!!editData}
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name} ({e.employeeId})
                </option>
              ))}
            </select>
            {editData && <p className="text-[10px] text-gray-400 mt-1 italic">* Cannot change employee in edit mode</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700 border-b pb-1">Earnings</h3>
              {EARNING_COMPONENTS.map(([key, label]) => (
                <div key={key}>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      className="w-full border pl-7 pr-3 py-1.5 rounded text-sm outline-none focus:border-orange-500"
                      value={values[key] ?? "0"}
                      onChange={(e) => setField(key, e.target.value)}
                      onBlur={() => normalizeField(key)}
                    />
                  </div>
                </div>
              ))}
              <div className="bg-gray-50 p-2 rounded border flex justify-between items-center mt-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Gross</span>
                <span className="text-sm font-bold text-gray-900">₹{totalEarnings}</span>
              </div>
            </div>

            {/* Deductions Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700 border-b pb-1">Deductions</h3>
              {DEDUCTION_COMPONENTS.map(([key, label]) => (
                <div key={key}>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      className="w-full border pl-7 pr-3 py-1.5 rounded text-sm outline-none focus:border-orange-500"
                      value={values[key] ?? "0"}
                      onChange={(e) => setField(key, e.target.value)}
                      onBlur={() => normalizeField(key)}
                    />
                  </div>
                </div>
              ))}
              <div className="bg-gray-50 p-2 rounded border flex justify-between items-center mt-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Total Ded.</span>
                <span className="text-sm font-bold text-gray-900">₹{totalDeductions}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Summary */}
        <div className="p-6 border-t flex flex-col items-end gap-4 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Net Payable:</span>
            <span className="text-lg font-bold text-orange-600">₹{netSalary}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 border rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 shadow-sm"
            >
              {editData ? "Update" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSalaryStructureModal;
