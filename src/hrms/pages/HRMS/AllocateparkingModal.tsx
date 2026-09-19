/** @format */
import { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import type {
  ParkingAssignment,
  PassType,
  VehicleType,
} from "./ParkingAssingmentPage";

const API = import.meta.env.VITE_API_URL;

interface User {
  _id: string;
  name: string;
  role: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData: ParkingAssignment | null;
  viewOnly: boolean;
}

export default function AllocateParkingModal({
  open,
  onClose,
  onSuccess,
  editData,
  viewOnly,
}: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    employee: "",
    vehicleType: "CAR" as VehicleType,
    vehicleNumber: "",
    parkingSlot: "",
    location: "",
    passType: "PERMANENT" as PassType,
    validFrom: "",
    validTill: "",
    remarks: "",
  });

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    const res = await axios.get(`${API}/users`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setUsers(res.data);
  };

  useEffect(() => {
    if (!open) return;

    fetchUsers();

    if (editData) {
      setForm({
        employee: editData.employee._id,
        vehicleType: editData.vehicleType,
        vehicleNumber: editData.vehicleNumber,
        parkingSlot: editData.parkingSlot,
        location: editData.location,
        passType: editData.passType,
        validFrom: editData.validFrom.split("T")[0],
        validTill: editData.validTill?.split("T")[0] || "",
        remarks: editData.remarks || "",
      });
    } else {
      setForm({
        employee: "",
        vehicleType: "CAR",
        vehicleNumber: "",
        parkingSlot: "",
        location: "",
        passType: "PERMANENT",
        validFrom: "",
        validTill: "",
        remarks: "",
      });
    }
  }, [open, editData]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (editData) {
        await axios.patch(`${API}/parking-assignments/${editData._id}`, form, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      } else {
        await axios.post(`${API}/parking-assignments`, form, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      }

      onSuccess();
      onClose();
    } catch {
      alert("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 py-6">
      <div
        className="
  bg-white
  w-full
  max-w-xl
  rounded-xl
  p-6
  relative
  max-h-[90vh]
  overflow-y-auto
"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-black"
        >
          <X />
        </button>

        <h2 className="text-xl font-bold mb-6">
          {viewOnly
            ? "View Parking Allocation"
            : editData
            ? "Edit Parking Allocation"
            : "Allocate Parking"}
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {/* EMPLOYEE */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              disabled={viewOnly}
              value={form.employee}
              onChange={(e) => setForm({ ...form, employee: e.target.value })}
              className="w-full border rounded p-2 disabled:bg-gray-100"
            >
              <option value="">Select Employee</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* VEHICLE TYPE */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Vehicle Type
            </label>
            <select
              disabled={viewOnly}
              value={form.vehicleType}
              onChange={(e) =>
                setForm({
                  ...form,
                  vehicleType: e.target.value as VehicleType,
                })
              }
              className="w-full border rounded p-2 disabled:bg-gray-100"
            >
              <option value="CAR">Car</option>
              <option value="BIKE">Bike</option>
            </select>
          </div>

          {/* VEHICLE NUMBER */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Vehicle Number
            </label>
            <input
              disabled={viewOnly}
              placeholder="DL-01-AB-1234"
              value={form.vehicleNumber}
              onChange={(e) =>
                setForm({ ...form, vehicleNumber: e.target.value })
              }
              className="w-full border rounded p-2 disabled:bg-gray-100"
            />
          </div>

          {/* PARKING SLOT */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Parking Slot
            </label>
            <input
              disabled={viewOnly}
              placeholder="P-12"
              value={form.parkingSlot}
              onChange={(e) =>
                setForm({ ...form, parkingSlot: e.target.value })
              }
              className="w-full border rounded p-2 disabled:bg-gray-100"
            />
          </div>

          {/* LOCATION */}
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              disabled={viewOnly}
              placeholder="Basement / Tower A"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border rounded p-2 disabled:bg-gray-100"
            />
          </div>

          {/* DATES */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Valid From
              </label>
              <input
                disabled={viewOnly}
                type="date"
                value={form.validFrom}
                onChange={(e) =>
                  setForm({ ...form, validFrom: e.target.value })
                }
                className="w-full border rounded p-2 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Valid Till
              </label>
              <input
                disabled={viewOnly}
                type="date"
                value={form.validTill}
                onChange={(e) =>
                  setForm({ ...form, validTill: e.target.value })
                }
                className="w-full border rounded p-2 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* REMARKS */}
          <div>
            <label className="block text-sm font-medium mb-1">Remarks</label>
            <textarea
              disabled={viewOnly}
              rows={3}
              placeholder="Optional notes"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full border rounded p-2 disabled:bg-gray-100"
            />
          </div>
        </div>

        {!viewOnly && (
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="border px-4 py-2 rounded">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {editData ? "Update" : "Allocate"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
