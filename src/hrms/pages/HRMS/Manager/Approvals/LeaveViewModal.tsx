/** @format */
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  data: any;
}

const LeaveViewModal = ({ open, onClose, data }: Props) => {
  if (!open || !data) return null;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-GB");

  const statusBadge = (status: string) => {
    if (status === "APPROVED") return "bg-green-100 text-green-700";
    if (status === "REJECTED") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3"
      onClick={onClose}
    >
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg relative animate-fadeIn"
       onClick={(e) => e.stopPropagation()} >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">Leave Request Details</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500">Employee</p>
              <p className="font-medium">{data.employee?.name || "-"}</p>
            </div>

            <div>
              <p className="text-gray-500">Leave Type</p>
              <p className="font-medium">{data.leaveType}</p>
            </div>

            <div>
              <p className="text-gray-500">From Date</p>
              <p className="font-medium">{formatDate(data.fromDate)}</p>
            </div>

            <div>
              <p className="text-gray-500">To Date</p>
              <p className="font-medium">{formatDate(data.toDate)}</p>
            </div>

            <div>
              <p className="text-gray-500">Total Days</p>
              <p className="font-medium">{data.totalDays}</p>
            </div>

            <div>
              <p className="text-gray-500">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                  data.status,
                )}`}
              >
                {data.status}
              </span>
            </div>
          </div>

          <div>
            <p className="text-gray-500">Reason</p>
            <p className="mt-1 bg-gray-50 border rounded-md p-3 text-sm">
              {data.reason}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveViewModal;
