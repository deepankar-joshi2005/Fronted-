/** @format */

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plane, LogOut, Clock, UserCog, Wallet } from "lucide-react";
import TravelRequests from "@/pages/HRMS/Employee/Request/TravelRequests";
import ResignationRequest from "@/pages/HRMS/Employee/Request/ResignRequest";
import OvertimeRequestPage from "@/pages/HRMS/Employee/Request/OverTimeRequests";
import ProfileUpdateRequest from "@/pages/HRMS/Employee/Request/ProfileUpdateRequest";
import LeaveEncashmentRequests from "@/pages/HRMS/Employee/Request/LeaveEncashmentRequests";

export default function SelfServiceRequests() {
  return (
    <div className="p-4 md:p-6">
      <Tabs defaultValue="travel" className="w-full">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="travel" className="gap-1.5">
            <Plane className="h-4 w-4" /> Travel
          </TabsTrigger>
          <TabsTrigger value="overtime" className="gap-1.5">
            <Clock className="h-4 w-4" /> Overtime
          </TabsTrigger>
          <TabsTrigger value="profileUpdate" className="gap-1.5">
            <UserCog className="h-4 w-4" /> Profile Update
          </TabsTrigger>
          <TabsTrigger value="leaveEncashment" className="gap-1.5">
            <Wallet className="h-4 w-4" /> Leave Encashment
          </TabsTrigger>
          <TabsTrigger value="resign" className="gap-1.5">
            <LogOut className="h-4 w-4" /> Resignation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="travel" className="mt-0">
          <TravelRequests />
        </TabsContent>
        <TabsContent value="overtime" className="mt-0">
          <OvertimeRequestPage />
        </TabsContent>
        <TabsContent value="profileUpdate" className="mt-0">
          <ProfileUpdateRequest />
        </TabsContent>
        <TabsContent value="leaveEncashment" className="mt-0">
          <LeaveEncashmentRequests />
        </TabsContent>
        <TabsContent value="resign" className="mt-0">
          <ResignationRequest />
        </TabsContent>
      </Tabs>
    </div>
  );
}
