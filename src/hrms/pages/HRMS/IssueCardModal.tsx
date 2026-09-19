/** @format */
import { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

type CardType = "ID_CARD" | "ACCESS_CARD";
type CardStatus = "ACTIVE";

interface User {
  _id: string;
  name: string;
  role: string;
}

interface Card {
  _id: string;
  employee: {
    _id: string;
    name: string;
    role: string;
    employeeCode: string;
  };
  cardType: CardType;
  cardNumber: string;
  accessLevel: string;
  remarks?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: Card | null;
}

export default function IssueCardModal({
  open,
  onClose,
  onSuccess,
  editData,
}: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    employee: "",
    cardType: "ID_CARD" as CardType,
    cardNumber: "",
    accessLevel: "",
    remarks: "",
  });

  /* ================= PREFILL (EDIT MODE) ================= */
  useEffect(() => {
    if (editData && open) {
      setForm({
        employee: editData.employee._id,
        cardType: editData.cardType,
        cardNumber: editData.cardNumber,
        accessLevel: editData.accessLevel,
        remarks: editData.remarks || "",
      });
    }

    if (!editData && open) {
      setForm({
        employee: "",
        cardType: "ID_CARD",
        cardNumber: "",
        accessLevel: "",
        remarks: "",
      });
    }
  }, [editData, open]);

  /* ================= FETCH EMPLOYEES ================= */
  const fetchUsers = async () => {
    const res = await axios.get(`${API}/users`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setUsers(res.data);
  };

  useEffect(() => {
    if (open) fetchUsers();
  }, [open]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!form.employee || !form.cardNumber || !form.accessLevel) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      if (editData) {
        // ✅ UPDATE
        await axios.put(
          `${API}/access-cards/${editData._id}`,
          {
            employee: form.employee,
            cardType: form.cardType,
            cardNumber: form.cardNumber,
            accessLevel: form.accessLevel,
            remarks: form.remarks,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } else {
        // ✅ CREATE
        await axios.post(
          `${API}/access-cards`,
          {
            employee: form.employee,
            cardType: form.cardType,
            cardNumber: form.cardNumber,
            accessLevel: form.accessLevel,
            status: "ACTIVE" as CardStatus,
            remarks: form.remarks,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Issue/Update card error", err);
      alert("Failed to save card");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-xl rounded-xl p-6 relative">
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-black"
        >
          <X />
        </button>

        <h2 className="text-xl font-bold mb-6">
          {editData ? "Edit Card" : "Issue Access / ID Card"}
        </h2>

        {/* FORM */}
        <div className="grid grid-cols-1 gap-4">
          {/* EMPLOYEE */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              value={form.employee}
              onChange={(e) => setForm({ ...form, employee: e.target.value })}
              className="w-full border rounded p-2"
              disabled={!!editData}
            >
              <option value="">Select Employee</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* CARD TYPE */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Card Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.cardType}
              onChange={(e) =>
                setForm({
                  ...form,
                  cardType: e.target.value as CardType,
                })
              }
              className="w-full border rounded p-2"
            >
              <option value="ID_CARD">ID Card</option>
              <option value="ACCESS_CARD">Access Card</option>
            </select>
          </div>

          {/* CARD NUMBER */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Card Number <span className="text-red-500">*</span>
            </label>
            <input
              value={form.cardNumber}
              onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
              className="w-full border rounded p-2"
            />
          </div>

          {/* ACCESS LEVEL */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Access Level <span className="text-red-500">*</span>
            </label>
            <input
              value={form.accessLevel}
              onChange={(e) =>
                setForm({ ...form, accessLevel: e.target.value })
              }
              className="w-full border rounded p-2"
            />
          </div>

          {/* REMARKS */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full border rounded p-2"
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="border px-4 py-2 rounded">
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading
              ? editData
                ? "Updating..."
                : "Issuing..."
              : editData
              ? "Update Card"
              : "Issue Card"}
          </button>
        </div>
      </div>
    </div>
  );
}
