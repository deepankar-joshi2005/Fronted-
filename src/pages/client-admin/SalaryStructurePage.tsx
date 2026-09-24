import { useEffect, useState } from "react";
import { Users, TrendingUp } from "lucide-react";
import * as businessClientApi from "../../api/businessClient.api.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Table from "../../components/ui/Table.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const currency = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

export default function SalaryStructurePage() {
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState<any[]>([]);
  const [run, setRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    businessClientApi
      .getMySalaryStructureForMonth(month)
      .then(({ data }) => {
        setRows(data.data || []);
        setRun(data.run || null);
      })
      .finally(() => setLoading(false));
  }, [month]);

  const totalNet = rows.reduce((sum, r) => sum + (r.net || 0), 0);
  const netAvailable = run && run.status !== "Draft";

  const columns = [
    {
      key: "employee",
      label: "Employee",
      render: (row: any) => (
        <div>
          <p className="font-medium text-heading">{row.employee?.name || "—"}</p>
          <p className="text-xs text-text-muted">{row.employee?.employeeCode || "—"}</p>
        </div>
      ),
    },
    { key: "ctc", label: "CTC", align: "center" as const, render: (row: any) => currency(row.ctc) },
    {
      key: "basic",
      label: "Basic",
      align: "center" as const,
      render: (row: any) => currency(row.earnings?.["Basic"] || 0),
    },
    { key: "gross", label: "Gross", align: "center" as const, render: (row: any) => currency(row.gross) },
    {
      key: "net",
      label: "Net Pay",
      align: "center" as const,
      render: (row: any) => (netAvailable ? currency(row.net) : "—"),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-heading">Salary Structure</h1>
          <p className="mt-1 text-sm text-text-muted">Month-wise view of your employees' salary structure.</p>
        </div>
        <Input type="month" value={month} onChange={(e: any) => setMonth(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Users size={20} />
          </div>
          <p className="mt-4 text-2xl font-bold text-heading">{rows.length}</p>
          <p className="text-sm text-text-muted">Employees</p>
          <p className="mt-1 text-xs text-text-muted">{monthLabel(month)}</p>
        </Card>
        <Card className="p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-bg text-success">
            <TrendingUp size={20} />
          </div>
          <p className="mt-4 text-2xl font-bold text-heading">{netAvailable ? currency(totalNet) : "—"}</p>
          <p className="text-sm text-text-muted">Total Net Pay</p>
          <p className="mt-1 text-xs text-text-muted">{netAvailable ? "Payroll run for this month" : "Payroll not run yet"}</p>
        </Card>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users size={16} className="text-text-muted" />
          <h2 className="text-lg font-semibold text-heading">Employees &amp; salary structure</h2>
          <Badge variant="neutral">{rows.length}</Badge>
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Users} title={`No salary structure for ${monthLabel(month)} yet`} description="Your CA will upload this once the month's Excel is processed." />
        ) : (
          <Table columns={columns} data={rows} keyField="_id" />
        )}
      </Card>
    </div>
  );
}
