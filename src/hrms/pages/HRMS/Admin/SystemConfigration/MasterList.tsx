/** @format */

import { useEffect, useMemo, useState, type ElementType } from "react";
import axios from "axios";
import { utils as XLSXUtils, writeFile as writeXlsx } from "xlsx";
import {
    Plus,
    Trash2,
    Pencil,
    Search,
    Download,
    ShieldAlert,
    Zap,
    Users,
    Wallet,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Percent,
} from "lucide-react";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

type ItemType = "EMPLOYEE_CATEGORY" | "EXPENSE_CATEGORY" | "REIMBURSEMENT_CATEGORY";

interface MasterItem {
    _id: string;
    type: ItemType;
    name: string;
    status: "Active" | "Inactive";
}

interface TaxSlab {
    _id: string;
    minIncome: number;
    maxIncome: number;
    percentage: number;
    description?: string;
}

const TABS: { id: ItemType | "TAX_SLAB"; label: string; icon: ElementType }[] = [
    { id: "EMPLOYEE_CATEGORY", label: "Employee Categories", icon: Users },
    { id: "EXPENSE_CATEGORY", label: "Expense Categories", icon: Zap },
    { id: "REIMBURSEMENT_CATEGORY", label: "Reimbursements", icon: Wallet },
    { id: "TAX_SLAB", label: "Tax Slabs", icon: ShieldAlert },
];

