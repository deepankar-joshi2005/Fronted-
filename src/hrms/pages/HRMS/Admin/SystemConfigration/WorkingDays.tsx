/** @format */

import { useEffect, useState } from "react";
import axios from "axios";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { Save, Calendar, Clock, List } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

interface WorkingConfig {
    _id?: string;
    companyId: string;
    weeklyOff: {
        monday: string;
        tuesday: string;
        wednesday: string;
        thursday: string;
        friday: string;
        saturday: string;
        sunday: string;
    };
    officeTiming: {
        startTime: string;
        endTime: string;
        breakTime: string;
    };
}

interface Holiday {
    _id: string;
    title: string;
    date: string;
    day: string;
}

export default function WorkingDays() {
    const token = localStorage.getItem("token");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<WorkingConfig | null>(null);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");

    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch companies first to get a companyId if none is selected
            const companiesRes = await axios.get(`${API_BASE}/companies`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCompanies(companiesRes.data);

            const compId = selectedCompanyId || companiesRes.data[0]?._id;
            if (compId) {
                setSelectedCompanyId(compId);
                // Fetch Working Days Config
                try {
                    const configRes = await axios.get(`${API_BASE}/working-days/${compId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setConfig(configRes.data);
                } catch (err) {
                    // If not found, set a default template
                    setConfig({
                        companyId: compId,
                        weeklyOff: {
                            monday: "Working",
                            tuesday: "Working",
                            wednesday: "Working",
                            thursday: "Working",
                            friday: "Working",
                            saturday: "Half Day",
                            sunday: "OFF",
                        },
                        officeTiming: {
                            startTime: "09:30 AM",
                            endTime: "06:30 PM",
                            breakTime: "01:00 PM - 02:00 PM",
                        },
                    });
                }
            }

            // Fetch Holidays
            const holidaysRes = await axios.get(`${API_BASE}/holidays`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setHolidays(holidaysRes.data);

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedCompanyId]);

    const handleSave = async () => {
        if (!config || !selectedCompanyId) return;
        try {
            setSaving(true);
            await axios.post(`${API_BASE}/working-days`, { ...config, companyId: selectedCompanyId }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast({
                type: "success",
                title: "Settings Saved",
                message: "Working Days configuration updated successfully",
            });
        } catch (error) {
            toast({
                type: "error",
                title: "Save Failed",
                message: "Failed to update working days configuration",
            });
        } finally {
            setSaving(false);
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
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                        Working Days & Office Timing
                    </h1>
                    <p className="text-sm text-[var(--muted-foreground)]">
                        System Configuration <span className="mx-1">›</span> Working Days
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedCompanyId}
                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                        className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
                    >
                        <option value="">Select Company</option>
                        {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? "Saving..." : "Save Settings"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                {/* WEEKLY OFF */}
                <div className="card-premium shadow-premium-sm p-6">
                    <div className="mb-4 flex items-center gap-2 text-[var(--primary)]">
                        <Calendar className="h-5 w-5" />
                        <h2 className="text-lg font-semibold text-[var(--foreground)]">Weekly Off Settings</h2>
                    </div>
                    <div className="space-y-3">
                        {config && days.map((day) => (
                            <div key={day} className="flex items-center justify-between rounded-lg bg-[var(--muted)] p-3">
                                <span className="text-sm font-medium capitalize text-[var(--foreground)]">{day}</span>
                                <select
                                    value={(config.weeklyOff as any)[day]}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        weeklyOff: { ...config.weeklyOff, [day]: e.target.value }
                                    })}
                                    className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
                                >
                                    <option value="Working">Working</option>
                                    <option value="Half Day">Half Day</option>
                                    <option value="OFF">Weekly OFF</option>
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                {/* OFFICE TIMING */}
                <div className="space-y-4 sm:space-y-5">
                    <div className="card-premium shadow-premium-sm p-6">
                        <div className="mb-4 flex items-center gap-2 text-[var(--primary)]">
                            <Clock className="h-5 w-5" />
                            <h2 className="text-lg font-semibold text-[var(--foreground)]">Office Timings</h2>
                        </div>
                        {config && (
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-[var(--muted-foreground)]">Start Time</label>
                                    <input
                                        type="text"
                                        value={config.officeTiming.startTime}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            officeTiming: { ...config.officeTiming, startTime: e.target.value }
                                        })}
                                        className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
                                        placeholder="e.g. 09:30 AM"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[var(--muted-foreground)]">End Time</label>
                                    <input
                                        type="text"
                                        value={config.officeTiming.endTime}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            officeTiming: { ...config.officeTiming, endTime: e.target.value }
                                        })}
                                        className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
                                        placeholder="e.g. 06:30 PM"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[var(--muted-foreground)]">Break Time</label>
                                    <input
                                        type="text"
                                        value={config.officeTiming.breakTime}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            officeTiming: { ...config.officeTiming, breakTime: e.target.value }
                                        })}
                                        className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
                                        placeholder="e.g. 01:00 PM - 02:00 PM"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* HOLIDAY LIST */}
                    <div className="card-premium shadow-premium-sm p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[var(--primary)]">
                                <List className="h-5 w-5" />
                                <h2 className="text-lg font-semibold text-[var(--foreground)]">Holiday Calendar</h2>
                            </div>
                            <span className="rounded-md bg-[var(--muted)] px-2 py-1 text-xs font-medium text-[var(--muted-foreground)]">2025-2026</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {holidays.length === 0 ? (
                                <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">No holidays configured.</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-[var(--muted)]">
                                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                                            <th className="px-3 py-2">Occasion</th>
                                            <th className="px-3 py-2">Date</th>
                                            <th className="px-3 py-2">Day</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {holidays.map((h) => (
                                            <tr key={h._id} className="transition-colors hover:bg-[var(--muted)]">
                                                <td className="px-3 py-2.5 font-medium text-[var(--foreground)]">{h.title}</td>
                                                <td className="px-3 py-2.5 text-[var(--muted-foreground)]">{new Date(h.date).toLocaleDateString()}</td>
                                                <td className="px-3 py-2.5 text-[var(--muted-foreground)]">{h.day}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
