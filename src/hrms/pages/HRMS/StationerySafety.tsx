/** @format */
import { useEffect, useState } from "react";
import axios from "axios";
import { MoreVertical } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

interface User {
  _id: string;
  name: string;
  employeeCode: string;
}

interface AssignedAsset {
  user: string;
  quantity: number;
}

export interface Asset {
  _id: string;
  assetCode: string;
  assetName: string;
  assetCategory: string;
  location: string;
  quantity: number;
  damagedCount: number;
  assignedTo: AssignedAsset[];
}

export default function StationerySafety() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  /* ASSIGN MODAL STATES */
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignAsset, setAssignAsset] = useState<Asset | null>(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [assignQty, setAssignQty] = useState(1);

  /* ================= FETCH ================= */
  const fetchAssets = async () => {
    const res = await axios.get(`${API}/non-it-assets`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setAssets(res.data);
  };

  const fetchUsers = async () => {
    const res = await axios.get(`${API}/users`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setUsers(res.data);
  };

  useEffect(() => {
    fetchAssets();
    fetchUsers();
  }, []);

  /* ================= ASSIGN HANDLER ================= */
  const handleAssign = async () => {
    if (!assignAsset || !selectedUser) return;

    await axios.post(
      `${API}/non-it-assets/${assignAsset._id}/assign`,
      {
        userId: selectedUser,
        quantity: assignQty,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    setAssignOpen(false);
    setAssignAsset(null);
    setSelectedUser("");
    setAssignQty(1);
    fetchAssets();
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-6">
        Stationery & Safety Kits Inventory
      </h1>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4">Code</th>
              <th className="p-4">Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Location</th>
              <th className="p-4">Total</th>
              <th className="p-4">Issued</th>
              <th className="p-4">Damaged</th>
              <th className="p-4">Available</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {assets.map((a) => {
              const issuedQty =
                a.assignedTo?.reduce((sum, x) => sum + x.quantity, 0) || 0;

              const available = a.quantity - issuedQty - (a.damagedCount || 0);

              return (
                <tr key={a._id} className="border-t">
                  <td className="p-4 font-medium">{a.assetCode}</td>
                  <td className="p-4">{a.assetName}</td>
                  <td className="p-4">{a.assetCategory}</td>
                  <td className="p-4">{a.location}</td>
                  <td className="p-4">{a.quantity}</td>
                  <td className="p-4">{issuedQty}</td>
                  <td className="p-4">{a.damagedCount}</td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        available > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {available}
                    </span>
                  </td>

                  {/* ACTION */}
                  <td className="p-4 relative">
                    <button
                      onClick={() =>
                        setMenuOpen(menuOpen === a._id ? null : a._id)
                      }
                    >
                      <MoreVertical />
                    </button>

                    {menuOpen === a._id && (
                      <div className="absolute right-4 top-10 bg-white border rounded-lg shadow w-32 z-10">
                        <button
                          onClick={() => {
                            setAssignAsset(a);
                            setAssignOpen(true);
                            setMenuOpen(null);
                          }}
                          className="px-3 py-2 hover:bg-gray-50 w-full text-left"
                        >
                          Assign
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= ASSIGN MODAL ================= */}
      {assignOpen && assignAsset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-semibold mb-2">Assign Asset</h2>

            <p className="text-sm mb-3">
              Asset: <b>{assignAsset.assetName}</b>
            </p>

            <p className="text-sm mb-4">
              Available:{" "}
              <b>
                {assignAsset.quantity -
                  (assignAsset.assignedTo?.reduce(
                    (s, x) => s + x.quantity,
                    0
                  ) || 0) -
                  (assignAsset.damagedCount || 0)}
              </b>
            </p>

            {/* EMPLOYEE DROPDOWN */}
            <label className="text-sm font-medium">Employee</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1 mb-3"
            >
              <option value="">Select Employee</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.employeeCode})
                </option>
              ))}
            </select>

            {/* QUANTITY */}
            <label className="text-sm font-medium">Assign Quantity</label>
            <input
              type="number"
              min={1}
              max={
                assignAsset.quantity -
                (assignAsset.assignedTo?.reduce((s, x) => s + x.quantity, 0) ||
                  0) -
                (assignAsset.damagedCount || 0)
              }
              value={assignQty}
              onChange={(e) => setAssignQty(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 mt-1"
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setAssignOpen(false)}
                className="border px-4 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleAssign}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
