/** @format */
import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, MoreVertical } from "lucide-react";
import IssueCardModal from "./IssueCardModal";
import DeleteCardModal from "./DeleteCardModal";

const API = import.meta.env.VITE_API_URL;

type CardStatus = "ACTIVE" | "BLOCKED" | "RETURNED";

interface Card {
  _id: string;
  employee: {
    _id: string;
    name: string;
    role: string;
    employeeCode: string;
  };
  cardType: "ID_CARD" | "ACCESS_CARD";
  cardNumber: string;
  accessLevel: string;
  status: CardStatus;
  issuedAt: string;
}

export default function AccessCardManagement() {
  const [cards, setCards] = useState<Card[]>([]);
  const [open, setOpen] = useState(false);
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [deleteCard, setDeleteCard] = useState<Card | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchCards = async () => {
    const res = await axios.get(`${API}/access-cards`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setCards(res.data);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const updateStatus = async (id: string, status: CardStatus) => {
    await axios.patch(
      `${API}/access-cards/${id}/status`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    fetchCards();
  };

  const statusStyle = (status: CardStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "BLOCKED":
        return "bg-yellow-100 text-yellow-700";
      case "RETURNED":
        return "bg-red-100 text-red-700";
    }
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Access Card & ID Card</h1>

        <button
          onClick={() => {
            setEditCard(null);
            setOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} />
          Issue Card
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow min-h-[calc(100vh-180px)] overflow-x-auto">
        <table className="w-full text-center">
          <thead className="bg-gray-50 text-sm text-gray-600">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Role</th>
              <th className="p-4">Card Type</th>
              <th className="p-4">Card No</th>
              <th className="p-4">Access Level</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {cards.map((c) => (
              <tr key={c._id} className="border-t text-sm relative">
                <td className="p-4 font-medium">{c.employee.name}</td>
                <td className="p-4">{c.employee.role}</td>
                <td className="p-4">{c.cardType}</td>
                <td className="p-4">{c.cardNumber}</td>
                <td className="p-4">{c.accessLevel}</td>

                {/* STATUS WITH DROPDOWN */}
                <td className="p-4">
                  {c.status !== "RETURNED" ? (
                    <select
                      value={c.status}
                      onChange={(e) =>
                        updateStatus(c._id, e.target.value as CardStatus)
                      }
                      className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer ${statusStyle(
                        c.status
                      )}`}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="BLOCKED">BLOCKED</option>
                      <option value="RETURNED">RETURNED</option>
                    </select>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle(
                        c.status
                      )}`}
                    >
                      {c.status}
                    </span>
                  )}
                </td>

                {/* 3 DOT MENU */}
                <td className="p-4 relative">
                  <button
                    onClick={() =>
                      setMenuOpen(menuOpen === c._id ? null : c._id)
                    }
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {menuOpen === c._id && (
                    <div className="absolute right-4 top-12 bg-white border rounded shadow w-32 text-left z-50">

                      <button
                        className="w-full px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setEditCard(c);
                          setOpen(true);
                          setMenuOpen(null);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setDeleteCard(c);
                          setMenuOpen(null);
                        }}
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

      {/* ISSUE / EDIT MODAL */}
      <IssueCardModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={fetchCards}
        editData={editCard}
      />

      {/* DELETE MODAL */}
      <DeleteCardModal
        card={deleteCard}
        onClose={() => setDeleteCard(null)}
        onDeleted={fetchCards}
      />
    </div>
  );
}
