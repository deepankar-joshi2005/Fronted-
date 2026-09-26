/** @format */
/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Loader2 } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import Loader from "../Loader";
import { toast } from "../Alert/Toast";
const API_BASE = import.meta.env.VITE_API_URL;

/* ================= TYPES ================= */

interface User {
    _id: string;
    name: string;
    role: string;
}

interface ShiftAssignment {
    _id?: string;
    userId: string;
    date: string;
    shift: "MORNING" | "EVENING" | "NIGHT";
}

/* ================= HELPERS ================= */

const getMondayOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

const formatDate = (d: Date) => d.toISOString().split("T")[0];

/* ================= COMPONENT ================= */

const ShiftRoster = () => {
    const today = new Date();

    const [users, setUsers] = useState<User[]>([]);
    const [shifts, setShifts] = useState<ShiftAssignment[]>([]);

    const [weekStart] = useState(getMondayOfWeek(today));

    const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    /* 🔹 PAGINATION STATES */
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 15;

    const [form, setForm] = useState<{
        userIds: string[];
        date: string;
        shift: "MORNING" | "EVENING" | "NIGHT";
    }>({
        userIds: [],
        date: formatDate(today),
        shift: "MORNING",
    });

    /* ================= FETCH USERS (PAGINATED) ================= */

    useEffect(() => {
        axios
            .get(`${API_BASE}/users`, {
                params: { page, limit: LIMIT },
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            })
            .then((res) => {
                const list: User[] = res.data.data || [];
                setUsers(list.filter((u) => u.role?.toLowerCase() !== "superadmin"));
                if (res.data.totalPages) setTotalPages(res.data.totalPages);
            });
    }, [page]);

    /* ================= FETCH SHIFTS (PAGINATED) ================= */

    useEffect(() => {
        axios
            .get(`${API_BASE}/shifts/week`, {
                params: {
                    start: formatDate(weekStart),
                    page,
                    limit: LIMIT,
                },
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            })
            .then((res) => {
                setShifts(res.data.shifts || []);
                setLoading(false);
            })
            .catch(() => setShifts([]));
    }, [weekStart, page]);

    /* ================= WEEK DAYS ================= */

    const weekDays = useMemo(() => {
        return Array.from({ length: 6 }).map((_, i) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            return d;
        });
    }, [weekStart]);

    /* ================= MODAL ================= */

    const openAssignModal = (date?: string, userId?: string) => {
        setEditingShiftId(null);
        setForm({
            userIds: userId ? [userId] : [],
            date: date || formatDate(today),
            shift: "MORNING",
        });
        setOpen(true);
    };

    /* ================= SUBMIT ================= */

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            if (editingShiftId) {
                // ✅ UPDATE SHIFT
                const res = await axios.put(
                    `${API_BASE}/shifts/${editingShiftId}`,
                    {
                        date: form.date,
                        shift: form.shift,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    },
                );

                toast({
                    type: "success",
                    title: "Shift Updated",
                    message: res.data?.message || "Shift has been updated successfully.",
                });
            } else {
                // ✅ ASSIGN SHIFT (BULK)
                const res = await axios.post(
                    `${API_BASE}/shifts/bulk`,
                    {
                        userIds: form.userIds,
                        date: form.date,
                        shift: form.shift,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    },
                );

                toast({
                    type: "success",
                    title: "Shift Assigned",
                    message: res.data?.message || "Shift has been assigned successfully.",
                });
            }

            setOpen(false);

            // 🔄 REFRESH WEEK SHIFTS
            const res = await axios.get(`${API_BASE}/shifts/week`, {
                params: {
                    start: formatDate(weekStart),
                    page,
                    limit: LIMIT,
                },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            setShifts(res.data.shifts || []);
        } catch (error: any) {
            toast({
                type: "error",
                title: "Action Failed",
                message:
                    error?.response?.data?.message ||
                    "Failed to save shift. Please try again.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!editingShiftId) return;

        setDeleting(true);
        try {
            const res = await axios.delete(`${API_BASE}/shifts/${editingShiftId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            toast({
                type: "success",
                title: "Shift Deleted",
                message: res.data?.message || "Shift has been deleted successfully.",
            });

            setOpen(false);

            // 🔄 REFRESH WEEK SHIFTS
            const refreshRes = await axios.get(`${API_BASE}/shifts/week`, {
                params: {
                    start: formatDate(weekStart),
                    page,
                    limit: LIMIT,
                },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            setShifts(refreshRes.data.shifts || []);
        } catch (error: any) {
            toast({
                type: "error",
                title: "Delete Failed",
                message:
                    error?.response?.data?.message ||
                    "Failed to delete shift. Please try again.",
            });
        } finally {
            setDeleting(false);
        }
    };


    const getShiftForCell = (userId: string, date: string) =>
        shifts.find((s) => s.userId === userId && s.date === date);

    /* ================= RENDER ================= */

    if (loading) {
        return (
            <div className="p-10 flex justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold">Shift Roster</h1>
                    <p className="text-sm text-gray-500">
                        Dashboard / Employees / Shift Scheduling
                    </p>
                </div>

                <Button
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => openAssignModal()}
                >
                    Assign Shift
                </Button>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto bg-white rounded-lg border">
                <table className="min-w-max w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left">Employee</th>
                            {weekDays.map((d) => (
                                <th key={d.toISOString()} className="px-4 py-3 text-center">
                                    {d.toLocaleDateString("en-US", { weekday: "short" })}{" "}
                                    {d.getDate()}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {users.map((u) => (
                            <tr key={u._id} className="border-t">
                                <td className="px-4 py-4 font-medium">
                                    {u.name}{" "}
                                    <span className="text-xs text-gray-500">({u.role})</span>
                                </td>

                                {weekDays.map((d) => {
                                    const dateStr = formatDate(d);
                                    const shift = getShiftForCell(u._id, dateStr);

                                    return (
                                        <td key={dateStr} className="text-center py-3">
                                            {shift ? (
                                                <button
                                                    onClick={() => {
                                                        setEditingShiftId(shift._id!);
                                                        setForm({
                                                            userIds: [u._id],
                                                            date: shift.date,
                                                            shift: shift.shift,
                                                        });
                                                        setOpen(true);
                                                    }}
                                                    className="mx-auto w-24 py-2 border-2 border-dashed border-green-500 rounded 
                          text-green-600 font-medium hover:bg-green-50"
                                                >
                                                    {shift.shift}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => openAssignModal(dateStr, u._id)}
                                                    className="mx-auto w-10 h-10 border border-dashed border-gray-300 
                          rounded flex items-center justify-center 
                          text-gray-400 hover:text-orange-500 
                          hover:border-orange-400 hover:bg-orange-50"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`px-3 py-1 rounded border ${page === i + 1 ? "bg-orange-500 text-white" : "bg-white"
                            }`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Assign Shift</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* EMPLOYEE MULTI SELECT */}
                        <Popover>
                            <label className="text-sm font-medium text-gray-700">
                                Employee(s)
                            </label>
                            <PopoverTrigger asChild>
                                <div className="min-h-[42px] w-full border rounded-md px-3 py-2 flex flex-wrap gap-2 cursor-pointer">
                                    {form.userIds.length === 0 && (
                                        <span className="text-sm text-gray-400">
                                            Select employees
                                        </span>
                                    )}

                                    {form.userIds.map((id) => {
                                        const user = users.find((u) => u._id === id);
                                        if (!user) return null;

                                        return (
                                            <span
                                                key={id}
                                                className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs"
                                            >
                                                {user.name}
                                                <X
                                                    size={12}
                                                    className="cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            userIds: prev.userIds.filter((uid) => uid !== id),
                                                        }));
                                                    }}
                                                />
                                            </span>
                                        );
                                    })}
                                </div>
                            </PopoverTrigger>

                            <PopoverContent className="p-0 w-[300px]" align="start">
                                <div className="max-h-64 overflow-y-auto">
                                    {users.map((u) => {
                                        const selected = form.userIds.includes(u._id);

                                        return (
                                            <div
                                                key={u._id}
                                                onClick={() =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        userIds: selected
                                                            ? prev.userIds.filter((id) => id !== u._id)
                                                            : [...prev.userIds, u._id],
                                                    }))
                                                }
                                                className={`px-3 py-2 cursor-pointer flex justify-between items-center 
          hover:bg-gray-100 ${selected ? "bg-orange-50" : ""}`}
                                            >
                                                <span>{u.name}</span>
                                                {selected && (
                                                    <span className="text-orange-500 font-semibold">
                                                        ✓
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </PopoverContent>
                        </Popover>
                        <label className="text-sm font-medium text-gray-700">Date</label>
                        {/* DATE */}
                        <Input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                        />
                        <label className="text-sm font-medium text-gray-700">Shifts</label>
                        {/* SHIFT */}
                        <select
                            className="w-full border rounded-md px-3 py-2"
                            value={form.shift}
                            onChange={(e: any) => setForm({ ...form, shift: e.target.value })}
                        >
                            <option value="MORNING">Morning</option>
                            <option value="EVENING">Evening</option>
                            <option value="NIGHT">Night</option>
                        </select>

                        {/* ACTIONS */}
                        <div className="flex justify-end gap-3 pt-4">
                            {editingShiftId && (
                                <Button
                                    variant="destructive"
                                    className="bg-red-500 hover:bg-red-600 mr-auto"
                                    onClick={handleDelete}
                                    disabled={deleting || submitting}
                                >
                                    {deleting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        "Delete Shift"
                                    )}
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting || deleting}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-orange-500 hover:bg-orange-600"
                                onClick={handleSubmit}
                                disabled={submitting || deleting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {editingShiftId ? "Updating..." : "Assigning..."}
                                    </>
                                ) : editingShiftId ? (
                                    "Update Shift"
                                ) : (
                                    "Assign Shift"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ShiftRoster;
