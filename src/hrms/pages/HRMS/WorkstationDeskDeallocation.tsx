/** @format */
import { useEffect, useState } from "react";
import axios from "axios";
import { Plus } from "lucide-react";
import AllocateDeskModal from "./AllocateDeskModal";

const API = import.meta.env.VITE_API_URL;

interface AllocationRow {
  _id: string;
  employee: {
    _id: string;
    name: string;
    role: string;
    department: string;
  };
  location: string;
  building: string;
  floor: string;
  deskCode: string;
  seatType: string;
  status: "PENDING" | "ALLOCATED" | "RELEASED";
  assignedAt?: string;
}

const WorkstationDeskDeallocation = () => {
  const [rows, setRows] = useState<AllocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAllocate, setOpenAllocate] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/workstations`, { headers });
      setRows(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, []);

  const updateStatus = async (
    id: string,
    status: "ALLOCATED" | "PENDING" | "RELEASED"
  ) => {
    try {
      await axios.patch(
        `${API}/workstations/${id}/status`,
        { status },
        { headers }
      );
      fetchAllocations();
    } catch (err) {
      console.error("Status update failed", err);
    }
  };


  if (loading) return <p>Loading workstation allocations...</p>;

  return (
    <div className="bg-white rounded-xl shadow p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Workstation & Desk Allocation</h2>

        <button
          onClick={() => setOpenAllocate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus size={16} />
          Allocate Desk
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Employee</th>
              <th className="p-3">Role</th>

              <th className="p-3">Location</th>
              <th className="p-3">Desk</th>
              <th className="p-3">Seat Type</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row._id} className="border-t">
                <td className="p-3 font-medium">{row.employee.name}</td>

                <td className="p-3">{row.employee.role}</td>

                <td className="p-3">
                  {row.location} – {row.building} – {row.floor}
                </td>

                <td className="p-3 font-mono">{row.deskCode}</td>

                <td className="p-3">{row.seatType}</td>

                <td className="p-3">
                  <select
                    value={row.status}
                    onChange={(e) =>
                      updateStatus(row._id, e.target.value as any)
                    }
                    className={`px-2 py-1 rounded text-xs font-medium border cursor-pointer
      ${
        row.status === "ALLOCATED"
          ? "bg-green-100 text-green-700 border-green-300"
          : row.status === "PENDING"
          ? "bg-yellow-100 text-yellow-700 border-yellow-300"
          : "bg-red-100 text-red-700 border-red-300"
      }
    `}
                  >
                    <option value="ALLOCATED">Allocated</option>
                    

                    {/* 🔥 DEALLOCATION OPTION */}
                    <option
                      value="RELEASED"
                      className="text-red-600 font-semibold"
                    >
                      Deallocate
                    </option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {openAllocate && (
        <AllocateDeskModal
          onClose={() => setOpenAllocate(false)}
          onSuccess={fetchAllocations}
        />
      )}
    </div>
  );
};

export default WorkstationDeskDeallocation;
