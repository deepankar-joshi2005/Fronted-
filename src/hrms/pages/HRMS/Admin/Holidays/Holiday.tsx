/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { utils as XLSXUtils, writeFile as writeXlsx } from "xlsx";
import {
    Eye,
    Pencil,
    Trash2,
    Search,
    Download,
    Plus,
    CalendarDays,
    CalendarClock,
    CalendarRange,
} from "lucide-react";
import AddHolidayModal from "./AddHolidayModel";
import ViewHolidayModal from "./ViewHolidayModel";
import Loader from "../../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";

interface Holiday {
    _id: string;
    title: string;
    date: string;
    day: string;
}

const API_BASE = import.meta.env.VITE_API_URL;

const Holiday = () => {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [openViewModal, setOpenViewModal] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
    const [mode, setMode] = useState<"add" | "edit">("add");
    const [openFormModal, setOpenFormModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({
        open: false,
        id: null,
    });

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const token = localStorage.getItem("token");

    /* ================= FETCH HOLIDAYS ================= */
    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/holidays`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setHolidays(res.data);
        } catch (error) {
            console.error("Failed to fetch holidays", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [search, pageSize]);

    /* ================= DELETE HOLIDAY ================= */
    const handleDelete = async () => {
        if (!deleteModal.id) return;

        try {
            await axios.delete(`${API_BASE}/holidays/${deleteModal.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setDeleteModal({ open: false, id: null });
            fetchHolidays();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const filteredHolidays = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return holidays;
        return holidays.filter(
            (h) => h.title?.toLowerCase().includes(q) || h.day?.toLowerCase().includes(q)
        );
    }, [holidays, search]);

    const paginatedHolidays = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredHolidays.slice(start, start + pageSize);
    }, [filteredHolidays, page, pageSize]);

    const kpis = useMemo(() => {
        const total = holidays.length;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const upcoming = holidays.filter((h) => new Date(h.date) >= startOfToday).length;
        const thisMonth = holidays.filter((h) => {
            const d = new Date(h.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        return { total, upcoming, thisMonth };
    }, [holidays]);

    const handleExport = () => {
        const sheet = XLSXUtils.json_to_sheet(
            filteredHolidays.map((h) => ({
                Holiday: h.title,
                Date: new Date(h.date).toLocaleDateString(),
                Day: h.day,
            }))
        );
        const wb = XLSXUtils.book_new();
        XLSXUtils.book_append_sheet(wb, sheet, "Holidays");
        writeXlsx(wb, `Holidays-${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    if (loading) {
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
                        Holidays
                    </h1>
                    <p className="text-sm text-[var(--muted-foreground)]">
                        Holiday Management <span className="mx-1">›</span> Holidays
                    </p>
                </div>

                <button
                    onClick={() => {
                        setMode("add");
                        setSelectedHoliday(null);
                        setOpenFormModal(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
                >
                    <Plus className="h-4 w-4" />
                    Add Holiday
                </button>
            </div>

            {/* KPI ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                <StatCard
                    label="Total Holidays"
                    value={kpis.total}
                    icon={CalendarDays}
                    tone="primary"
                    sublabel="All configured holidays"
                />
                <StatCard
                    label="Upcoming Holidays"
                    value={kpis.upcoming}
                    icon={CalendarClock}
                    tone="good"
                    sublabel="From today onward"
                />
                <StatCard
                    label="This Month"
                    value={kpis.thisMonth}
                    icon={CalendarRange}
                    tone="violet"
                    sublabel="Falling in current month"
                />
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search holidays by name or day..."
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

            {/* TABLE */}
            {filteredHolidays.length === 0 ? (
                <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
                    <CalendarDays className="h-8 w-8 text-[var(--muted-foreground)]" />
                    <p className="text-sm text-[var(--muted-foreground)]">No holidays match your search</p>
                </div>
            ) : (
                <div className="card-premium shadow-premium-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-sm">
                            <thead className="bg-[var(--muted)]">
                                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                                    <th className="px-4 py-3">No.</th>
                                    <th className="px-4 py-3">Holiday</th>
                                    <th className="px-4 py-3">Holiday Date</th>
                                    <th className="px-4 py-3">Day</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[var(--border)]">
                                {paginatedHolidays.map((holiday, i) => (
                                    <tr key={holiday._id} className="transition-colors hover:bg-[var(--muted)]">
                                        <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                                            {(page - 1) * pageSize + i + 1}
                                        </td>
                                        <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">
                                            {holiday.title}
                                        </td>
                                        <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                                            {new Date(holiday.date).toLocaleDateString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{holiday.day}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    title="View"
                                                    onClick={() => {
                                                        setSelectedHoliday(holiday);
                                                        setOpenViewModal(true);
                                                    }}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    title="Edit"
                                                    onClick={() => {
                                                        setMode("edit");
                                                        setSelectedHoliday(holiday);
                                                        setOpenFormModal(true);
                                                    }}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    title="Delete"
                                                    onClick={() => {
                                                        setDeleteModal({ open: true, id: holiday._id });
                                                    }}
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
                            total={filteredHolidays.length}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                            itemLabel="holidays"
                        />
                    </div>
                </div>
            )}

            {/* Add Holiday Modal */}
            <AddHolidayModal
                isOpen={openFormModal}
                mode={mode}
                holiday={selectedHoliday}
                onClose={() => setOpenFormModal(false)}
                onSuccess={fetchHolidays}
            />

            <ViewHolidayModal
                isOpen={openViewModal}
                holiday={selectedHoliday}
                onClose={() => {
                    setOpenViewModal(false);
                    setSelectedHoliday(null);
                }}
            />

            {/* Delete Confirmation Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] px-4">
                    <div className="card-premium w-full max-w-md p-6 shadow-premium-sm">
                        <h3 className="text-lg font-semibold mb-2 text-[var(--status-critical)]">Delete Holiday</h3>
                        <p className="text-sm text-[var(--muted-foreground)] mb-6">
                            Are you sure you want to delete this holiday? This action is permanent.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteModal({ open: false, id: null })}
                                className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="rounded-lg bg-[var(--status-critical)] px-4 py-2 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Holiday;
