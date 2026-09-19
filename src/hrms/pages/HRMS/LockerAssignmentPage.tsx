/** @format */
import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, MoreVertical } from "lucide-react";
import AllocateLockerModal from "./AllocateLockerModal";

const API = import.meta.env.VITE_API_URL;

export type AssignmentType = "LOCKER" | "CABIN";
export type AssignmentStatus = "ALLOCATED" | "VACATED";

export interface LockerAssignment {
  _id: string;
  employee: {
    _id: string;
    name: string;
    role: string;
    employeeCode: string;
  };
  type: AssignmentType;
  code: string;
  location: string;
  floor: string;
  status: AssignmentStatus;
  assignedAt: string;
}

export default function LockerAssignmentPage() {
  const [data, setData] = useState<LockerAssignment[]>([]);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState<LockerAssignment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const fetchAssignments = async () => {
    const res = await axios.get(`${API}/locker-assignments`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setData(res.data);
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    await axios.delete(`${API}/locker-assignments/${deleteId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setDeleteId(null);
    fetchAssignments();
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Locker / Cabin Assignment</h1>
        <button
          onClick={() => {
            setEditData(null);
            setOpen(true);
          }}
          className="flex gap-2 items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} /> Allocate Locker
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow min-h-[calc(100vh-180px)] overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Role</th>
              <th className="p-4">Type</th>
              <th className="p-4">Code</th>
              <th className="p-4">Location</th>
              <th className="p-4">Floor</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr key={item._id} className="border-t">
                <td className="p-4 font-medium">{item.employee.name}</td>
                <td className="p-4">{item.employee.role}</td>
                <td className="p-4">{item.type}</td>
                <td className="p-4">{item.code}</td>
                <td className="p-4">{item.location}</td>
                <td className="p-4">{item.floor}</td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === "ALLOCATED"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>

                <td className="p-4 relative">
                  <button
                    onClick={() =>
                      setMenuOpenId(menuOpenId === item._id ? null : item._id)
                    }
                  >
                    <MoreVertical />
                  </button>

                  {menuOpenId === item._id && (
                    <div className="absolute right-0 mt-2 bg-white shadow rounded-md w-28 z-10">
                      <button
                        onClick={() => {
                          setEditData(item);
                          setOpen(true);
                          setMenuOpenId(null);
                        }}
                        className="block w-full px-3 py-2 text-left hover:bg-gray-100"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => {
                          setDeleteId(item._id);
                          setMenuOpenId(null);
                        }}
                        className="block w-full px-3 py-2 text-left text-red-600 hover:bg-red-50"
                      >
                        Delete
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="font-semibold text-lg mb-3">Delete Assignment?</h2>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <AllocateLockerModal
        open={open}
        onClose={() => setOpen(false)}
        editData={editData}
        onSuccess={fetchAssignments}
      />
    </div>
  );
}
