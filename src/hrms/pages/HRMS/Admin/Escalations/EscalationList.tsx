/** @format */

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "../../Alert/Toast";
import Loader from "../../Loader";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

interface UserRef {
    _id: string;
    name: string;
    role: string;
    email: string;
}

interface IEscalation {
    _id: string;
    module: string;
    employeeName?: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
    comments?: string;
    raisedBy: UserRef;
    resolvedBy?: UserRef;
    createdAt: string;
}

const EscalationList = () => {
    const [escalations, setEscalations] = useState<IEscalation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<IEscalation | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [resolution, setResolution] = useState({
        status: "",
        comments: "",
    });

    const fetchEscalations = async () => {
        try {
            const res = await axios.get(`${API_BASE}/escalations`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setEscalations(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEscalations();
    }, []);

    const handleUpdateStatus = async () => {
        if (!selectedTicket || !resolution.status) return;

        try {
            setActionLoading(true);
            const res = await axios.patch(
                `${API_BASE}/escalations/${selectedTicket._id}`,
                resolution,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            toast({
                type: "success",
                title: "Status Updated",
                message: res.data?.message || "Ticket has been updated.",
            });

            fetchEscalations();
            setSelectedTicket(null);
            setResolution({ status: "", comments: "" });
        } catch (error: any) {
            toast({
                type: "error",
                title: "Update Failed",
                message: error?.response?.data?.message || "Something went wrong.",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const getPriorityBadge = (p: string) => {
        switch (p) {
            case "HIGH":
                return <Badge className="bg-red-100 text-red-600 border-red-200">High</Badge>;
            case "MEDIUM":
                return <Badge className="bg-orange-100 text-orange-600 border-orange-200">Medium</Badge>;
            default:
                return <Badge className="bg-blue-100 text-blue-600 border-blue-200">Low</Badge>;
        }
    };

    const getStatusBadge = (s: string) => {
        switch (s) {
            case "PENDING":
                return (
                    <Badge variant="outline" className="text-gray-500 border-gray-300 gap-1">
                        <Clock size={12} /> Pending
                    </Badge>
                );
            case "IN_PROGRESS":
                return (
                    <Badge variant="outline" className="text-blue-500 border-blue-300 gap-1">
                        <AlertCircle size={12} /> In Progress
                    </Badge>
                );
            case "RESOLVED":
                return (
                    <Badge variant="outline" className="text-emerald-500 border-emerald-300 gap-1">
                        <CheckCircle2 size={12} /> Resolved
                    </Badge>
                );
            case "REJECTED":
                return (
                    <Badge variant="outline" className="text-red-500 border-red-300 gap-1">
                        <XCircle size={12} /> Rejected
                    </Badge>
                );
            default:
                return <Badge>{s}</Badge>;
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Support Escalations</h1>
                    <p className="text-sm text-gray-500">Manage technical issues raised by HR Admin</p>
                </div>
            </div>

            <Card className="border-none shadow-sm h-[75vh] flex flex-col">
                <CardHeader className="border-b pb-4">
                    <CardTitle className="text-lg font-medium">All Tickets</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-[100px] text-center">Priority</TableHead>
                                <TableHead>Raised By</TableHead>
                                <TableHead>Module</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {escalations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center text-gray-400 italic">
                                        No escalations found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                escalations.map((ticket) => (
                                    <TableRow key={ticket._id} className="hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="text-center">{getPriorityBadge(ticket.priority)}</TableCell>
                                        <TableCell>
                                            <div className="font-medium text-gray-900">{ticket.raisedBy?.name}</div>
                                            <div className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="capitalize">
                                                {ticket.module.toLowerCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedTicket(ticket);
                                                    setResolution({
                                                        status: ticket.status,
                                                        comments: ticket.comments || "",
                                                    });
                                                }}
                                            >
                                                Action
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* DETAIL DIALOG */}
            <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden flex flex-col max-h-[90vh]">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                            Ticket Details
                            <span className="text-gray-400 font-normal text-sm">#{selectedTicket?._id.slice(-6).toUpperCase()}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-gray-200">
                        {selectedTicket && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Raised By</p>
                                        <p className="font-semibold text-gray-900 mt-1 text-base">{selectedTicket.raisedBy?.name}</p>
                                        <p className="text-xs text-gray-500">{selectedTicket.raisedBy?.email}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Module / Category</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <Badge variant="secondary" className="capitalize px-3 py-1">
                                                {selectedTicket.module.toLowerCase()}
                                            </Badge>
                                            {getPriorityBadge(selectedTicket.priority)}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="uppercase text-[10px] text-gray-400 font-bold tracking-wider">Issue Description</Label>
                                    <div className="p-5 bg-orange-50/40 border border-orange-100 rounded-2xl text-sm text-gray-800 italic leading-relaxed shadow-sm">
                                        "{selectedTicket.description}"
                                    </div>
                                </div>

                                {selectedTicket.employeeName && (
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        <p className="text-blue-800 text-sm font-medium">
                                            Related Employee: <span className="font-bold">{selectedTicket.employeeName}</span>
                                        </p>
                                    </div>
                                )}

                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="w-full border-t border-gray-100"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white px-3 text-xs font-bold uppercase text-gray-400 tracking-widest">Resolution Actions</span>
                                    </div>
                                </div>

                                <div className="space-y-5 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                    <div className="space-y-3">
                                        <Label className="font-semibold text-gray-700">Update Status</Label>
                                        <Select
                                            value={resolution.status}
                                            onValueChange={(v) => setResolution({ ...resolution, status: v })}
                                        >
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PENDING">Pending</SelectItem>
                                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                                <SelectItem value="REJECTED">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="font-semibold text-gray-700">Official Comments / Remarks</Label>
                                        <Textarea
                                            placeholder="Enter detailed resolution notes or next steps..."
                                            rows={5}
                                            value={resolution.comments}
                                            onChange={(e) => setResolution({ ...resolution, comments: e.target.value })}
                                            className="bg-white resize-none border-gray-200 focus:border-orange-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-gray-50/30 flex items-center justify-between sm:justify-between">
                        <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="text-gray-500">
                            Cancel
                        </Button>
                        <Button
                            className="bg-orange-600 hover:bg-orange-700 text-white px-10 shadow-lg shadow-orange-200"
                            onClick={handleUpdateStatus}
                            disabled={actionLoading}
                        >
                            {actionLoading ? "Saving Changes..." : "Update Ticket"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EscalationList;
