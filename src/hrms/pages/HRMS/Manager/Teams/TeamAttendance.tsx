/** @format */

import AttendanceMatrix from "../../Admin/AttendanceMatrix";

const API_BASE = import.meta.env.VITE_API_URL;

const TeamAttendance = () => (
  <AttendanceMatrix
    title="Attendance Records"
    subtitle="View and manage monthly attendance records for your team."
    fetchUrl={`${API_BASE}/attendance/team`}
  />
);

export default TeamAttendance;
