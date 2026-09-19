/** @format */

import AttendanceMatrix from "./AttendanceMatrix";

const API_BASE = import.meta.env.VITE_API_URL;

const AttendanceReport = () => (
  <AttendanceMatrix
    title="Attendance Records"
    subtitle="View and manage monthly attendance records."
    fetchUrl={`${API_BASE}/attendance/all`}
    paginated
  />
);

export default AttendanceReport;
