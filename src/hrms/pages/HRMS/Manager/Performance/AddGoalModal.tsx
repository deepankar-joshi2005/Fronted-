/** @format */

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Target } from "lucide-react";
import { toast } from "../../Alert/Toast";
const API_BASE = import.meta.env.VITE_API_URL;

interface User {
  _id: string;
  name: string;
  employeeId: string;
  role?: string;
  managerId: {
    _id: string;
    name?: string;
  };
}

interface Goal {
  _id: string;
  title: string;
  description: string;
  assignedTo?: {
    _id: string;
    name: string;
    employeeId: string;
  };
  deadline?:string;
}

export default function AddGoalModal({
  open,
  onClose,
  onSuccess,
  editGoal,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editGoal: Goal | null;
}) {
  const token = localStorage.getItem("token");
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
  const loggedInManagerId = loggedInUser?.id;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    deadline:"",
  });

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  /* ================= PREFILL FOR EDIT ================= */
  useEffect(() => {
    if (editGoal) {
      setForm({
        title: editGoal.title,
        description: editGoal.description || "",
        assignedTo: editGoal.assignedTo?._id || "",
        deadline: formatDateForInput(editGoal.deadline),
      });
    } else {
      setForm({ title: "", description: "", assignedTo: "",deadline:"" });
    }
  }, [editGoal, open]);

  /* ================= FETCH USERS ================= */
  useEffect(() => {
    if (open) fetchUsers();
  }, [open]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const filtered = res.data.filter(
        (u: User) =>
          u.managerId?._id === loggedInManagerId &&
          u.role?.toLowerCase() !== "superadmin"
      );
  

      setUsers(filtered);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  /* ================= SUBMIT ================= */
const handleSubmit = async () => {
  if (!form.title || !form.assignedTo) {
    toast({
      type: "error",
      title: "Validation Error",
      message: "Title & Assigned User are required",
    });
    return;
  }

  try {
    setLoading(true);
    let res;

    if (editGoal) {
      // 🔁 UPDATE
      res = await axios.put(
        `${API_BASE}/goals/${editGoal._id}`,
        {
          title: form.title,
          description: form.description,
          assignedTo: form.assignedTo,
          deadline: form.deadline,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast({
        type: "success",
        title: "Goal Updated",
        message: res.data?.message || "Goal updated successfully.",
      });
    } else {
      // ➕ ADD
      res = await axios.post(
        `${API_BASE}/goals`,
        {
          title: form.title,
          description: form.description,
          assignedTo: form.assignedTo,
          progress: 0,
          deadline: form.deadline,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast({
        type: "success",
        title: "Goal Created",
        message: res.data?.message || "Goal created successfully.",
      });
    }

    onSuccess();
    onClose();
  } catch (error: any) {
    toast({
      type: "error",
      title: "Save Failed",
      message:
        error?.response?.data?.message ||
        "Failed to save goal. Please try again.",
    });
  } finally {
    setLoading(false);
  }
};


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl p-0 max-w-md overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-[var(--border)] bg-[var(--muted)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl">
              <Target size={18} />
            </div>
            <DialogTitle className="text-lg font-bold text-[var(--foreground)]">
              {editGoal ? "Edit Goal" : "Add Goal"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 p-6 pt-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide">Goal Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="rounded-xl focus-visible:ring-[var(--primary)]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="rounded-xl focus-visible:ring-[var(--primary)]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide">Assign To *</Label>
            <select
              className="w-full border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            >
              <option value="">Select User</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.employeeId})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide">Deadline *</Label>
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="rounded-xl focus-visible:ring-[var(--primary)]"
            />
          </div>

          <Button
            className="w-full rounded-xl bg-[var(--primary)] hover:opacity-90 font-bold h-11 shadow-sm"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : editGoal ? "Update Goal" : "Save Goal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
