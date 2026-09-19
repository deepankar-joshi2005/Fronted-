/** @format */

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "../../Alert/Toast";
import Loader from "../../Loader";

const API_BASE = import.meta.env.VITE_API_URL;

const MODULES = [
    { label: "Payroll", value: "PAYROLL" },
    { label: "Attendance", value: "ATTENDANCE" },
    { label: "Leave Management", value: "LEAVE" },
    { label: "Employee Login", value: "LOGIN" },
    { label: "Other", value: "OTHER" },
];

const PRIORITIES = [
    { label: "Low", value: "LOW" },
    { label: "Medium", value: "MEDIUM" },
    { label: "High", value: "HIGH" },
];

const RaiseEscalation = () => {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        module: "",
        employeeName: "",
        description: "",
        priority: "MEDIUM",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.module || !form.description) {
            toast({
                type: "error",
                title: "Missing Fields",
                message: "Please fill in all required fields.",
            });
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(`${API_BASE}/escalations`, form, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            toast({
                type: "success",
                title: "Escalation Raised",
                message: res.data?.message || "Ticket has been submitted to Super Admin.",
            });

            setForm({
                module: "",
                employeeName: "",
                description: "",
                priority: "MEDIUM",
            });
        } catch (error: any) {
            toast({
                type: "error",
                title: "Submission Failed",
                message: error?.response?.data?.message || "Something went wrong.",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--foreground)]">Raise Escalation</h1>
                    <p className="text-sm text-[var(--muted-foreground)]">Report issues or data mismatches to Super Admin</p>
                </div>
            </div>

            <Card className="shadow-premium-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-medium text-[var(--foreground)]">Issue Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[var(--foreground)]">Select Module *</Label>
                                <Select
                                    value={form.module}
                                    onValueChange={(v) => setForm({ ...form, module: v })}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose module" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MODULES.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[var(--foreground)]">Related Employee Name (Optional)</Label>
                                <Input
                                    placeholder="e.g. Rahul Kumar"
                                    value={form.employeeName}
                                    onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[var(--foreground)]">Priority *</Label>
                                <Select
                                    value={form.priority}
                                    onValueChange={(v) => setForm({ ...form, priority: v })}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRIORITIES.map((p) => (
                                            <SelectItem key={p.value} value={p.value}>
                                                {p.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[var(--foreground)]">Problem Description *</Label>
                            <Textarea
                                placeholder="Explain the issue in detail..."
                                rows={6}
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="resize-none"
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                className="bg-[var(--status-warning)] hover:opacity-90 text-white px-8"
                                disabled={loading}
                            >
                                {loading ? "Submitting..." : "Submit Ticket"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="rounded-lg border p-4 flex gap-3 bg-[color-mix(in_oklab,var(--status-warning)_10%,transparent)] border-[color-mix(in_oklab,var(--status-warning)_25%,transparent)]">
                <div className="w-1.5 h-auto rounded-full bg-[var(--status-warning)]" />
                <p className="text-sm leading-relaxed text-[var(--status-warning)]">
                    <strong>Note:</strong> Super Admin will review your escalation and provide a solution or comments. You can track the status in your dashboard.
                </p>
            </div>
        </div>
    );
};

export default RaiseEscalation;
