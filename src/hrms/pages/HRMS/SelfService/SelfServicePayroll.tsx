/** @format */

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Wallet } from "lucide-react";
import EmployeePayslips from "@/pages/HRMS/Payroll/EmployeePayslips";
import EmployeeSalaryStructure from "@/pages/HRMS/Payroll/EmployeeSallaryStracture";

export default function SelfServicePayroll() {
  return (
    <div className="p-4 md:p-6">
      <Tabs defaultValue="payslips" className="w-full">
        <TabsList>
          <TabsTrigger value="payslips" className="gap-1.5">
            <FileText className="h-4 w-4" /> Payslips
          </TabsTrigger>
          <TabsTrigger value="structure" className="gap-1.5">
            <Wallet className="h-4 w-4" /> Salary Structure
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payslips" className="mt-0">
          <EmployeePayslips />
        </TabsContent>
        <TabsContent value="structure" className="mt-0">
          <EmployeeSalaryStructure />
        </TabsContent>
      </Tabs>
    </div>
  );
}
