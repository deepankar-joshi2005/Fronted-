import { useState, useEffect } from "react";
import axios from "axios";
import {
    AlertTriangle,
    ShieldAlert,
    Trash2,
    Database,
    Info,
    ShieldCheck,
    Building2,
    MapPin,
    Layers,
    BadgeCheck,
    Wallet,
    FileText,
    CalendarDays,
    IndianRupee,
    Percent,
    Users,
    FileStack,
    Mail,
    Clock,
    Leaf,
    Receipt,
    FileBarChart,
    Monitor,
    Laptop,
    Package,
    Briefcase,
    UserPlus,
    ClipboardCheck,
    LogOut,
    History,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

const MODULE_STYLE: Record<string, { icon: React.ElementType; color: string }> = {
    Companies: { icon: Building2, color: "var(--cat-1)" },
    Branches: { icon: MapPin, color: "var(--cat-2)" },
    Departments: { icon: Layers, color: "var(--primary)" },
    Designations: { icon: BadgeCheck, color: "var(--cat-3)" },
    Roles: { icon: ShieldCheck, color: "var(--cat-3)" },
    "Cost Centers": { icon: Wallet, color: "var(--status-warning)" },
    Policies: { icon: FileText, color: "var(--cat-other)" },
    Holidays: { icon: CalendarDays, color: "var(--status-warning)" },
    "Salary Structures": { icon: IndianRupee, color: "var(--status-good)" },
    "Tax Slabs": { icon: Percent, color: "var(--cat-2)" },
    Employees: { icon: Users, color: "var(--status-good)" },
    Documents: { icon: FileStack, color: "var(--cat-other)" },
    Letters: { icon: Mail, color: "var(--primary)" },
    Attendance: { icon: Clock, color: "var(--status-good)" },
    Leaves: { icon: Leaf, color: "var(--status-good)" },
    Payroll: { icon: IndianRupee, color: "var(--cat-3)" },
    Payslips: { icon: Receipt, color: "var(--cat-3)" },
    "Statutory Data": { icon: FileBarChart, color: "var(--status-critical)" },
    Workstations: { icon: Monitor, color: "var(--cat-2)" },
    "IT Assets": { icon: Laptop, color: "var(--cat-2)" },
    "Non-IT Assets": { icon: Package, color: "var(--status-warning)" },
    "Job Openings": { icon: Briefcase, color: "var(--cat-3)" },
    Candidates: { icon: UserPlus, color: "var(--status-warning)" },
    "Onboarding Tasks": { icon: ClipboardCheck, color: "var(--status-good)" },
    Resignations: { icon: LogOut, color: "var(--status-critical)" },
    Clearance: { icon: ShieldCheck, color: "var(--status-warning)" },
    "Audit Logs": { icon: History, color: "var(--cat-3)" },
};

const moduleStyle = (mod: string) => MODULE_STYLE[mod] || { icon: FileText, color: "var(--cat-other)" };

export default function HardDelete() {
    const [modules, setModules] = useState<string[]>([]);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [confirmationText, setConfirmationText] = useState("");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_BASE}/data-management/modules`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const sorted = Array.isArray(res.data) ? res.data.sort() : [];
            setModules(sorted);
        } catch (error) {
            console.error("Failed to fetch modules:", error);
            toast.error("Failed to load available modules.");
        }
    };

    const toggleModule = (moduleName: string) => {
        setSelectedModules((prev) =>
            prev.includes(moduleName) ? prev.filter((m) => m !== moduleName) : [...prev, moduleName]
        );
    };

    const toggleSelectAll = () => {
        setSelectedModules(selectedModules.length === modules.length ? [] : [...modules]);
    };

    const handleDelete = async () => {
        if (confirmationText !== "DELETE") {
            toast.error("Please type DELETE to confirm.");
            return;
        }
        if (selectedModules.length === 0) {
            toast.error("Please select at least one module.");
            return;
        }

        try {
            setDeleting(true);
            const token = localStorage.getItem("token");
            await axios.delete(`${API_BASE}/data-management/hard-delete`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { moduleNames: selectedModules, confirmation: confirmationText },
            });

            toast.success(`Successfully deleted data from ${selectedModules.length} modules.`);
            setSelectedModules([]);
            setConfirmationText("");
        } catch (error: any) {
            console.error("Delete failed:", error);
            toast.error(error.response?.data?.message || "Failed to delete data.");
        } finally {
            setDeleting(false);
        }
    };

    const allSelected = modules.length > 0 && selectedModules.length === modules.length;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
            {/* HEADER */}
            <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--status-critical)] flex items-center gap-2.5">
                    <ShieldAlert className="h-7 w-7 sm:h-8 sm:w-8" />
                    Compliance Hard Delete
                </h1>
                <p className="text-sm text-[var(--muted-foreground)]">
                    Permanently remove all data from selected modules. This action is irreversible.
                </p>
            </div>

            {/* BANNER */}
            <div
                className="relative overflow-hidden rounded-2xl border p-5 sm:p-6 flex items-center justify-between gap-4"
                style={{
                    borderColor: "color-mix(in oklab, var(--status-critical) 30%, transparent)",
                    background:
                        "linear-gradient(120deg, color-mix(in oklab, var(--status-critical) 14%, var(--card)), color-mix(in oklab, var(--cat-3) 10%, var(--card)))",
                }}
            >
                <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--status-critical)] shadow-premium-sm">
                        <Trash2 className="h-6 w-6 text-white" />
                    </span>
                    <div>
                        <p className="font-bold text-[var(--status-critical)]">Bulk Data Deletion</p>
                        <p className="text-sm text-[var(--muted-foreground)] mt-0.5 max-w-md">
                            Select the modules you want to wipe. All records within selected modules will be permanently destroyed.
                        </p>
                    </div>
                </div>

                <div className="relative hidden sm:flex h-16 w-24 shrink-0 items-center justify-center">
                    <span className="absolute left-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--cat-3)_25%,transparent)]">
                        <Database className="h-7 w-7 text-[var(--cat-3)]" />
                    </span>
                    <span className="absolute right-0 bottom-0 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--status-critical)] shadow-premium-sm">
                        <Trash2 className="h-5 w-5 text-white" />
                    </span>
                </div>
            </div>

            {/* SELECT MODULES */}
            <div className="card-premium shadow-premium-sm p-5 sm:p-6">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[var(--border)]">
                    <div>
                        <h2 className="font-semibold text-[var(--foreground)]">Select Modules</h2>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            Choose the modules whose data you want to permanently delete.
                        </p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-sm font-medium text-[var(--primary)]">Select All</span>
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={toggleSelectAll}
                            className="data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]"
                        />
                    </label>
                </div>

                <div className="mt-4 max-h-[420px] overflow-y-auto pr-1">
                    {modules.length === 0 ? (
                        <div className="text-center text-[var(--muted-foreground)] py-10 text-sm">Loading modules...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {modules.map((mod) => {
                                const { icon: Icon, color } = moduleStyle(mod);
                                const checked = selectedModules.includes(mod);
                                return (
                                    <label
                                        key={mod}
                                        htmlFor={mod}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                                            checked
                                                ? "border-[var(--primary)] bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]"
                                                : "border-[var(--border)] bg-[var(--muted)] hover:border-[var(--primary)]/40"
                                        )}
                                    >
                                        <Checkbox
                                            id={mod}
                                            checked={checked}
                                            onCheckedChange={() => toggleModule(mod)}
                                            className="data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]"
                                        />
                                        <span
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                            style={{ backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)` }}
                                        >
                                            <Icon className="h-4 w-4" style={{ color }} />
                                        </span>
                                        <span className="text-sm font-medium text-[var(--foreground)] truncate">{mod}</span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* SELECTED SUMMARY */}
            <div className="card-premium shadow-premium-sm p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--primary)_14%,transparent)]">
                        <ShieldCheck className="h-5 w-5 text-[var(--primary)]" />
                    </span>
                    <div>
                        <p className="font-semibold text-sm text-[var(--foreground)]">Selected Modules</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                            {selectedModules.length} module{selectedModules.length === 1 ? "" : "s"} selected for permanent deletion
                        </p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-[var(--primary)] leading-none">{selectedModules.length}</p>
                    <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)] mt-1">Modules Selected</p>
                </div>
            </div>

            {/* FOOTER ACTION BAR */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 card-premium shadow-premium-sm p-4 sm:p-5">
                <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 shrink-0 text-[var(--primary)] mt-0.5" />
                    <div>
                        <p className="font-semibold text-sm text-[var(--primary)]">Please be careful!</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                            This action cannot be undone. All data in selected modules will be permanently removed from the system.
                        </p>
                    </div>
                </div>

                <AlertDialog onOpenChange={(open) => !open && setConfirmationText("")}>
                    <AlertDialogTrigger asChild>
                        <Button
                            disabled={selectedModules.length === 0}
                            className="shrink-0 gap-2 bg-[var(--status-critical)] hover:opacity-90 text-white disabled:opacity-40"
                        >
                            <Trash2 className="h-4 w-4" />
                            Proceed to Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-[var(--status-critical)] flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Final Warning
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                <div className="space-y-3">
                                    <p>
                                        You are about to permanently delete <strong className="text-[var(--foreground)]">ALL DATA</strong> from{" "}
                                        {selectedModules.length} selected module{selectedModules.length === 1 ? "" : "s"}. This process cannot be undone.
                                    </p>
                                    <div className="max-h-28 overflow-y-auto text-xs bg-[var(--muted)] text-[var(--foreground)] p-2 rounded-md">
                                        {selectedModules.join(", ")}
                                    </div>
                                    <div className="space-y-1.5 pt-1">
                                        <Label className="text-[var(--status-critical)]">Type "DELETE" to confirm</Label>
                                        <Input
                                            value={confirmationText}
                                            onChange={(e) => setConfirmationText(e.target.value)}
                                            placeholder="DELETE"
                                            className="border-[color-mix(in_oklab,var(--status-critical)_40%,transparent)] focus-visible:ring-[var(--status-critical)] bg-[var(--card)] text-[var(--foreground)]"
                                        />
                                    </div>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={confirmationText !== "DELETE" || deleting}
                                className="bg-[var(--status-critical)] hover:opacity-90 disabled:opacity-40"
                            >
                                {deleting ? "Deleting..." : "Yes, Wipe Everything"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
