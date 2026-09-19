import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Wallet, Briefcase, UserPlus, ExternalLink } from "lucide-react";
import * as businessClientApi from "../../../api/businessClient.api.js";
import { useAuth } from "../../../hooks/useAuth";
import { HRMS_BASE_PATH } from "../../../utils/hrmsSso.js";
import Card from "../../../components/ui/Card.jsx";
import Input from "../../../components/ui/Input.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Button from "../../../components/ui/Button.jsx";
import Spinner from "../../../components/ui/Spinner.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";

const CLIENT_TYPE_LABELS: Record<string, string> = {
  individual: "Individual",
  proprietorship: "Proprietorship",
  partnership: "Partnership",
  llp: "LLP",
  company: "Company",
  other: "Other",
};

function kindBadge(row: any) {
  if (row.kind === "lead") return <Badge variant="neutral">Individual client</Badge>;
  if (row.useHrms) return <Badge variant="brand">HRMS</Badge>;
  return <Badge variant="success">Excel payroll</Badge>;
}

export default function PayrollManagementPage() {
  const { basePath } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await businessClientApi.listPayrollEligibleClients();
      setRows(data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.gstin, r.pan, r.contactPerson, r.phone].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, search]);

  async function handleOpenPayroll(row: any) {
    setError("");
    setBusyId(row._id);
    try {
      if (row.kind === "lead") {
        const { data } = await businessClientApi.provisionBusinessClientFromLead(row._id);
        navigate(`${basePath}/clients/${data.data.client._id}/payroll`);
        return;
      }
      if (row.useHrms) {
        const { data } = await businessClientApi.getClientHrmsSsoToken(row._id);
        const redirect = encodeURIComponent("/hrms/SuperAdmin/payroll/run");
        window.open(`${HRMS_BASE_PATH}/sso?token=${encodeURIComponent(data.data.token)}&redirect=${redirect}`, "_blank");
        return;
      }
      navigate(`${basePath}/clients/${row._id}/payroll`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not open this client's payroll");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">Payroll Management</h1>
        <p className="mt-1 text-sm text-text-muted">
          Pick any Business Client or individual client to view or run their payroll.
        </p>
      </div>

      {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}

      <Card className="p-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search by company or client name, GSTIN, PAN..."
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={rows.length === 0 ? "No clients yet" : "No matches"}
          description={
            rows.length === 0
              ? "Business Clients and converted CRM leads will show up here once you have some."
              : "Try a different search term."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => (
            <Card key={`${row.kind}-${row._id}`} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-heading" title={row.name}>
                    {row.name}
                  </p>
                  <p className="text-xs text-text-muted">{row.clientType ? CLIENT_TYPE_LABELS[row.clientType] : "Converted lead"}</p>
                </div>
                {kindBadge(row)}
              </div>
              <div className="flex flex-col gap-0.5 text-xs text-text-muted">
                {row.gstin && <p>GSTIN: {row.gstin}</p>}
                {row.pan && <p>PAN: {row.pan}</p>}
                {row.contactPerson && <p>{row.contactPerson}</p>}
                {row.phone && <p>{row.phone}</p>}
              </div>
              <Button size="sm" onClick={() => handleOpenPayroll(row)} loading={busyId === row._id}>
                {row.kind === "lead" ? (
                  <>
                    <UserPlus size={14} /> Set up payroll
                  </>
                ) : row.useHrms ? (
                  <>
                    <ExternalLink size={14} /> Open HRMS payroll
                  </>
                ) : (
                  <>
                    <Wallet size={14} /> View payroll
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
