/** @format */
export default function SelfAppraisalViewModal({ open, onClose, data }: any) {
  // 🔒 SAFETY GUARD: modal tabhi render hoga jab open aur data dono hon
  if (!open || !data) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Self Appraisal</h2>
          <button onClick={onClose} className="text-gray-500">
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <b>Title:</b> {data.title}
          </p>
          <p>
            <b>Type:</b> {data.type}
          </p>
          <p>
            <b>Status:</b> {data.status}
          </p>
          <p>
            <b>Duration:</b> {new Date(data.startDate).toLocaleDateString()} -{" "}
            {new Date(data.endDate).toLocaleDateString()}
          </p>
          <p>
            <b>Applicable For:</b> {data.applicableFor}
          </p>
          <p>
            <b>Progress:</b> {data.progress}%
          </p>

          {/* OPTIONAL INFO */}
          {!data.goalsAchievement && (
            <p className="text-xs text-gray-500 italic">
              Self appraisal not submitted yet.
            </p>
          )}
        </div>

        <div className="text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
