/** @format */

import axios from "axios";
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function AddAssetModal({
  open,
  onClose,
  onSuccess,
  editData,
}: any) {
  const [form, setForm] = useState<any>({
    assetCode: "",
    assetName: "",
    category: "",
    location: "",
    totalQty: "",
    remarks: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (editData) setForm(editData);
  }, [editData]);

  if (!open) return null;

  const submit = async () => {
    if (editData)
      await axios.patch(`${API}/non-it-assets/${editData._id}`, form,{
        headers: { Authorization: `Bearer ${token}` },
      });
    else await axios.post(`${API}/non-it-assets`, form,{
        headers: { Authorization: `Bearer ${token}` },
    });

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-[420px]">
        <h2 className="font-bold mb-4">
          {editData ? "Edit Asset" : "Add Asset"}
        </h2>

        {[
          ["assetCode", "Asset Code", "ST-001"],
          ["assetName", "Asset Name", "Safety Helmet"],
          ["assetCategory", "Category", "Stationery"],
          ["location", "Location", "Store Room"],
          ["quantity", "Total Quantity", "100"],
        ].map(([k, l, p]) => (
          <div key={k} className="mb-3">
            <label className="text-sm">{l}</label>
            <input
              placeholder={p}
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="border w-full p-2 rounded"
            />
          </div>
        ))}

        <textarea
          placeholder="Remarks (optional)"
          value={form.remarks}
          onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          className="border w-full p-2 rounded mb-4"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={submit}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
