/** @format */

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Loader from "../../Loader";
import {
    Trophy,
    CalendarCheck,
    UserCheck,
    Target,
    MoreVertical,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

const API_BASE = import.meta.env.VITE_API_URL;
const VIOLET = "#7C3AED";

/* ================= TYPES ================= */

interface User {
    _id: string;
    name: string;
    role: string;
    email: string;
    departmentId?: { name: string };
    managerId?: { _id: string };
}

interface AttendanceRecord {
    user: { _id: string };
    date: string;
    punchIn?: string;
    status?: string; // Present, Absent, Half Day
}

interface LeaveRecord {
    user: { _id: string };
    leaveType: string;
    startDate: string;
    endDate: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    totalDays: number;
}

interface GoalRecord {
    _id: string;
    title: string;
    progress: number;
    status: string;
    assignedTo?: { _id: string };
}

interface EmployeePerformance {
    user: User;
    attendance: {
        present: number;
        absent: number;
        attendancePercentage: number;
    };
    leaves: {
        taken: number;
        pending: number;
        isFrequent: boolean;
    };
    goals: {
        total: number;
        avgProgress: number;
        completed: number;
    };
    score: number;
    rating: {
        label: string;
        color: string;
    };
}

/* ================= COMPONENT ================= */

export default function PerformanceMetrics() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
    const [goals, setGoals] = useState<GoalRecord[]>([]);

    // Filter State
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth()); // 0-indexed

    // Modal State
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeePerformance | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    /* ================= FETCH DATA ================= */
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, month]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };

            const [usersRes, attendanceRes, leavesRes, goalsRes] = await Promise.all([
                axios.get(`${API_BASE}/users`, { headers }),
                axios.get(`${API_BASE}/attendance/team`, {
                    headers,
                    params: { month, year },
                }),
                axios.get(`${API_BASE}/employee/leaves/manager`, { headers }),
                axios.get(`${API_BASE}/goals/my`, { headers }),
            ]);

            const teamMembers = usersRes.data.filter(
                (u: User) =>
                    u.managerId?._id === loggedInUser.id ||
                    u.managerId?._id === loggedInUser._id
            );

            setUsers(teamMembers);
            // /attendance/team responds with { users, attendance, matrix } — not
            // a bare array. Setting the whole object here made `attendance` an
            // object, so `.filter()` on it below threw during render and blanked
            // the whole page.
            setAttendance(attendanceRes.data?.attendance || []);
            setLeaves(leavesRes.data || []);
            setGoals(goalsRes.data || []);
        } catch (err) {
            console.error("Failed to fetch performance data", err);
        } finally {
            setLoading(false);
        }
    };

    /* ================= PROCESS DATA ================= */
    const performanceData: EmployeePerformance[] = useMemo(() => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let workingDays = 0;
        for (let d = 1; d <= daysInMonth; d++) {
            const dayOfWeek = new Date(year, month, d).getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++;
        }
        if (workingDays === 0) workingDays = 22;

        return users.map((user) => {
            // 1. Attendance Metrics
            const userAttendance = attendance.filter(
                (a) => a.user._id === user._id
            );
            const presentDays = userAttendance.filter((a) => a.punchIn).length;
            const attendancePercentage = Math.round(
                Math.min((presentDays / workingDays) * 100, 100)
            );
            const absentDays = workingDays - presentDays;

            // 2. Leave Metrics
            const approvedLeavesDays = leaves
                .filter((l) => (l as any).employee?._id === user._id || (l as any).user?._id === user._id)
                .filter((l) => l.status === "APPROVED")
                .reduce((sum, l) => sum + l.totalDays, 0);

            const pendingRequests = leaves
                .filter((l) => (l as any).employee?._id === user._id || (l as any).user?._id === user._id)
                .filter((l) => l.status === "PENDING").length;

            const isFrequent = approvedLeavesDays > 3;

            // 3. Goals Metrics
            const userGoals = goals.filter(
                (g) => g.assignedTo?._id === user._id
            );
            const totalGoals = userGoals.length;
            const completedGoals = userGoals.filter(
                (g) => g.status === "Completed" || g.progress === 100
            ).length;
            const avgGoalProgress =
                totalGoals > 0
                    ? Math.round(
                        userGoals.reduce((sum, g) => sum + g.progress, 0) / totalGoals
                    )
                    : 0;

            // 4. Overall Score Calculation
            const score = Math.round(
                (attendancePercentage * 0.4) + (avgGoalProgress * 0.6)
            );

            // 5. Rating
            let rating = {
                label: "N/A",
                color: "bg-[var(--muted)] text-[var(--muted-foreground)]",
            };
            if (score >= 90)
                rating = {
                    label: "A - Excellent",
                    color: "bg-[color-mix(in_oklab,var(--status-good)_16%,transparent)] text-[var(--status-good)]",
                };
            else if (score >= 75)
                rating = {
                    label: "B - Good",
                    color: "bg-[color-mix(in_oklab,var(--primary)_16%,transparent)] text-[var(--primary)]",
                };
            else if (score >= 60)
                rating = {
                    label: "C - Average",
                    color: "bg-[color-mix(in_oklab,var(--status-warning)_16%,transparent)] text-[var(--status-warning)]",
                };
            else
                rating = {
                    label: "D - Poor",
                    color: "bg-[color-mix(in_oklab,var(--status-critical)_16%,transparent)] text-[var(--status-critical)]",
                };

            return {
                user,
                attendance: {
                    present: presentDays,
                    absent: absentDays,
                    attendancePercentage,
                },
                leaves: {
                    taken: approvedLeavesDays,
                    pending: pendingRequests,
                    isFrequent,
                },
                goals: {
                    total: totalGoals,
                    avgProgress: avgGoalProgress,
                    completed: completedGoals,
                },
                score,
                rating,
            };
        });
    }, [users, attendance, leaves, goals, year, month]);

    /* ================= CHARTS DATA ================= */
    const topPerformers = useMemo(() => {
        return [...performanceData]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(p => ({
                name: p.user.name.split(" ")[0], // First name for brevity
                score: p.score,
                attendance: p.attendance.attendancePercentage,
                goals: p.goals.avgProgress
            }));
    }, [performanceData]);

    const scoreDistribution = useMemo(() => {
        const distribution = [
            { name: "Excellent (A)", value: 0, color: "var(--status-good)" },
            { name: "Good (B)", value: 0, color: "var(--primary)" },
            { name: "Average (C)", value: 0, color: "var(--status-warning)" },
            { name: "Poor (D)", value: 0, color: "var(--status-critical)" },
        ];
        performanceData.forEach(p => {
            if (p.score >= 90) distribution[0].value++;
            else if (p.score >= 75) distribution[1].value++;
            else if (p.score >= 60) distribution[2].value++;
            else distribution[3].value++;
        });
        return distribution.filter(d => d.value > 0);
    }, [performanceData]);

    /* ================= HANDLERS ================= */
    const handleViewDetails = (employee: EmployeePerformance) => {
        setSelectedEmployee(employee);
        setIsDetailsOpen(true);
    };

    const handleViewAttendance = () => {
        navigate(`/hrms/manager/team-attendance`);
    };

    const handleViewGoals = () => {
        navigate(`/hrms/manager/performance/goals`);
    };

    /* ================= UI HELPERS ================= */
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-[var(--status-good)]";
        if (score >= 60) return "text-[var(--primary)]";
        if (score >= 40) return "text-[var(--status-warning)]";
        return "text-[var(--status-critical)]";
    };

    if (loading) return <Loader />;

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] bg-clip-text text-transparent">
                        Team Performance Analytics
                    </h1>
                    <p className="text-sm text-[var(--muted-foreground)] font-medium">
                        Real-time insights into attendance, goals, and overall efficiency.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Select
                        value={year.toString()}
                        onValueChange={(val) => setYear(Number(val))}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {[2024, 2025, 2026].map((y) => (
                                <SelectItem key={y} value={y.toString()}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={month.toString()}
                        onValueChange={(val) => setMonth(Number(val))}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                    {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* SUMMARY STATISTICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-premium-sm hover:shadow-premium-md transition-all duration-300 transform hover:-translate-y-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-2">
                            <UserCheck size={16} className="text-[var(--primary)]" /> Team Strength
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-[var(--foreground)]">
                            {users.length}
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1 font-medium">Active Members</p>
                    </CardContent>
                </Card>

                <Card className="shadow-premium-sm hover:shadow-premium-md transition-all duration-300 transform hover:-translate-y-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-2">
                            <CalendarCheck size={16} className="text-[var(--status-good)]" /> Avg. Attendance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-[var(--foreground)]">
                            {performanceData.length > 0
                                ? Math.round(
                                    performanceData.reduce(
                                        (acc, curr) => acc + curr.attendance.attendancePercentage,
                                        0
                                    ) / performanceData.length
                                )
                                : 0}
                            <span className="text-xl text-[var(--muted-foreground)] ml-1">%</span>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1 font-medium">Overall Presence</p>
                    </CardContent>
                </Card>

                <Card className="shadow-premium-sm hover:shadow-premium-md transition-all duration-300 transform hover:-translate-y-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-2">
                            <Target size={16} className="text-[#7C3AED]" /> Goal Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold text-[var(--foreground)]">
                            {performanceData.length > 0
                                ? Math.round(
                                    performanceData.reduce(
                                        (acc, curr) => acc + curr.goals.avgProgress,
                                        0
                                    ) / performanceData.length
                                )
                                : 0}
                            <span className="text-xl text-[var(--muted-foreground)] ml-1">%</span>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1 font-medium">Avg Completion</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[var(--primary)] to-[#7C3AED] border-0 shadow-premium-sm text-white hover:shadow-premium-md transition-all duration-300 transform hover:-translate-y-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-white/80 uppercase tracking-wider flex items-center gap-2">
                            <Trophy size={16} className="text-yellow-300" /> Top Performer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate">
                            {performanceData.length > 0 ? (
                                performanceData.reduce((prev, current) => (prev.score > current.score) ? prev : current).user.name
                            ) : "N/A"}
                        </div>
                        <p className="text-xs text-white/70 mt-1 font-medium">Highest Overall Score</p>
                    </CardContent>
                </Card>
            </div>

            {/* ================= CHARTS SECTION ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* CHART 1: Top 5 Performers */}
                <Card className="lg:col-span-2 shadow-premium-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-[var(--foreground)]">Top Performers Overview</CardTitle>
                        <CardDescription>Comparing Score, Attendance, and Goals for top 5 employees</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topPerformers} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)" }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)" }} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "1px solid var(--border)",
                                        background: "var(--popover)",
                                        color: "var(--popover-foreground)",
                                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                    }}
                                    cursor={{ fill: "var(--muted)" }}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="score" name="Overall Score" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="attendance" name="Attendance %" fill="var(--status-good)" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="goals" name="Goal Progress %" fill={VIOLET} radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* CHART 2: Score Distribution */}
                <Card className="shadow-premium-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-[var(--foreground)]">Performance Distribution</CardTitle>
                        <CardDescription>Breakdown of employee ratings</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={scoreDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {scoreDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "1px solid var(--border)",
                                        background: "var(--popover)",
                                        color: "var(--popover-foreground)",
                                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                    }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* PERFORMANCE TABLE */}
            <Card className="shadow-premium-sm overflow-hidden">
                <CardHeader className="border-b border-[var(--border)] py-5">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-lg font-bold text-[var(--foreground)]">Detailed Performance Report</CardTitle>
                            <CardDescription>
                                {months[month]} {year}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-[var(--muted)]">
                                <TableRow>
                                    <TableHead className="w-[250px] font-semibold text-[var(--muted-foreground)]">Employee</TableHead>
                                    <TableHead className="text-center font-semibold text-[var(--muted-foreground)]">Attendance</TableHead>
                                    <TableHead className="text-center font-semibold text-[var(--muted-foreground)]">Leaves</TableHead>
                                    <TableHead className="w-[200px] font-semibold text-[var(--muted-foreground)]">Goal Progress</TableHead>
                                    <TableHead className="text-center font-semibold text-[var(--muted-foreground)]">Score</TableHead>
                                    <TableHead className="text-center font-semibold text-[var(--muted-foreground)]">Rating</TableHead>
                                    <TableHead className="text-right font-semibold text-[var(--muted-foreground)]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {performanceData.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center py-10 text-[var(--muted-foreground)]"
                                        >
                                            No team members found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    performanceData.map((data) => (
                                        <TableRow key={data.user._id} className="hover:bg-[var(--muted)] transition-colors">
                                            {/* Employee Info */}
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[#7C3AED] flex items-center justify-center text-white font-bold shadow-premium-sm text-sm">
                                                        {data.user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-[var(--foreground)]">
                                                            {data.user.name}
                                                        </p>
                                                        <p className="text-xs text-[var(--primary)] font-medium">{data.user.role}</p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Attendance */}
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <span
                                                        className={`font-bold ${data.attendance.attendancePercentage >= 90
                                                            ? "text-[var(--status-good)]"
                                                            : data.attendance.attendancePercentage >= 75
                                                                ? "text-[var(--primary)]"
                                                                : "text-[var(--status-warning)]"
                                                            }`}
                                                    >
                                                        {data.attendance.attendancePercentage}%
                                                    </span>
                                                    <span className="text-[10px] text-[var(--muted-foreground)] font-medium bg-[var(--muted)] px-2 py-0.5 rounded-full mt-1">
                                                        {data.attendance.present}P / {data.attendance.absent}A
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Leaves */}
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-sm font-medium text-[var(--foreground)]">{data.leaves.taken} Taken</span>
                                                    {data.leaves.pending > 0 && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] bg-[color-mix(in_oklab,var(--status-warning)_10%,transparent)] text-[var(--status-warning)] border-[color-mix(in_oklab,var(--status-warning)_30%,transparent)]"
                                                        >
                                                            {data.leaves.pending} Pending
                                                        </Badge>
                                                    )}
                                                    {data.leaves.isFrequent && (
                                                        <Badge variant="destructive" className="text-[10px] py-0 h-4 px-1.5">
                                                            Frequent
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Goal Progress */}
                                            <TableCell>
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-[var(--muted-foreground)] font-medium">{data.goals.completed}/{data.goals.total} Goals</span>
                                                        <span className="font-bold text-[#7C3AED]">{data.goals.avgProgress}%</span>
                                                    </div>
                                                    <Progress value={data.goals.avgProgress} className="h-2 bg-[var(--muted)]" indicatorClassName="bg-[#7C3AED]" />
                                                </div>
                                            </TableCell>

                                            {/* Score */}
                                            <TableCell className="text-center">
                                                <div className="relative inline-flex items-center justify-center">
                                                    <span className={`text-lg font-extrabold ${getScoreColor(data.score)}`}>{data.score}</span>
                                                </div>
                                            </TableCell>

                                            {/* Rating */}
                                            <TableCell className="text-center">
                                                <span className={`px-3 py-1 rounded-md text-xs font-bold shadow-premium-sm ${data.rating.color}`}>
                                                    {data.rating.label}
                                                </span>
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-[var(--muted)] text-[var(--muted-foreground)]">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56">
                                                        <DropdownMenuLabel className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider px-3 py-2">Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            className="cursor-pointer px-3 py-2 text-[var(--foreground)] transition-colors"
                                                            onClick={() => handleViewDetails(data)}
                                                        >
                                                            <Eye className="mr-2 h-4 w-4 text-[var(--primary)]" /> View Performance Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="cursor-pointer px-3 py-2 text-[var(--foreground)] transition-colors"
                                                            onClick={() => handleViewAttendance()}
                                                        >
                                                            <CalendarCheck className="mr-2 h-4 w-4 text-[var(--status-good)]" /> View Attendance Log
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="cursor-pointer px-3 py-2 text-[var(--foreground)] transition-colors"
                                                            onClick={() => handleViewGoals()}
                                                        >
                                                            <Target className="mr-2 h-4 w-4 text-[#7C3AED]" /> View Goals & Objectives
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* DETAILS MODAL */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto shadow-premium-lg rounded-2xl">
                    <DialogHeader className="border-b border-[var(--border)] pb-4">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-[var(--foreground)]">
                            {selectedEmployee && (
                                <>
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[#7C3AED] flex items-center justify-center text-white font-bold shadow-premium-md text-lg">
                                        {selectedEmployee.user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            {selectedEmployee.user.name}
                                            <Badge className={`${selectedEmployee.rating.color} px-3 py-1 text-xs uppercase shadow-premium-sm border-0`}>{selectedEmployee.rating.label}</Badge>
                                        </div>
                                        <p className="text-sm text-[var(--muted-foreground)] font-medium mt-0.5">{selectedEmployee.user.role} • {selectedEmployee.user.email}</p>
                                    </div>
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-[var(--muted-foreground)]">
                            Detailed performance breakdown for <span className="font-semibold text-[var(--foreground)]">{months[month]} {year}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedEmployee && (
                        <div className="space-y-6 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* SCORE CARD */}
                                <Card className="bg-[color-mix(in_oklab,var(--primary)_8%,var(--card))] border-[color-mix(in_oklab,var(--primary)_25%,transparent)] shadow-premium-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold text-[var(--primary)] uppercase tracking-wide">Overall Score</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline gap-2">
                                            <div className="text-6xl font-black text-[var(--primary)] tracking-tighter">{selectedEmployee.score}</div>
                                            <div className="text-lg text-[var(--primary)]/70 font-medium">/ 100</div>
                                        </div>
                                        <p className="text-xs text-[var(--primary)]/70 mt-2 font-medium">
                                            Calculated based on 40% Attendance and 60% Goal Completion.
                                        </p>
                                        <div className="mt-4 h-2 w-full bg-[color-mix(in_oklab,var(--primary)_15%,transparent)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[var(--primary)] rounded-full"
                                                style={{ width: `${selectedEmployee.score}%` }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* ATTENDANCE DETAILS */}
                                <Card className="shadow-premium-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wide flex items-center gap-2">
                                            <CalendarCheck className="h-4 w-4 text-[var(--status-good)]" /> Attendance Overview
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[var(--muted-foreground)] font-medium">Attendance Rate</span>
                                            <span className="font-bold text-lg text-[var(--foreground)]">{selectedEmployee.attendance.attendancePercentage}%</span>
                                        </div>
                                        <Progress
                                            value={selectedEmployee.attendance.attendancePercentage}
                                            className="h-2.5 bg-[var(--muted)]"
                                            indicatorClassName={selectedEmployee.attendance.attendancePercentage >= 90 ? "bg-[var(--status-good)]" : "bg-[var(--status-warning)]"}
                                        />
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <div className="bg-[color-mix(in_oklab,var(--status-good)_10%,transparent)] p-3 rounded-lg text-center border border-[color-mix(in_oklab,var(--status-good)_25%,transparent)]">
                                                <div className="text-2xl font-bold text-[var(--status-good)]">{selectedEmployee.attendance.present}</div>
                                                <div className="text-xs text-[var(--status-good)] font-semibold uppercase tracking-wide">Days Present</div>
                                            </div>
                                            <div className="bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] p-3 rounded-lg text-center border border-[color-mix(in_oklab,var(--status-critical)_25%,transparent)]">
                                                <div className="text-2xl font-bold text-[var(--status-critical)]">{selectedEmployee.attendance.absent}</div>
                                                <div className="text-xs text-[var(--status-critical)] font-semibold uppercase tracking-wide">Days Absent</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* LEAVE DETAILS */}
                                <Card className="shadow-premium-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wide flex items-center gap-2">
                                            <UserCheck className="h-4 w-4 text-[var(--primary)]" /> Leave Statistics
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
                                            <span className="text-[var(--muted-foreground)] font-medium">Leaves Taken</span>
                                            <span className="font-bold text-[var(--foreground)]">{selectedEmployee.leaves.taken} Days</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
                                            <span className="text-[var(--muted-foreground)] font-medium">Pending Requests</span>
                                            <span className="font-bold text-[var(--status-warning)] bg-[color-mix(in_oklab,var(--status-warning)_10%,transparent)] px-2 py-0.5 rounded-md">{selectedEmployee.leaves.pending} Request(s)</span>
                                        </div>
                                        <div className="pt-2">
                                            {selectedEmployee.leaves.isFrequent ? (
                                                <div className="bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] text-[var(--status-critical)] px-4 py-3 rounded-lg text-sm flex items-center gap-3 border border-[color-mix(in_oklab,var(--status-critical)_25%,transparent)]">
                                                    <MoreVertical className="h-5 w-5" />
                                                    <div>
                                                        <span className="font-bold block">Frequent Leave Taker</span>
                                                        <span className="text-xs opacity-80">This employee exceeds the monthly leave threshold.</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-[color-mix(in_oklab,var(--status-good)_10%,transparent)] text-[var(--status-good)] px-4 py-3 rounded-lg text-sm flex items-center gap-3 border border-[color-mix(in_oklab,var(--status-good)_25%,transparent)]">
                                                    <UserCheck className="h-5 w-5" />
                                                    <div>
                                                        <span className="font-bold block">Good Attendance</span>
                                                        <span className="text-xs opacity-80">Employee maintains a healthy attendance record.</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* GOALS DETAILS */}
                                <Card className="shadow-premium-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wide flex items-center gap-2">
                                            <Target className="h-4 w-4 text-[#7C3AED]" /> Goal Completion
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[var(--muted-foreground)] font-medium">Avg. Completion</span>
                                            <span className="font-bold text-lg text-[var(--foreground)]">{selectedEmployee.goals.avgProgress}%</span>
                                        </div>
                                        <Progress value={selectedEmployee.goals.avgProgress} className="h-2.5 bg-[var(--muted)]" indicatorClassName="bg-[#7C3AED]" />
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <div className="bg-[color-mix(in_oklab,#7C3AED_10%,transparent)] p-3 rounded-lg text-center border border-[color-mix(in_oklab,#7C3AED_25%,transparent)]">
                                                <div className="text-2xl font-bold text-[#7C3AED]">{selectedEmployee.goals.total}</div>
                                                <div className="text-xs text-[#7C3AED] font-semibold uppercase tracking-wide">Total Goals</div>
                                            </div>
                                            <div className="bg-[color-mix(in_oklab,var(--status-good)_10%,transparent)] p-3 rounded-lg text-center border border-[color-mix(in_oklab,var(--status-good)_25%,transparent)]">
                                                <div className="text-2xl font-bold text-[var(--status-good)]">{selectedEmployee.goals.completed}</div>
                                                <div className="text-xs text-[var(--status-good)] font-semibold uppercase tracking-wide">Completed</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
