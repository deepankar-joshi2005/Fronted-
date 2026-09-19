/** @format */

import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function DeleteCardModal({ card, onClose, onDeleted }: any) {
  if (!card) return null;

  const handleDelete = async () => {
    await axios.delete(`${API}/access-cards/${card._id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    onDeleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-2">Delete Card</h2>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete card <b>{card.cardNumber}</b>?
        </p>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded">
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
  );
}
