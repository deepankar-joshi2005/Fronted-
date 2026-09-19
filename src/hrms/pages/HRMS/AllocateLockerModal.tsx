/** @format */
import { useEffect, useState } from "react";
import axios from "axios";
import { type LockerAssignment } from "./LockerAssignmentPage";

const API = import.meta.env.VITE_API_URL;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: LockerAssignment | null;
}

interface Employee {
  _id: string;
  name: string;
  role: string;
  employeeCode: string;
}

export default function AllocateLockerModal({
  open,
  onClose,
  onSuccess,
  editData,
}: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({
    employee: "",
    type: "LOCKER",
    code: "",
    location: "",
    floor: "",
    remarks: "",
  });

  useEffect(() => {
    if (!open) return;

    axios
      .get(`${API}/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setEmployees(res.data));

    if (editData) {
      setForm({
        employee: editData.employee._id,
        type: editData.type,
        code: editData.code,
        location: editData.location,
        floor: editData.floor,
        remarks: "",
      });
    }
  }, [open, editData]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (editData) {
      await axios.put(
        `${API}/locker-assignments/${editData._id}`,
        form,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
    } else {
      await axios.post(`${API}/locker-assignments`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    }
    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[420px] p-6">
        <h2 className="text-lg font-semibold mb-4">
          {editData ? "Edit Assignment" : "Allocate Locker / Cabin"}
        </h2>

        {[
          { label: "Employee", key: "employee", type: "select" },
          { label: "Type", key: "type", type: "selectType" },
          { label: "Locker / Cabin Code", key: "code" },
          { label: "Location", key: "location" },
          { label: "Floor", key: "floor" },
        ].map((f) => (
          <div key={f.key} className="mb-3">
            <label className="text-sm font-medium">{f.label}</label>
            {f.type === "select" ? (
              <select
                className="w-full border rounded px-3 py-2"
                value={form.employee}
                onChange={(e) =>
                  setForm({ ...form, employee: e.target.value })
                }
              >
                <option value="">Select Employee</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name} ({e.employeeCode})
                  </option>
                ))}
              </select>
            ) : f.type === "selectType" ? (
              <select
                className="w-full border rounded px-3 py-2"
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value })
                }
              >
                <option value="LOCKER">Locker</option>
                <option value="CABIN">Cabin</option>
              </select>
            ) : (
              <input
                className="w-full border rounded px-3 py-2"
                value={(form as any)[f.key]}
                onChange={(e) =>
                  setForm({ ...form, [f.key]: e.target.value })
                }
              />
            )}
          </div>
        ))}

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {editData ? "Update" : "Allocate"}
          </button>
        </div>
      </div>
    </div>
  );
}
