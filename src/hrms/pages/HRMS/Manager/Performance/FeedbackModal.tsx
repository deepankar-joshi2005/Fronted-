/** @format */
import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function FeedbackModal({
  open,
  onClose,
  selfAppraisalId,
  readOnly = false,
}: any) {
  const token = localStorage.getItem("token");

  const [managerRatings, setManagerRatings] = useState<any>({
    technical: 0,
    communication: 0,
    teamwork: 0,
    problemSolving: 0,
  });

  const [feedback, setFeedback] = useState("");
  const [recommendation, setRecommendation] = useState("");

  /* 🔹 FETCH EXISTING FEEDBACK (ONLY WHEN READONLY) */
  useEffect(() => {
    if (open && readOnly) {
      fetchFeedback();
    }
  }, [open, readOnly]);

  const fetchFeedback = async () => {
    const res = await axios.get(`${API}/feedback/my/${selfAppraisalId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setManagerRatings(res.data.managerRatings || {});
    setFeedback(res.data.feedback || "");
    setRecommendation(res.data.recommendation || "");
  };

  /* 🔹 SUBMIT (NORMAL FLOW) */
  const handleSubmit = async () => {
    await axios.post(
      `${API}/feedback`,
      {
        selfAppraisalId,
        managerRatings,
        feedback,
        recommendation,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {readOnly ? "View Feedback" : "Give Feedback"}
          </h2>
          <button onClick={onClose}>✕</button>
        </div>

        {/* RATINGS */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {Object.keys(managerRatings).map((key) => (
            <div key={key}>
              <label className="block mb-1 capitalize">{key}</label>
              <input
                type="number"
                min={1}
                max={5}
                value={managerRatings[key]}
                disabled={readOnly}
                onChange={(e) =>
                  setManagerRatings({
                    ...managerRatings,
                    [key]: Number(e.target.value),
                  })
                }
                className={`w-full border rounded-md px-2 py-1 ${
                  readOnly ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              />
            </div>
          ))}
        </div>

        {/* FEEDBACK */}
        <div>
          <label className="block mb-1 text-sm">Feedback</label>
          <textarea
            rows={3}
            value={feedback}
            disabled={readOnly}
            onChange={(e) => setFeedback(e.target.value)}
            className={`w-full border rounded-md px-3 py-2 text-sm ${
              readOnly ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          />
        </div>

        {/* RECOMMENDATION */}
        <div>
          <label className="block mb-1 text-sm">Recommendation</label>
          <textarea
            rows={2}
            value={recommendation}
            disabled={readOnly}
            onChange={(e) => setRecommendation(e.target.value)}
            className={`w-full border rounded-md px-3 py-2 text-sm ${
              readOnly ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border text-sm"
          >
            Close
          </button>

          {!readOnly && (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded-md bg-primary text-white text-sm"
            >
              Submit Feedback
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
