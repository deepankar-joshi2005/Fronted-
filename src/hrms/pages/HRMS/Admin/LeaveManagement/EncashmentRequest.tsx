/** @format */

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";

const API_BASE = import.meta.env.VITE_API_URL;

interface User {
    _id: string;
    name: string;
    employeeId: string;
}

interface LeaveEncashment {
    _id: string;
    employee: User;
    leaveType: string;
    requestedDays: number;
    perDayRate: number;
    totalAmount: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    paymentStatus?: "UNPAID" | "PAID";
    requestDate: string;
    payrollMonth?: string;
}

const EncashmentRequest = () => {
    const token = localStorage.getItem("token");

    const [requests, setRequests] = useState<LeaveEncashment[]>([]);
    const [selected, setSelected] = useState<LeaveEncashment | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    /* ================= FETCH ALL ENCASHMENT REQUESTS ================= */
    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/leave-encashment`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRequests(res.data || []);
        } catch (err) {
            console.error("Failed to fetch requests");
            toast({
                type: "error",
                title: "Fetch Failed",
                message: "Unable to load leave encashment requests.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    /* ================= STATUS UPDATE ================= */
    const handleStatusChange = async (id: string, status: "APPROVED" | "REJECTED") => {
        try {
            setActionLoading(true);

            const res = await axios.put(
                `${API_BASE}/leave-encashment/${id}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast({
                type: "success",
                title: status === "APPROVED" ? "Request Approved" : "Request Rejected",
                message: res.data?.message || `Request has been ${status.toLowerCase()} successfully.`,
            });

            fetchRequests();
        } catch (error: any) {
            toast({
                type: "error",
                title: "Action Failed",
                message: error?.response?.data?.message || "Something went wrong. Please try again.",
            });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="p-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Leave Encashment Requests</h1>
                            <p className="text-sm text-[var(--muted-foreground)] mt-1">Review and manage employee leave encashment requests</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Leave Type</TableHead>
                                <TableHead>Days</TableHead>
                                <TableHead>Total Amount</TableHead>
                                <TableHead>Request Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {requests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-20 text-[var(--muted-foreground)]">
                                        No leave encashment requests found
                                    </TableCell>
                                </TableRow>
                            )}

                            {requests.map((req) => (
                                <TableRow key={req._id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-[var(--primary)]">{req.employee?.name}</span>
                                            <span className="text-xs text-[var(--muted-foreground)]">{req.employee?.employeeId}</span>
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-[var(--foreground)]">{req.leaveType}</TableCell>
                                    <TableCell className="text-[var(--foreground)]">{req.requestedDays} days</TableCell>
                                    <TableCell className="font-semibold text-[var(--foreground)]">₹{req.totalAmount}</TableCell>
                                    <TableCell className="text-[var(--foreground)]">{new Date(req.requestDate).toLocaleDateString("en-GB")}</TableCell>

                                    <TableCell>
                                        {req.status === "PENDING" ? (
                                            <select
                                                className="px-3 py-1 rounded text-sm font-medium
                          bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)] border border-[color-mix(in_oklab,var(--status-warning)_30%,transparent)]
                          focus:outline-none cursor-pointer hover:bg-[color-mix(in_oklab,var(--status-warning)_22%,transparent)] transition-colors"
                                                disabled={actionLoading}
                                                defaultValue="PENDING"
                                                onChange={(e) =>
                                                    handleStatusChange(
                                                        req._id,
                                                        e.target.value as "APPROVED" | "REJECTED",
                                                    )
                                                }
                                            >
                                                <option value="PENDING" disabled>
                                                    PENDING
                                                </option>
                                                <option value="APPROVED">APPROVE</option>
                                                <option value="REJECTED">REJECT</option>
                                            </select>
                                        ) : (
                                            <Badge
                                                className={
                                                    req.status === "APPROVED"
                                                        ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)] hover:bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)]"
                                                        : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)] hover:bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)]"
                                                }
                                            >
                                                {req.status}
                                            </Badge>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        {req.status === "APPROVED" ? (
                                            <Badge
                                                className={
                                                    req.paymentStatus === "PAID"
                                                        ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)] hover:bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)]"
                                                        : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)] hover:bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)]"
                                                }
                                            >
                                                {req.paymentStatus === "PAID" ? "PAID" : "UNPAID"}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-[var(--muted-foreground)]">—</span>
                                        )}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]"
                                            onClick={() => setSelected(req)}
                                        >
                                            <Eye size={18} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ================= VIEW DIALOG ================= */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold border-b border-[var(--border)] pb-2 text-[var(--foreground)]">Encashment Details</DialogTitle>
                    </DialogHeader>

                    {selected && (
                        <div className="space-y-4 pt-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[var(--muted-foreground)] uppercase font-bold tracking-wider">Employee</label>
                                    <p className="font-semibold text-[var(--foreground)]">{selected.employee.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--muted-foreground)] uppercase font-bold tracking-wider">Employee ID</label>
                                    <p className="text-[var(--foreground)]">{selected.employee.employeeId}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--muted-foreground)] uppercase font-bold tracking-wider">Leave Type</label>
                                    <p className="text-[var(--foreground)]">{selected.leaveType}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--muted-foreground)] uppercase font-bold tracking-wider">Requested Days</label>
                                    <p className="text-[var(--foreground)]">{selected.requestedDays} Days</p>
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--muted-foreground)] uppercase font-bold tracking-wider">Per Day Rate</label>
                                    <p className="text-[var(--foreground)]">₹{selected.perDayRate}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--muted-foreground)] uppercase font-bold tracking-wider">Total Amount</label>
                                    <p className="font-bold text-lg text-[var(--status-good)]">₹{selected.totalAmount}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--muted-foreground)] uppercase font-bold tracking-wider">Request Date</label>
                                    <p className="text-[var(--foreground)]">{new Date(selected.requestDate).toLocaleDateString("en-GB")}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--muted-foreground)] uppercase font-bold tracking-wider">Payroll Month</label>
                                    <p className="text-[var(--primary)] font-medium">
                                        {selected.payrollMonth ? (
                                            new Date(selected.payrollMonth + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" })
                                        ) : (
                                            "Not yet assigned"
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[var(--border)]">
                                <label className="text-xs text-[var(--muted-foreground)] uppercase font-bold tracking-wider">Status</label>
                                <div className="mt-1">
                                    <Badge
                                        className={
                                            selected.status === "APPROVED"
                                                ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)] border-[color-mix(in_oklab,var(--status-good)_30%,transparent)]"
                                                : selected.status === "REJECTED"
                                                    ? "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)] border-[color-mix(in_oklab,var(--status-critical)_30%,transparent)]"
                                                    : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)] border-[color-mix(in_oklab,var(--status-warning)_30%,transparent)]"
                                        }
                                    >
                                        {selected.status}
                                    </Badge>
                                </div>
                            </div>

                            {selected.status === "APPROVED" && (
                                <div className="pt-2">
                                    <label className="text-xs text-[var(--muted-foreground)] uppercase font-bold tracking-wider">Payment Status</label>
                                    <div className="mt-1">
                                        <Badge
                                            className={
                                                selected.paymentStatus === "PAID"
                                                    ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)] border-[color-mix(in_oklab,var(--status-good)_30%,transparent)]"
                                                    : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)] border-[color-mix(in_oklab,var(--status-warning)_30%,transparent)]"
                                            }
                                        >
                                            {selected.paymentStatus === "PAID" ? "PAID" : "UNPAID"}
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-6">
                                <Button onClick={() => setSelected(null)} variant="secondary" className="px-8">
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EncashmentRequest;
