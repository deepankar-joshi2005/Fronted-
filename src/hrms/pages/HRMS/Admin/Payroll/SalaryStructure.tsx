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
  Users,
  Landmark,
  TrendingUp,
  MinusCircle,
} from "lucide-react";
import AddSalaryStructureModal from "./AddSalaryStructureModal";
import ViewSalaryStructureModal from "./ViewSalaryStructureModal";
import DeleteSalaryStructureModal from "./DeleteSalaryStructureModal";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  EARNING_COMPONENTS,
  DEDUCTION_COMPONENTS,
  calcTotalEarnings,
  calcTotalDeductions,
  calcNetSalary,
} from "./salaryStructureFields";


interface SalaryStructure {
  _id: string;
  employee: {
    _id: string;
    name: string;
    employeeId: string;
    joiningDate: string;
    designationId?: { name: string };
    departmentId?: { name: string };
    branchId?: { name: string };
  };
  [key: string]: any;
}

const API_BASE = import.meta.env.VITE_API_URL;

const getName = (field: any) => (typeof field === "object" ? field?.name : field) || "-";

const SalaryStructure = () => {
  const token = localStorage.getItem("token");

  const [salaryList, setSalaryList] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<SalaryStructure | null>(
    null
  );

  const [companies, setCompanies] = useState<any[]>([]);
  const [companyFilter, setCompanyFilter] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ================= FETCH ================= */
  const fetchSalary = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/salary-structures`, {
        params: { companyId: companyFilter },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalaryList(res.data);
    } catch {
      console.error("Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${API_BASE}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompanies(res.data);
    } catch (err) {
      console.error("Failed to fetch companies");
    }
  };

  useEffect(() => {
    fetchSalary();
  }, [companyFilter]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize, companyFilter]);

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    if (!selectedSalary) return;

    try {
      const res = await axios.delete(
        `${API_BASE}/salary-structures/${selectedSalary._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast({
        type: "success",
        title: "Salary Deleted",
        message:
          res.data?.message || "Salary structure has been deleted successfully.",
      });

      setOpenDeleteModal(false);
      setSelectedSalary(null);
      fetchSalary();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        message:
          error?.response?.data?.message ||
          "Unable to delete salary structure. Please try again.",
      });
    }
  };

  /* ================= SEARCH + PAGINATION ================= */
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return salaryList;
    return salaryList.filter((s) => {
      const name = s.employee?.name?.toLowerCase() || "";
      const empId = s.employee?.employeeId?.toLowerCase() || "";
      const designation = getName(s.employee?.designationId).toLowerCase();
      const department = getName(s.employee?.departmentId).toLowerCase();
      return (
        name.includes(q) ||
        empId.includes(q) ||
        designation.includes(q) ||
        department.includes(q)
      );
    });
  }, [salaryList, search]);

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, page, pageSize]);

  /* ================= KPI ================= */
  const kpis = useMemo(() => {
    const total = salaryList.length;
    const totalPayout = salaryList.reduce((acc, s) => acc + calcNetSalary(s), 0);
    const avgNet = total > 0 ? Math.round(totalPayout / total) : 0;
    const totalDeductions = salaryList.reduce((acc, s) => acc + calcTotalDeductions(s), 0);
    return { total, totalPayout, avgNet, totalDeductions };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaryList]);

  /* ================= EXPORT ================= */
  const handleExport = () => {
    const sheet = XLSXUtils.json_to_sheet(
      filteredList.map((s) => ({
        "Employee ID": s.employee?.employeeId || "-",
        "Employee Name": s.employee?.name || "-",
        Designation: getName(s.employee?.designationId),
        Department: getName(s.employee?.departmentId),
        DOJ: s.employee?.joiningDate ? new Date(s.employee.joiningDate).toLocaleDateString("en-GB") : "-",
        Location: getName(s.employee?.branchId),
        ...Object.fromEntries(EARNING_COMPONENTS.map(([key, label]) => [label, s[key] || 0])),
        "Total Earnings": calcTotalEarnings(s),
        ...Object.fromEntries(DEDUCTION_COMPONENTS.map(([key, label]) => [label, s[key] || 0])),
        "Total Deductions": calcTotalDeductions(s),
        "Net Salary": calcNetSalary(s),
      }))
    );
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, sheet, "Salary Structures");
    writeXlsx(wb, `Salary-Structures-${new Date().toISOString().split("T")[0]}.xlsx`);
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
      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Salary Structure
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Payroll <span className="mx-1">›</span> Salary Structure
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedSalary(null);
            setOpenAddModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Salary Structure
        </button>
      </div>

      {/* ================= KPI ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Structures" value={kpis.total} icon={Users} tone="primary" sublabel="Active salary records" />
        <StatCard
          label="Total Monthly Payout"
          value={`₹${kpis.totalPayout.toLocaleString()}`}
          icon={Landmark}
          tone="good"
          sublabel="Net payable across employees"
        />
        <StatCard
          label="Average Net Salary"
          value={`₹${kpis.avgNet.toLocaleString()}`}
          icon={TrendingUp}
          tone="violet"
          sublabel="Per employee"
        />
        <StatCard
          label="Total Deductions"
          value={`₹${kpis.totalDeductions.toLocaleString()}`}
          icon={MinusCircle}
          tone="warning"
          sublabel="PF, tax & other recoveries"
        />
      </div>

      {/* ================= TOOLBAR ================= */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee name, ID or department..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
          >
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      {filteredList.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <Landmark className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No salary structure records found</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] text-[13px]">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)]">
                {/* Group Headers */}
                <tr className="border-b border-[var(--border)]">
                  <th rowSpan={2} className="px-4 py-3 border-r border-[var(--border)] text-xs font-semibold uppercase tracking-wide">No.</th>
                  <th colSpan={6} className="px-4 py-2 border-r border-[var(--border)] text-center text-xs font-semibold uppercase tracking-wide">Employee Info.</th>
                  <th colSpan={4} className="px-4 py-2 border-r border-[var(--border)] text-center text-xs font-semibold uppercase tracking-wide bg-[color-mix(in_oklab,var(--status-good)_10%,transparent)] text-[var(--status-good)]">Earnings</th>
                  <th colSpan={6} className="px-4 py-2 border-r border-[var(--border)] text-center text-xs font-semibold uppercase tracking-wide bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] text-[var(--status-critical)]">Total Deductions</th>
                  <th rowSpan={2} className="px-4 py-3 border-r border-[var(--border)] text-xs font-semibold uppercase tracking-wide bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]">Net Salary Payable</th>
                  <th rowSpan={2} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">Action</th>
                </tr>
                {/* Field Headers */}
                <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wider">
                  <th className="px-2 py-3 border-r border-[var(--border)]">Employee ID</th>
                  <th className="px-2 py-3 border-r border-[var(--border)] font-semibold">Employee Name</th>
                  <th className="px-2 py-3 border-r border-[var(--border)]">Designation</th>
                  <th className="px-2 py-3 border-r border-[var(--border)]">Department</th>
                  <th className="px-2 py-3 border-r border-[var(--border)]">DOJ</th>
                  <th className="px-2 py-3 border-r border-[var(--border)]">Location</th>
                  <th className="px-2 py-3 border-r border-[var(--border)]">Basic</th>
                  <th className="px-2 py-3 border-r border-[var(--border)]">HRA</th>
                  <th className="px-2 py-3 border-r border-[var(--border)]">Other Allw.</th>
                  <th className="px-2 py-3 border-r border-[var(--border)] font-semibold" title="Sum of all earning components, including ones not shown as separate columns (see View/Export for the full breakdown)">Total Earn.*</th>
                  <th className="px-2 py-3 border-r border-[var(--border)]">Emp PF</th>
                  <th className="px-2 py-3 border-r border-[var(--border)]">Prof. Tax</th>
                  <th className="px-2 py-3 border-r border-[var(--border)]">TDS</th>
                  <th className="px-2 py-3 border-r border-[var(--border)]">Advance</th>
                  <th className="px-2 py-3 border-r border-[var(--border)]">Others</th>
                  <th className="px-2 py-3 border-r border-[var(--border)] font-semibold" title="Sum of all deduction components, including ones not shown as separate columns (see View/Export for the full breakdown)">Total Deduct.*</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                {paginatedList.map((s, index) => (
                  <tr key={s._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3 border-r border-[var(--border)] text-center text-[var(--muted-foreground)]">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center font-mono text-[12px] text-[var(--muted-foreground)]">
                      {s.employee?.employeeId || "-"}
                    </td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center font-medium text-[var(--primary)]">
                      {s.employee?.name || "Unknown"}
                    </td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">{getName(s.employee?.designationId)}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">{getName(s.employee?.departmentId)}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">
                      {s.employee?.joiningDate ? new Date(s.employee.joiningDate).toLocaleDateString("en-GB") : "-"}
                    </td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">{getName(s.employee?.branchId)}</td>

                    {/* Earnings */}
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">₹{s.basic}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">₹{s.hra}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">₹{s.otherAllowance}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center font-semibold bg-[color-mix(in_oklab,var(--status-good)_8%,transparent)] text-[var(--status-good)]">
                      ₹{calcTotalEarnings(s)}
                    </td>

                    {/* Deductions */}
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">₹{s.pf}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">₹{s.professionalTax}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">₹{s.tds}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">₹{s.advance}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">₹{s.others}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center font-semibold bg-[color-mix(in_oklab,var(--status-critical)_8%,transparent)] text-[var(--status-critical)]">
                      ₹{calcTotalDeductions(s)}
                    </td>

                    <td className="px-4 py-3 border-r border-[var(--border)] text-center bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] text-[14px] font-semibold text-[var(--primary)]">
                      ₹{calcNetSalary(s).toLocaleString()}
                    </td>

                    {/* ACTION */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title="View"
                          onClick={() => {
                            setSelectedSalary(s);
                            setOpenViewModal(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          title="Edit"
                          onClick={() => {
                            setSelectedSalary(s);
                            setOpenAddModal(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => {
                            setSelectedSalary(s);
                            setOpenDeleteModal(true);
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

              {/* TOTALS FOOTER */}
              {filteredList.length > 0 && (
                <tfoot className="border-t-2 border-[var(--primary)] bg-[var(--muted)] font-semibold">
                  <tr>
                    <td colSpan={7} className="px-4 py-3 text-right text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">Grand Total:</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">₹{filteredList.reduce((acc, s) => acc + (s.basic || 0), 0).toLocaleString()}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">₹{filteredList.reduce((acc, s) => acc + (s.hra || 0), 0).toLocaleString()}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">₹{filteredList.reduce((acc, s) => acc + (s.otherAllowance || 0), 0).toLocaleString()}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center bg-[color-mix(in_oklab,var(--status-good)_10%,transparent)] text-[var(--status-good)]">₹{filteredList.reduce((acc, s) => acc + calcTotalEarnings(s), 0).toLocaleString()}</td>

                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">₹{filteredList.reduce((acc, s) => acc + (s.pf || 0), 0).toLocaleString()}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">₹{filteredList.reduce((acc, s) => acc + (s.professionalTax || 0), 0).toLocaleString()}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">₹{filteredList.reduce((acc, s) => acc + (s.tds || 0), 0).toLocaleString()}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">₹{filteredList.reduce((acc, s) => acc + (s.advance || 0), 0).toLocaleString()}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center">₹{filteredList.reduce((acc, s) => acc + (s.others || 0), 0).toLocaleString()}</td>
                    <td className="px-2 py-3 border-r border-[var(--border)] text-center bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] text-[var(--status-critical)]">₹{filteredList.reduce((acc, s) => acc + calcTotalDeductions(s), 0).toLocaleString()}</td>

                    <td className="px-4 py-3 border-r border-[var(--border)] text-center bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-[var(--primary)]">₹{filteredList.reduce((acc, s) => acc + calcNetSalary(s), 0).toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="border-t border-[var(--border)] px-4 py-3.5">
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={filteredList.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="structures"
            />
          </div>
        </div>
      )}

      {/* VIEW */}
      <ViewSalaryStructureModal
        isOpen={openViewModal}
        data={selectedSalary}
        onClose={() => {
          setOpenViewModal(false);
          setSelectedSalary(null);
        }}
      />

      {/* ADD / EDIT */}
      <AddSalaryStructureModal
        isOpen={openAddModal}
        editData={selectedSalary}
        onClose={() => {
          setOpenAddModal(false);
          setSelectedSalary(null);
          fetchSalary();
        }}
      />

      {/* DELETE */}
      <DeleteSalaryStructureModal
        isOpen={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setSelectedSalary(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default SalaryStructure;
