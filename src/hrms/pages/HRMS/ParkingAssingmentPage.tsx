/** @format */
import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, MoreVertical, Eye, Pencil, Trash } from "lucide-react";
import AllocateParkingModal from "./AllocateparkingModal";

const API = import.meta.env.VITE_API_URL;

export type ParkingStatus = "ALLOCATED" | "VACATED";
export type VehicleType = "CAR" | "BIKE";
export type PassType = "PERMANENT" | "TEMPORARY";

export interface ParkingAssignment {
  _id: string;
  employee: {
    _id: string;
    name: string;
    role: string;
  };
  vehicleType: VehicleType;
  vehicleNumber: string;
  parkingSlot: string;
  location: string;
  passType: PassType;
  status: ParkingStatus;
  validFrom: string;
  validTill?: string;
  remarks?: string;
}

export default function ParkingAssignmentPage() {
  const [data, setData] = useState<ParkingAssignment[]>([]);
  const [open, setOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [editData, setEditData] = useState<ParkingAssignment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  /* ================= FETCH ================= */
  const fetchData = async () => {
    const res = await axios.get(`${API}/parking-assignments`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setData(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    if (!deleteId) return;
    await axios.delete(`${API}/parking-assignments/${deleteId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setDeleteId(null);
    fetchData();
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transport & Parking</h1>

        <button
          onClick={() => {
            setEditData(null);
            setViewOnly(false);
            setOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} />
          Allocate Parking
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow min-h-[calc(100vh-180px)] overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Role</th>
              <th className="p-4">Vehicle</th>
              <th className="p-4">Vehicle No</th>
              <th className="p-4">Slot</th>
              <th className="p-4">Location</th>
              <th className="p-4">Pass</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr key={item._id} className="border-t">
                <td className="p-4 font-medium">{item.employee.name}</td>
                <td className="p-4">{item.employee.role}</td>
                <td className="p-4">{item.vehicleType}</td>
                <td className="p-4">{item.vehicleNumber}</td>
                <td className="p-4">{item.parkingSlot}</td>
                <td className="p-4">{item.location}</td>
                <td className="p-4">{item.passType}</td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === "ALLOCATED"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>

                {/* ACTION */}
                <td className="p-4 relative">
                  <button
                    onClick={() =>
                      setMenuOpen(menuOpen === item._id ? null : item._id)
                    }
                  >
                    <MoreVertical />
                  </button>

                  {menuOpen === item._id && (
                    <div className="absolute right-4 top-10 bg-white border rounded-lg shadow w-32 z-10">
                      <button
                        onClick={() => {
                          setEditData(item);
                          setViewOnly(true);
                          setOpen(true);
                          setMenuOpen(null);
                        }}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full"
                      >
                        <Eye size={14} /> View
                      </button>

                      <button
                        onClick={() => {
                          setEditData(item);
                          setViewOnly(false);
                          setOpen(true);
                          setMenuOpen(null);
                        }}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full"
                      >
                        <Pencil size={14} /> Edit
                      </button>

                      <button
                        onClick={() => {
                          setDeleteId(item._id);
                          setMenuOpen(null);
                        }}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 w-full"
                      >
                        <Trash size={14} /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="font-semibold text-lg mb-3">
              Delete Parking Allocation?
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="border px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <AllocateParkingModal
        open={open}
        onClose={() => setOpen(false)}
        editData={editData}
        viewOnly={viewOnly}
        onSuccess={fetchData}
      />
    </div>
  );
}
