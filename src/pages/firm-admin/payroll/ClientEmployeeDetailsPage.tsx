import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users, CheckCircle2 } from "lucide-react";
import * as businessClientApi from "../../../api/businessClient.api.js";
import { useAuth } from "../../../hooks/useAuth";
import ClientIdentityCard from "../../../components/payroll/ClientIdentityCard.jsx";
import Card from "../../../components/ui/Card.jsx";
import Table from "../../../components/ui/Table.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Spinner from "../../../components/ui/Spinner.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    Promise.all([businessClientApi.getBusinessClient(clientId), businessClientApi.listClientEmployees(clientId)])
      .then(([clientRes, employeesRes]) => {
        setClient(clientRes.data.data);
        setEmployees(employeesRes.data.data || []);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

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
        <div className="mb-4 flex items-center gap-2">
          <Users size={16} className="text-text-muted" />
          <h2 className="text-lg font-semibold text-heading">Employees</h2>
          <Badge variant="neutral">{employees.length}</Badge>
        </div>
        {employees.length === 0 ? (
          <EmptyState icon={Users} title="No employees yet" description="Employees show up here once added via Excel upload or by the client." />
        ) : (
          <Table columns={columns} data={employees} keyField="_id" />
        )}
      </Card>
    </div>
  );
}
