/** @format */

export default function DeleteModal({ open, onClose, onConfirm }: any) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-[300px]">
        <h3 className="font-bold mb-3">Delete Asset?</h3>
        <p className="text-sm mb-4">This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={onConfirm}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
