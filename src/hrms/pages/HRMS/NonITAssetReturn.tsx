/** @format */
import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

interface AssignedUser {
  _id: string;
  user: {
    _id: string;
    name: string;
    role: string;
  };
  quantity: number;
}

interface Asset {
  _id: string;
  assetName: string;
  assetCode: string;
  assetCategory: string;
  quantity: number;
  damagedCount: number;
  location: string;
  status: string;
  assignedTo: AssignedUser[];
}

export default function AssetReturn() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const token = localStorage.getItem("token");

  /* ================= FETCH ================= */
  const fetchAssets = async () => {
    const res = await axios.get(`${API}/non-it-assets`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setAssets(res.data.filter((a: Asset) => a.assignedTo?.length > 0));
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  /* ================= DISPOSE ================= */
  const handleDispose = async (
    assetId: string,
    assignId: string,
    userId: string,
    quantity: number
  ) => {
    if (!confirm("Dispose asset for this employee?")) return;

    await axios.patch(
      `${API}/non-it-assets/${assetId}/dispose`,
      {
        assignId,
        userId,
        quantity,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    fetchAssets();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-5">
        Asset Return & Verification
      </h2>

      <div className="space-y-5">
        {assets.map((asset) => {
          const issued = asset.assignedTo.reduce(
            (sum, a) => sum + a.quantity,
            0
          );

          const available = asset.quantity - issued - (asset.damagedCount || 0);

          return (
            <div
              key={asset._id}
              className="bg-white border rounded-xl shadow-sm p-4"
            >
              {/* ASSET HEADER */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{asset.assetName}</h3>
                  <p className="text-sm text-gray-500">
                    {asset.assetCode} • {asset.assetCategory}
                  </p>
                  <p className="text-sm text-gray-500">
                    Location: {asset.location}
                  </p>
                </div>

                <div className="text-sm text-right">
                  <p>
                    Total: <b>{asset.quantity}</b>
                  </p>
                  <p>
                    Issued: <b>{issued}</b>
                  </p>
                  <p>
                    Damaged: <b>{asset.damagedCount}</b>
                  </p>
                  <p>
                    Available:{" "}
                    <b
                      className={
                        available > 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {available}
                    </b>
                  </p>
                </div>
              </div>

              {/* ASSIGNED USERS */}
              <div className="border-t pt-3 space-y-2">
                {asset.assignedTo.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">
                        {a.user.name}
                        <span className="text-sm text-gray-500">
                          {" "}
                          ({a.user.role})
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Quantity: {a.quantity}
                      </p>
                    </div>

                    {/* STATUS DROPDOWN */}
                    <select
                      defaultValue="ASSIGNED"
                      onChange={(e) =>
                        e.target.value === "DISPOSED" &&
                        handleDispose(asset._id, a._id, a.user._id, a.quantity)
                      }
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="DISPOSED" className="text-red-600">
                        DISPOSED
                      </option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {assets.length === 0 && (
          <p className="text-center text-gray-500">No assigned assets found</p>
        )}
      </div>
    </div>
  );
}
