/** @format */

import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Loader from "../Loader";
import { toast } from "../Alert/Toast";

/* ================= TYPES ================= */
const API_BASE = import.meta.env.VITE_API_URL;
interface Employee {
  _id: string;
  name: string;
  role: string;
}

interface Department {
  _id: string;
  name: string;
  headEmployeeId?: {
    _id: string;
    name: string;
  };
}

interface Task {
  _id: string;
  employee: { name: string };
  department: { name: string };
  task: string;
  status: "PENDING" | "COMPLETED";
}

/* ================= TOKEN ================= */

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

/* ================= COMPONENT ================= */

const OnboardingTasks = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    employeeId: "",
    departmentId: "",
    task: "",
  });

  const [errors, setErrors] = useState({
    employeeId: "",
    departmentId: "",
    task: "",
  });

  /* ================= FETCH ALL ================= */

  const fetchAll = async () => {
    try {
      const empRes = await axios.get(`${API_BASE}/users`, {
        ...getAuthHeaders(),
        params: { excludeRoles: "superadmin" },
      });

      const deptRes = await axios.get(
        `${API_BASE}/departments`,
        getAuthHeaders()
      );

      const taskRes = await axios.get(
        `${API_BASE}/onboarding-tasks`,
        getAuthHeaders()
      );

      setEmployees(empRes.data || []);
      setDepartments(deptRes.data || []);
      setTasks(taskRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Fetch failed", error);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* ================= ADD TASK ================= */

  const addTask = async () => {
    let newErrors = {
      employeeId: "",
      departmentId: "",
      task: "",
    };

    if (!form.employeeId) newErrors.employeeId = "Employee is required";
    if (!form.departmentId) newErrors.departmentId = "Department is required";
    if (!form.task.trim()) newErrors.task = "Task is required";

    setErrors(newErrors);

    if (Object.values(newErrors).some((e) => e !== "")) return;

    try {
      const res = await axios.post(
        `${API_BASE}/onboarding-tasks`,
        {
          employeeId: form.employeeId,
          departmentId: form.departmentId,
          task: form.task,
        },
        getAuthHeaders(),
      );

      // ✅ SUCCESS ALERT
      toast({
        type: "success",
        title: "Task Assigned",
        message: res.data?.message || "Task has been assigned successfully.",
      });

      setOpen(false);
      setForm({ employeeId: "", departmentId: "", task: "" });
      setErrors({ employeeId: "", departmentId: "", task: "" });
      fetchAll();
    } catch (error: any) {
      // ❌ ERROR ALERT
      toast({
        type: "error",
        title: "Failed",
        message:
          error?.response?.data?.message ||
          "Failed to assign task. Please try again.",
      });

      console.error("Failed to add task", error);
    }
  };


  /* ================= STATUS BADGE ================= */

  const statusBadge = (status: string) => {
    if (status === "COMPLETED") return "success";
    return "secondary";
  };
  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Onboarding Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Assign tasks to IT, Admin, Finance departments
          </p>
        </div>

        <Button onClick={() => setOpen(true)}>+ Assign Task</Button>
      </div>

      {/* TASK TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Tasks</CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Task</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((t) => (
                <tr key={t._id} className="border-t">
                  <td className="p-3">{t.employee?.name}</td>
                  <td className="p-3">{t.department?.name}</td>
                  <td className="p-3">{t.task}</td>
                  <td className="p-3">
                    <Badge variant={statusBadge(t.status)}>{t.status}</Badge>
                  </td>
                </tr>
              ))}

              {tasks.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-4 text-center text-muted-foreground"
                  >
                    No onboarding tasks assigned
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ASSIGN TASK MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Onboarding Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* EMPLOYEE */}
            <div>
              <Label>
                Employee <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => {
                  setForm({ ...form, employeeId: v });
                  setErrors({ ...errors, employeeId: "" });
                }}
              >
                <SelectTrigger
                  className={errors.employeeId ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e._id} value={e._id}>
                      {e.name} ({e.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employeeId && (
                <p className="text-xs text-red-500 mt-1">{errors.employeeId}</p>
              )}
            </div>

            {/* DEPARTMENT */}
            <div>
              <Label>
                Department <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) => {
                  setForm({ ...form, departmentId: v });
                  setErrors({ ...errors, departmentId: "" });
                }}
              >
                <SelectTrigger
                  className={errors.departmentId ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.name}
                      {d.headEmployeeId
                        ? ` (Head: ${d.headEmployeeId.name})`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.departmentId}
                </p>
              )}
            </div>

            {/* TASK */}
            <div>
              <Label>
                Task <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Laptop Allocation"
                value={form.task}
                onChange={(e) => {
                  setForm({ ...form, task: e.target.value });
                  setErrors({ ...errors, task: "" });
                }}
                className={errors.task ? "border-red-500" : ""}
              />
              {errors.task && (
                <p className="text-xs text-red-500 mt-1">{errors.task}</p>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addTask}>Assign</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnboardingTasks;
