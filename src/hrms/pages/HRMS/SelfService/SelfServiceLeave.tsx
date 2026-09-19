/** @format */

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClipboardList, Wallet } from "lucide-react";
import Leave from "@/pages/HRMS/Employee/Leave/Leaves";
import LeaveBalance from "@/pages/HRMS/Employee/Leave/LeaveBalance";

export default function SelfServiceLeave() {
  return (
    <div className="p-4 md:p-6">
      <Tabs defaultValue="apply" className="w-full">
        <TabsList>
          <TabsTrigger value="apply" className="gap-1.5">
            <ClipboardList className="h-4 w-4" /> Apply / My Requests
          </TabsTrigger>
          <TabsTrigger value="balance" className="gap-1.5">
            <Wallet className="h-4 w-4" /> Leave Balance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apply" className="mt-0">
          <Leave />
        </TabsContent>
        <TabsContent value="balance" className="mt-0">
          <LeaveBalance />
        </TabsContent>
      </Tabs>
    </div>
  );
}
