import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users, CheckCircle2 } from "lucide-react";
import * as businessClientApi from "../../../api/businessClient.api.js";
import { useAuth } from "../../../hooks/useAuth";
import ClientIdentityCard from "../../../components/payroll/ClientIdentityCard.jsx";
import Card from "../../../components/ui/Card.jsx";
import Input from "../../../components/ui/Input.jsx";
import Table from "../../../components/ui/Table.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Spinner from "../../../components/ui/Spinner.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import DateRangeFilter from "../../../components/ui/DateRangeFilter.jsx";
import useDebouncedValue from "../../../hooks/useDebouncedValue.js";
import useResettablePage from "../../../hooks/useResettablePage.js";

const PAGE_SIZE = 15;

const SOURCE_LABELS: Record<string, { label: string; variant: string }> = {
  self_registered: { label: "Self-registered", variant: "brand" },
  manual: { label: "Manual", variant: "neutral" },
  excel_import: { label: "Excel import", variant: "neutral" },
};

export default function ClientEmployeeDetailsPage() {
  const { clientId } = useParams();
  const { basePath } = useAuth();

  const [client, setClient] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [dateRange, setDateRange] = useState({ preset: "all", startDate: "", endDate: "" });
  const [page, setPage] = useResettablePage(`${debouncedSearch}|${dateRange.startDate}|${dateRange.endDate}`);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    businessClientApi
      .getBusinessClient(clientId)
      .then(({ data }) => setClient(data.data))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    setEmployeesLoading(true);
    const params: any = { page, limit: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (dateRange.startDate) params.startDate = dateRange.startDate;
    if (dateRange.endDate) params.endDate = dateRange.endDate;
    businessClientApi
      .listClientEmployees(clientId, params)
      .then(({ data }) => {
        setEmployees(data.data || []);
        setMeta(data.meta || { total: (data.data || []).length, totalPages: 1 });
      })
      .finally(() => setEmployeesLoading(false));
  }, [clientId, page, debouncedSearch, dateRange.startDate, dateRange.endDate]);

  const columns = [
    {
      key: "name",
      label: "Employee",
      render: (row: any) => (
        <div>
          <p className="font-medium text-heading">{row.name}</p>
          <p className="text-xs text-text-muted">{row.employeeCode}</p>
        </div>
      ),
    },
    { key: "designation", label: "Designation", render: (row: any) => row.designation || "—" },
    {
      key: "dateOfJoining",
      label: "Date of Joining",
      render: (row: any) => (row.dateOfJoining ? new Date(row.dateOfJoining).toLocaleDateString("en-IN") : "—"),
    },
    {
      key: "contact",
      label: "Contact",
      render: (row: any) => (
        <div>
          <p className="text-text">{row.phone || "—"}</p>
          <p className="text-xs text-text-muted">{row.email || ""}</p>
        </div>
      ),
    },
    { key: "pan", label: "PAN", render: (row: any) => row.pan || "—" },
    {
      key: "bank",
      label: "Bank Details",
      render: (row: any) =>
        row.bankAccountNumber ? (
          <div>
            <p className="text-text">{row.accountHolderName || row.name}</p>
            <p className="text-xs text-text-muted">
              {row.bankName || "—"} · {row.bankAccountNumber} · {row.bankIfsc || "—"}
            </p>
          </div>
        ) : (
          "—"
        ),
    },
    {
      key: "selfService",
      label: "Self-service",
      align: "center" as const,
      render: (row: any) =>
        row.selfServiceSubmittedAt ? (
          <span className="inline-flex items-center gap-1 text-xs text-success">
            <CheckCircle2 size={13} /> {new Date(row.selfServiceSubmittedAt).toLocaleDateString("en-IN")}
          </span>
        ) : (
          <span className="text-xs text-text-muted">Not yet</span>
        ),
    },
    {
      key: "source",
      label: "Source",
      render: (row: any) => {
        const s = SOURCE_LABELS[row.source] || SOURCE_LABELS.manual;
        return <Badge variant={s.variant as any}>{s.label}</Badge>;
      },
    },
    {
      key: "isActive",
      label: "Status",
      render: (row: any) => <Badge variant={row.isActive ? "success" : "danger"}>{row.isActive ? "Active" : "Inactive"}</Badge>,
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          to={`${basePath}/clients/${clientId}/payroll`}
          className="rounded-lg p-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-heading">Employee Details</h1>
          <p className="mt-1 text-sm text-text-muted">
            Everything on file for {client?.name}'s employees — including what they've filled in themselves via the
            onboarding link.
          </p>
        </div>
      </div>

      <ClientIdentityCard client={client} />

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-text-muted" />
            <h2 className="text-lg font-semibold text-heading">Employees</h2>
            <Badge variant="neutral">{meta.total}</Badge>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full max-w-xs">
              <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <DateRangeFilter
              preset={dateRange.preset}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={setDateRange}
            />
          </div>
        </div>
        {employeesLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size={24} />
          </div>
        ) : employees.length === 0 ? (
          <EmptyState icon={Users} title="No employees found" description="Try adjusting your search or date range." />
        ) : (
          <Table
            columns={columns}
            data={employees}
            keyField="_id"
            pagination={{ page, totalPages: meta.totalPages, total: meta.total, limit: PAGE_SIZE, onChange: setPage }}
          />
        )}
      </Card>
    </div>
  );
}