export default function MasterList() {
    const token = localStorage.getItem("token");
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ItemType | "TAX_SLAB">("EMPLOYEE_CATEGORY");

    const [items, setItems] = useState<MasterItem[]>([]);
    const [taxSlabs, setTaxSlabs] = useState<TaxSlab[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [form, setForm] = useState({
        name: "",
        minIncome: "",
        maxIncome: "",
        percentage: "",
        description: "",
        status: "Active"
    });

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const isTaxTab = activeTab === "TAX_SLAB";
    const currentTabMeta = TABS.find((t) => t.id === activeTab) ?? TABS[0];

    const fetchData = async () => {
        try {
            setLoading(true);
            if (activeTab === "TAX_SLAB") {
                const res = await axios.get(`${API_BASE}/master-lists/tax-slabs`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTaxSlabs(res.data);
            } else {
                const res = await axios.get(`${API_BASE}/master-lists/items?type=${activeTab}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setItems(res.data);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    useEffect(() => {
        setPage(1);
    }, [activeTab, search, pageSize]);

    const handleSubmit = async () => {
        try {
            if (activeTab === "TAX_SLAB") {
                const payload = {
                    minIncome: Number(form.minIncome),
                    maxIncome: Number(form.maxIncome),
                    percentage: Number(form.percentage),
                    description: form.description
                };
                if (editingItem) {
                    await axios.put(`${API_BASE}/master-lists/tax-slabs/${editingItem._id}`, payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } else {
                    await axios.post(`${API_BASE}/master-lists/tax-slabs`, payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            } else {
                const payload = { type: activeTab, name: form.name, status: form.status };
                if (editingItem) {
                    await axios.put(`${API_BASE}/master-lists/items/${editingItem._id}`, payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } else {
                    await axios.post(`${API_BASE}/master-lists/items`, payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }

            toast({ type: "success", title: "Success", message: "Operation completed successfully" });
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            toast({ type: "error", title: "Error", message: "Action failed" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            const endpoint = activeTab === "TAX_SLAB" ? "tax-slabs" : "items";
            await axios.delete(`${API_BASE}/master-lists/${endpoint}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast({ type: "success", title: "Deleted", message: "Item removed successfully" });
            fetchData();
        } catch (error) {
            toast({ type: "error", title: "Error", message: "Delete failed" });
        }
    };

    const filteredItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter((i) => i.name?.toLowerCase().includes(q));
    }, [items, search]);

    const filteredTaxSlabs = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return taxSlabs;
        return taxSlabs.filter(
            (s) =>
                (s.description || "").toLowerCase().includes(q) ||
                String(s.percentage).includes(q) ||
                String(s.minIncome).includes(q) ||
                String(s.maxIncome).includes(q)
        );
    }, [taxSlabs, search]);

    const paginatedItems = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredItems.slice(start, start + pageSize);
    }, [filteredItems, page, pageSize]);

    const paginatedTaxSlabs = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredTaxSlabs.slice(start, start + pageSize);
    }, [filteredTaxSlabs, page, pageSize]);

    const kpis = useMemo(() => {
        if (isTaxTab) {
            const total = taxSlabs.length;
            const rates = taxSlabs.map((s) => s.percentage);
            const highest = rates.length ? Math.max(...rates) : 0;
            const average = rates.length
                ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10) / 10
                : 0;
            return { total, highest, average, active: 0, inactive: 0 };
        }
        const total = items.length;
        const active = items.filter((i) => i.status === "Active").length;
        const inactive = total - active;
        return { total, active, inactive, highest: 0, average: 0 };
    }, [isTaxTab, items, taxSlabs]);

    const handleExport = () => {
        let sheet;
        let sheetName;
        let fileName;
        if (isTaxTab) {
            sheet = XLSXUtils.json_to_sheet(
                filteredTaxSlabs.map((s) => ({
                    "Income Range": `${s.minIncome} - ${s.maxIncome === 99999999 ? "Above" : s.maxIncome}`,
                    "Tax Percentage": `${s.percentage}%`,
                    Description: s.description || "",
                }))
            );
            sheetName = "Tax Slabs";
            fileName = "Tax-Slabs";
        } else {
            sheet = XLSXUtils.json_to_sheet(
                filteredItems.map((i) => ({
                    Name: i.name,
                    Status: i.status,
                }))
            );
            sheetName = currentTabMeta.label;
            fileName = currentTabMeta.label.replace(/\s+/g, "-");
        }
        const wb = XLSXUtils.book_new();
        XLSXUtils.book_append_sheet(wb, sheet, sheetName);
        writeXlsx(wb, `${fileName}-${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    if (loading && items.length === 0 && taxSlabs.length === 0) {
        return (
            <div className="relative min-h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                        Master List Configuration
                    </h1>
                    <p className="text-sm text-[var(--muted-foreground)]">
                        System Configuration <span className="mx-1">›</span> Master List
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingItem(null);
                        setForm({ name: "", minIncome: "", maxIncome: "", percentage: "", description: "", status: "Active" });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
                >
                    <Plus className="h-4 w-4" />
                    Add New
                </button>
            </div>

            {/* TABS */}
            <div className="flex flex-wrap gap-1 border-b border-[var(--border)]">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setSearch("");
                        }}
                        className={cn(
                            "flex items-center gap-2 -mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                            activeTab === tab.id
                                ? "border-[var(--primary)] text-[var(--primary)]"
                                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        )}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* KPI ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {isTaxTab ? (
                    <>
                        <StatCard
                            label="Total Tax Slabs"
                            value={kpis.total}
                            icon={ShieldAlert}
                            tone="primary"
                            sublabel="Configured income slabs"
                        />
                        <StatCard
                            label="Highest Rate"
                            value={`${kpis.highest}%`}
                            icon={TrendingUp}
                            tone="warning"
                            sublabel="Maximum tax percentage"
                        />
                        <StatCard
                            label="Average Rate"
                            value={`${kpis.average}%`}
                            icon={Percent}
                            tone="violet"
                            sublabel="Across all slabs"
                        />
                    </>
                ) : (
                    <>
                        <StatCard
                            label={`Total ${currentTabMeta.label}`}
                            value={kpis.total}
                            icon={currentTabMeta.icon}
                            tone="primary"
                            sublabel="All records"
                        />
                        <StatCard
                            label="Active"
                            value={kpis.active}
                            icon={CheckCircle2}
                            tone="good"
                            sublabel={`${kpis.total > 0 ? Math.round((kpis.active / kpis.total) * 100) : 0}% of total`}
                        />
                        <StatCard
                            label="Inactive"
                            value={kpis.inactive}
                            icon={XCircle}
                            tone="critical"
                            sublabel="Currently disabled"
                        />
                    </>
                )}
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={
                            isTaxTab
                                ? "Search tax slabs by percentage or description..."
                                : `Search ${currentTabMeta.label.toLowerCase()} by name...`
                        }
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            {(isTaxTab ? filteredTaxSlabs.length : filteredItems.length) === 0 ? (
                <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
                    <currentTabMeta.icon className="h-8 w-8 text-[var(--muted-foreground)]" />
                    <p className="text-sm text-[var(--muted-foreground)]">
                        No records found. Click "Add New" to get started.
                    </p>
                </div>
            ) : (
                <div className="card-premium shadow-premium-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-sm">
                            <thead className="bg-[var(--muted)]">
                                {isTaxTab ? (
                                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                                        <th className="px-4 py-3">No.</th>
                                        <th className="px-4 py-3">Income Range</th>
                                        <th className="px-4 py-3">Tax Percentage</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                ) : (
                                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                                        <th className="px-4 py-3">No.</th>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                )}
                            </thead>

                            <tbody className="divide-y divide-[var(--border)]">
                                {isTaxTab
                                    ? paginatedTaxSlabs.map((slab, i) => (
                                        <tr key={slab._id} className="transition-colors hover:bg-[var(--muted)]">
                                            <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                                                {(page - 1) * pageSize + i + 1}
                                            </td>
                                            <td className="px-4 py-3.5 text-[var(--foreground)]">
                                                ₹{slab.minIncome.toLocaleString()} -{" "}
                                                {slab.maxIncome === 99999999
                                                    ? "Above"
                                                    : `₹${slab.maxIncome.toLocaleString()}`}
                                            </td>
                                            <td className="px-4 py-3.5 font-semibold text-[var(--primary)]">
                                                {slab.percentage}%
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        title="Edit"
                                                        onClick={() => {
                                                            setEditingItem(slab);
                                                            setForm({
                                                                ...form,
                                                                minIncome: slab.minIncome.toString(),
                                                                maxIncome: slab.maxIncome.toString(),
                                                                percentage: slab.percentage.toString(),
                                                                description: slab.description || "",
                                                            });
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        title="Delete"
                                                        onClick={() => handleDelete(slab._id)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[color-mix(in_oklab,var(--status-critical)_12%,transparent)] hover:text-[var(--status-critical)]"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                    : paginatedItems.map((item, i) => (
                                        <tr key={item._id} className="transition-colors hover:bg-[var(--muted)]">
                                            <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                                                {(page - 1) * pageSize + i + 1}
                                            </td>
                                            <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">
                                                {item.name}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                                                        item.status === "Active"
                                                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                                                            : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            "h-1.5 w-1.5 rounded-full",
                                                            item.status === "Active"
                                                                ? "bg-[var(--status-good)]"
                                                                : "bg-[var(--status-critical)]"
                                                        )}
                                                    />
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        title="Edit"
                                                        onClick={() => {
                                                            setEditingItem(item);
                                                            setForm({ ...form, name: item.name, status: item.status });
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        title="Delete"
                                                        onClick={() => handleDelete(item._id)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[color-mix(in_oklab,var(--status-critical)_12%,transparent)] hover:text-[var(--status-critical)]"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-[var(--border)] px-4 py-3.5">
                        <TablePagination
                            page={page}
                            pageSize={pageSize}
                            total={isTaxTab ? filteredTaxSlabs.length : filteredItems.length}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                            itemLabel={isTaxTab ? "tax slabs" : currentTabMeta.label.toLowerCase()}
                        />
                    </div>
                </div>
            )}

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
                    <div className="card-premium w-full max-w-md overflow-hidden shadow-premium-sm">
                        <div className="border-b border-[var(--border)] bg-[var(--muted)] p-6">
                            <h3 className="text-lg font-semibold text-[var(--foreground)]">
                                {editingItem ? "Edit Item" : "Add New Item"}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {activeTab === "TAX_SLAB" ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">Min Income</label>
                                            <input value={form.minIncome} onChange={e => setForm({ ...form, minIncome: e.target.value })} className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] p-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]" placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">Max Income</label>
                                            <input value={form.maxIncome} onChange={e => setForm({ ...form, maxIncome: e.target.value })} className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] p-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]" placeholder="9999999" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">Percentage (%)</label>
                                        <input value={form.percentage} onChange={e => setForm({ ...form, percentage: e.target.value })} className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] p-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]" placeholder="5" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">Description</label>
                                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] p-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]" rows={2} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">Name</label>
                                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] p-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]" placeholder="e.g. Contractual" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-[var(--muted-foreground)]">Status</label>
                                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] p-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]">
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 border-t border-[var(--border)] bg-[var(--muted)] p-6">
                            <button onClick={() => setIsModalOpen(false)} className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]">Cancel</button>
                            <button onClick={handleSubmit} className="rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
