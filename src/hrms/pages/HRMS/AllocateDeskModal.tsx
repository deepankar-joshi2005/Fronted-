/** @format */
import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const AllocateDeskModal = ({ onClose, onSuccess }: Props) => {
  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    employeeId: "",
    location: "",
    building: "",
    floor: "",
    deskCode: "",
    seatType: "OPEN_DESK",
  });

  /* ---------------- FETCH EMPLOYEES ---------------- */
  const fetchEmployees = async () => {
    const res = await axios.get(`${API}/users`, { headers });
    setEmployees(res.data);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  /* ---------------- SUBMIT ---------------- */
  const handleAllocate = async () => {
    try {
      setLoading(true);

      await axios.post(
        `${API}/workstations/assign`,
        {
          employeeId: form.employeeId,
          location: form.location,
          building: form.building,
          floor: form.floor,
          deskCode: form.deskCode,
          seatType: form.seatType,
        },
        { headers }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-3">
      <div className="bg-white w-full max-w-lg rounded-xl p-6">
        {/* HEADER */}
        <h3 className="text-lg font-semibold mb-5">
          Allocate Workstation / Desk
        </h3>

        {/* FORM */}
        <div className="grid grid-cols-1 gap-4">
          {/* EMPLOYEE */}
          <div>
            <label className="block text-sm font-medium mb-1">Employee</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          {/* LOCATION */}
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              placeholder="e.g. Noida"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* BUILDING */}
          <div>
            <label className="block text-sm font-medium mb-1">Building</label>
            <input
              placeholder="e.g. Tower A"
              value={form.building}
              onChange={(e) => setForm({ ...form, building: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* FLOOR */}
          <div>
            <label className="block text-sm font-medium mb-1">Floor</label>
            <input
              placeholder="e.g. 3rd Floor"
              value={form.floor}
              onChange={(e) => setForm({ ...form, floor: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* DESK / CABIN */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Desk / Cabin Code
            </label>
            <input
              placeholder="e.g. WS-034"
              value={form.deskCode}
              onChange={(e) => setForm({ ...form, deskCode: e.target.value })}
              className="w-full border rounded px-3 py-2 font-mono"
            />
          </div>

          {/* SEAT TYPE */}
          <div>
            <label className="block text-sm font-medium mb-1">Seat Type</label>
            <select
              value={form.seatType}
              onChange={(e) => setForm({ ...form, seatType: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="OPEN_DESK">Open Desk</option>
              <option value="CABIN">Cabin</option>
            </select>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded text-sm"
          >
            Cancel
          </button>

          <button
            onClick={handleAllocate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            {loading ? "Allocating..." : "Allocate Desk"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllocateDeskModal;
