/** @format */

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, CalendarDays, ClipboardList } from "lucide-react";
import MarkAttendance from "@/pages/HRMS/Employee/Attendance/MarkAttendance";
import AttendanceCalendar from "@/pages/HRMS/Employee/Attendance/AttendanceCalender";
import AttendanceRequest from "@/pages/HRMS/Employee/Attendance/AttendanceRequest";

export default function SelfServiceAttendance() {
  return (
    <div className="p-4 md:p-6">
      <Tabs defaultValue="punch" className="w-full">
        <TabsList>
          <TabsTrigger value="punch" className="gap-1.5">
            <Clock className="h-4 w-4" /> Punch In / Out
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5">
            <CalendarDays className="h-4 w-4" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5">
            <ClipboardList className="h-4 w-4" /> Correction Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="punch" className="mt-0">
          <MarkAttendance />
        </TabsContent>
        <TabsContent value="calendar" className="mt-0">
          <AttendanceCalendar />
        </TabsContent>
        <TabsContent value="requests" className="mt-0">
          <AttendanceRequest />
        </TabsContent>
      </Tabs>
    </div>
  );
}
