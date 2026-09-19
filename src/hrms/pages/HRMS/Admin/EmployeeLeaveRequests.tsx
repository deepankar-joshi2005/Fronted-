/** @format */
import { useEffect, useState } from "react";
import axios from "axios";
import LeaveViewModal from "../Manager/Approvals/LeaveViewModal";
import Loader from "../Loader";
import { toast } from "../Alert/Toast";
const EmployeeLeaveRequest = () => {
  const API_BASE = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [leaves, setLeaves] = useState<any[]>([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [loading,setLoading]=useState(true);

  /* ================= FETCH ALL LEAVES ================= */
  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`${API_BASE}/employee/leaves/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaves(res.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch leave requests", error);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  /* ================= UPDATE STATUS ================= */
 const updateStatus = async (id: string, status: string) => {
   try {
     const res = await axios.patch(
       `${API_BASE}/employee/leaves/manager/leaves/${id}/status`,
       { status },
       { headers: { Authorization: `Bearer ${token}` } },
     );

     toast({
       type: "success",
       title: status === "APPROVED" ? "Leave Approved" : "Leave Rejected",
       message:
         res.data?.message ||
         `Leave has been ${status.toLowerCase()} successfully.`,
     });

     fetchLeaves();
   } catch (error: any) {
     toast({
       type: "error",
       title: "Action Failed",
       message:
         error?.response?.data?.message ||
         "Unable to update leave status. Please try again.",
     });

     console.error("Failed to update status", error);
   }
 };


  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-GB");

  const statusColor = (status: string) => {
    if (status === "APPROVED") return "text-green-600";
    if (status === "REJECTED") return "text-red-600";
    return "text-yellow-600";
  };
   if (loading) {
      return (
        <div className="relative min-h-[300px]">
          <Loader/>
        </div>
      );
    }
  

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Leave Requests</h2>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Employee</th>
              <th className="p-3">Type</th>
              <th className="p-3">From</th>
              <th className="p-3">To</th>
              <th className="p-3">Days</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {leaves.map((l) => (
              <tr key={l._id} className="border-t">
                <td className="p-3 font-medium">{l.employee?.name || "-"}</td>
                <td className="p-3">{l.leaveType}</td>
                <td className="p-3">{formatDate(l.fromDate)}</td>
                <td className="p-3">{formatDate(l.toDate)}</td>
                <td className="p-3">{l.totalDays}</td>

                {/* STATUS DROPDOWN */}
                <td className="p-3">
                  <select
                    value={l.status}
                    onChange={(e) => updateStatus(l._id, e.target.value)}
                    className={`border rounded px-2 py-1 text-xs font-semibold ${statusColor(
                      l.status
                    )}`}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </td>

                {/* ONLY VIEW */}
                <td
                  className="p-3 text-primary text-xs cursor-pointer"
                  onClick={() => {
                    setSelectedLeave(l);
                    setViewOpen(true);
                  }}
                >
                  View
                </td>
              </tr>
            ))}

            {leaves.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-gray-500">
                  No leave requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <LeaveViewModal
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelectedLeave(null);
        }}
        data={selectedLeave}
      />
    </div>
  );
};

export default EmployeeLeaveRequest;
