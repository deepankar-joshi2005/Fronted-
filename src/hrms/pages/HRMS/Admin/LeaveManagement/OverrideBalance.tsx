/** @format */

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "../../Alert/Toast";
import Loader from "../../Loader";
import { cn } from "@/lib/utils";
import { History, Save, UserCog } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

interface UserRef {
    _id: string;
    name: string;
    employeeId: string;
    role?: string;
}

interface IAdjustment {
    _id: string;
    employee: UserRef;
    leaveType: string;
    oldBalance: number;
    newBalance: number;
    adjustment: number;
    reason: string;
    addedBy: UserRef;
    createdAt: string;
}

const OverrideBalance = () => {
    const [employees, setEmployees] = useState<UserRef[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [history, setHistory] = useState<IAdjustment[]>([]);

    const [form, setForm] = useState({
        employeeId: "",
        leaveType: "",
        currentBalance: 0,
        newBalance: "",
        reason: "",
    });

    const fetchInitialData = async () => {
        try {
            const [empRes, typeRes, histRes] = await Promise.all([
                axios.get(`${API_BASE}/users`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                }),
                axios.get(`${API_BASE}/leave-types`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                }),
                axios.get(`${API_BASE}/leave-balance-adjustments/history`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                }),
            ]);
            setEmployees(empRes.data.users || empRes.data);
            setLeaveTypes(typeRes.data);
            setHistory(histRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Fetch current balance when employee or leave type changes
    useEffect(() => {
        const fetchBalance = async () => {
            if (form.employeeId && form.leaveType) {
                try {
                    const res = await axios.get(
                        `${API_BASE}/leave-balance-adjustments/current?employeeId=${form.employeeId}&leaveType=${form.leaveType}`,
                        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                    );
                    setForm((prev) => ({ ...prev, currentBalance: res.data.balance }));
                } catch (err) {
                    console.error(err);
                }
            }
        };
        fetchBalance();
    }, [form.employeeId, form.leaveType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.employeeId || !form.leaveType || !form.newBalance || !form.reason) {
            toast({
                type: "error",
                title: "Missing Fields",
                message: "Please fill in all mandatory fields.",
            });
            return;
        }

        try {
            setActionLoading(true);
            const res = await axios.post(
                `${API_BASE}/leave-balance-adjustments/override`,
                {
                    employeeId: form.employeeId,
                    leaveType: form.leaveType,
                    newBalance: Number(form.newBalance),
                    reason: form.reason,
                },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            toast({
                type: "success",
                title: "Balance Overridden",
                message: res.data?.message || "Employee leave balance has been manually updated.",
            });

            // Reset form and refresh history
            setForm({ ...form, newBalance: "", reason: "", currentBalance: Number(form.newBalance) });
            const histRes = await axios.get(`${API_BASE}/leave-balance-adjustments/history`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setHistory(histRes.data);
        } catch (error: any) {
            toast({
                type: "error",
                title: "Override Failed",
                message: error?.response?.data?.message || "Something went wrong.",
            });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="relative min-h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                        Override Leave Balance
                    </h1>
                    <p className="text-sm text-[var(--muted-foreground)]">
                        Leave Management <span className="mx-1">›</span> Override Balance
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                {/* FORM SECTION */}
                <Card className="lg:col-span-1 card-premium shadow-premium-sm h-fit">
                    <CardHeader className="pb-4 border-b border-[var(--border)]">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[var(--foreground)]">
                            <UserCog className="h-5 w-5 text-[var(--primary)]" />
                            Adjustment Form
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label>Select Employee *</Label>
                                <Select
                                    value={form.employeeId}
                                    onValueChange={(v) => setForm({ ...form, employeeId: v })}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map((emp) => (
                                            <SelectItem key={emp._id} value={emp._id}>
                                                {emp.name} ({emp.employeeId})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Leave Type *</Label>
                                <Select
                                    value={form.leaveType}
                                    onValueChange={(v) => setForm({ ...form, leaveType: v })}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose leave type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leaveTypes.map((type) => (
                                            <SelectItem key={type._id} value={type.name}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {form.employeeId && form.leaveType && (
                                <div className="p-4 rounded-xl space-y-1 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] border border-[color-mix(in_oklab,var(--primary)_20%,transparent)]">
                                    <p className="text-[10px] uppercase font-bold text-[var(--primary)] tracking-wider">Current System Balance</p>
                                    <p className="text-2xl font-black text-[var(--foreground)]">{form.currentBalance} Days</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>New Manual Balance *</Label>
                                <Input
                                    type="number"
                                    placeholder="Enter target balance days"
                                    value={form.newBalance}
                                    onChange={(e) => setForm({ ...form, newBalance: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Reason for Override *</Label>
                                <Textarea
                                    placeholder="e.g. Data correction from legacy system or special approval"
                                    rows={4}
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    className="resize-none"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] text-white gap-2 shadow-premium-sm hover:opacity-90 transition-opacity"
                                disabled={actionLoading}
                            >
                                {actionLoading ? "Processing..." : <><Save className="h-4 w-4" /> Save Override</>}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* HISTORY SECTION */}
                <Card className="lg:col-span-2 card-premium shadow-premium-sm overflow-hidden flex flex-col h-[700px]">
                    <CardHeader className="pb-4 border-b border-[var(--border)]">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[var(--foreground)]">
                            <History className="h-5 w-5 text-[var(--muted-foreground)]" />
                            Adjustment Logs (Audit)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Employee</TableHead>
                                    <TableHead className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Leave Type</TableHead>
                                    <TableHead className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] text-center">Old → New</TableHead>
                                    <TableHead className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] text-center">Adjustment</TableHead>
                                    <TableHead className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Reason</TableHead>
                                    <TableHead className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">By (Admin)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-[var(--border)]">
                                {history.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center text-[var(--muted-foreground)] italic">
                                            No override logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    history.map((log) => (
                                        <TableRow key={log._id} className="hover:bg-[var(--muted)] transition-colors">
                                            <TableCell className="px-3 py-2.5">
                                                <div className="font-medium text-[var(--foreground)]">{log.employee?.name}</div>
                                                <div className="text-xs text-[var(--muted-foreground)]">{new Date(log.createdAt).toLocaleDateString()}</div>
                                            </TableCell>
                                            <TableCell className="px-3 py-2.5">
                                                <span className="inline-flex items-center rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs font-medium capitalize text-[var(--foreground)]">
                                                    {log.leaveType.toLowerCase()}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-3 py-2.5 text-center font-mono text-sm text-[var(--foreground)]">
                                                {log.oldBalance} → <span className="font-bold text-[var(--primary)]">{log.newBalance}</span>
                                            </TableCell>
                                            <TableCell className="px-3 py-2.5 text-center">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                                        log.adjustment > 0
                                                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                                                            : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                                                    )}
                                                >
                                                    {log.adjustment > 0 ? "+" : ""}{log.adjustment}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-3 py-2.5 max-w-[150px] truncate text-xs italic text-[var(--muted-foreground)]">
                                                {log.reason}
                                            </TableCell>
                                            <TableCell className="px-3 py-2.5">
                                                <div className="text-sm font-medium text-[var(--foreground)]">{log.addedBy?.name}</div>
                                                <div className="text-[10px] text-[var(--muted-foreground)] uppercase">{log.addedBy?.role}</div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default OverrideBalance;
