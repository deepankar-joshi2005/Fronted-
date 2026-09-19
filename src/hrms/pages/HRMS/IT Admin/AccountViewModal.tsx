/** @format */

import axios from "axios";
import { useState } from "react";
import { X } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

export interface UserType {
  _id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "HR" | "MANAGER" | "ADMIN";
  department: string;
  departmentId: { _id: string; name: string };
  designation: string;
  status: "ACTIVE" | "LOCKED" | "DISABLED";
  createdAt: string;
}

interface Props {
  user: UserType;
  mode: "view" | "edit";
  onClose: () => void;
  onUpdated: () => void;
}


export default function AccountViewModal({ user, mode, onClose, onUpdated }: Props) {
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [department, setDepartment] = useState(user.departmentId?.name);
  const [status, setStatus] = useState(user.status);

  const handleUpdate = async () => {
    await axios.patch(
      `${API}/users/${user._id}`,
      { email, role, department, status },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    onUpdated();
    onClose();
  };

  const disabledFieldClasses =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 text-sm text-[var(--muted-foreground)] outline-none";
  const fieldClasses =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)] disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-premium-lg">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {mode === "view" ? "User Details" : "Edit User"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="space-y-4 p-6 text-sm">
          <div>
            <label className="mb-1 block font-medium text-[var(--foreground)]">Name</label>
            <input disabled value={user.name} className={disabledFieldClasses} />
          </div>

          <div>
            <label className="mb-1 block font-medium text-[var(--foreground)]">Email</label>
            <input
              disabled={mode === "view"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClasses}
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-[var(--foreground)]">Role</label>
            <select
              disabled={mode === "view"}
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className={fieldClasses}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-medium text-[var(--foreground)]">Department</label>
            <input
              disabled={mode === "view"}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={fieldClasses}
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-[var(--foreground)]">Account Status</label>
            <select
              disabled={mode === "view"}
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className={fieldClasses}
            >
              <option value="ACTIVE">Active</option>
              <option value="LOCKED">Locked</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            Close
          </button>

          {mode === "edit" && (
            <button
              onClick={handleUpdate}
              className="rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
            >
              Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
