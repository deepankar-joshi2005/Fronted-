/** @format */
import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, MoreVertical, Pencil, Trash } from "lucide-react";
import AddAssetModal from "./AddAssetModal";
import DeleteModal from "./DeleteModal";

const API = import.meta.env.VITE_API_URL;

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
  issuedQty: number;
  damagedCount: number;
  status: string;
  remarks?: string;
  assignedTo: AssignedAsset[];
}

export default function NonITAssetInventoryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState<Asset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [damageOpen, setDamageOpen] = useState(false);
  const [damageAsset, setDamageAsset] = useState<Asset | null>(null);
  const [damageCount, setDamageCount] = useState(1);


  /* ================= FETCH ================= */
  const fetchAssets = async () => {
    const res = await axios.get(`${API}/non-it-assets`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setAssets(res.data);
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleMarkDamaged = async () => {
    if (!damageAsset) return;

    await axios.patch(
      `${API}/non-it-assets/${damageAsset._id}/mark-damaged`,
      { count: damageCount },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    setDamageOpen(false);
    setDamageAsset(null);
    fetchAssets();
  };


  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Non-IT Asset Inventory</h1>

        <button
          onClick={() => {
            setEditData(null);
            setOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} />
          Add Asset
        </button>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white rounded-lg shadow min-h-[calc(100vh-180px)] overflow-x-auto">
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

                const available =
                  a.quantity - issuedQty - (a.damagedCount || 0);

              return (
                <tr key={a._id} className="border-t">
                  <td className="p-4 font-medium">{a.assetCode}</td>
                  <td className="p-4">{a.assetName}</td>
                  <td className="p-4">{a.assetCategory}</td>
                  <td className="p-4">{a.location}</td>
                  <td className="p-4">{a.quantity}</td>
                  <td className="p-4">{a.assignedTo?.length ?? 0}</td>
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
                            setEditData(a);
                            setOpen(true);
                            setMenuOpen(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 w-full"
                        >
                          <Pencil size={14} /> Edit
                        </button>

                        <button
                          onClick={() => {
                            setDamageAsset(a);
                            setDamageCount(1);
                            setDamageOpen(true);
                            setMenuOpen(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-yellow-50 text-yellow-600 w-full"
                        >
                          🛠 Damage
                        </button>

                        <button
                          onClick={() => {
                            setDeleteId(a._id);
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT MODAL */}
      <AddAssetModal
        open={open}
        onClose={() => setOpen(false)}
        editData={editData}
        onSuccess={fetchAssets}
      />

      {/* DELETE MODAL */}
      <DeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          await axios.delete(`${API}/non-it-assets/${deleteId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          setDeleteId(null);
          fetchAssets();
        }}
      />
      {damageOpen && damageAsset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-semibold mb-2">
              Mark Asset as Damaged
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Asset: <b>{damageAsset.assetName}</b>
            </p>

            <label className="text-sm font-medium">Damaged Quantity</label>
            <input
              type="number"
              min={1}
              max={
                damageAsset.quantity -
                damageAsset.assignedTo?.reduce((sum, x) => sum + x.quantity, 0) ||
                0 -
                damageAsset.damagedCount
              }
              value={damageCount}
              onChange={(e) => setDamageCount(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 mt-1"
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDamageOpen(false)}
                className="border px-4 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleMarkDamaged}
                className="bg-yellow-600 text-white px-4 py-2 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
