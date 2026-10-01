import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Wallet, Briefcase, UserPlus, ExternalLink, Eye } from "lucide-react";
import * as businessClientApi from "../../../api/businessClient.api.js";
import { useAuth } from "../../../hooks/useAuth";
import { HRMS_BASE_PATH } from "../../../utils/hrmsSso.js";
import Card from "../../../components/ui/Card.jsx";
import Input from "../../../components/ui/Input.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Button from "../../../components/ui/Button.jsx";
import Spinner from "../../../components/ui/Spinner.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import SegmentedTabs from "../../../components/ui/SegmentedTabs.jsx";
import Pagination from "../../../components/ui/Pagination.jsx";
import ViewClientModal from "../../../components/business-clients/ViewClientModal.jsx";
import useDebouncedValue from "../../../hooks/useDebouncedValue.js";
import useResettablePage from "../../../hooks/useResettablePage.js";

const PAGE_SIZE = 15;

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
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("hrms");
  const [page, setPage] = useResettablePage(`${tab}|${debouncedSearch}`);
  const [viewTarget, setViewTarget] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params: any = { page, limit: PAGE_SIZE, tab };
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await businessClientApi.listPayrollEligibleClients(params);
      setRows(data.data || []);
      setMeta(data.meta || { total: (data.data || []).length, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tab, debouncedSearch]);

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

      <SegmentedTabs
        options={[
          { value: "hrms", label: "HRMS" },
          { value: "non-hrms", label: "Non-HRMS" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No clients found"
          description="Business Clients and converted CRM leads will show up here once you have some — or try a different search term."
        />
      ) : (
        <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
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
              <div className="flex gap-2">
                <Button variant="brand" size="sm" className="flex-1" onClick={() => handleOpenPayroll(row)} loading={busyId === row._id}>
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
                {row.kind === "business_client" && (
                  <Button variant="secondary" size="sm" title="View client details" onClick={() => setViewTarget(row._id)}>
                    <Eye size={14} />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
        <Card className="p-0">
          <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={PAGE_SIZE} onChange={setPage} />
        </Card>
        </div>
      )}

      {viewTarget && <ViewClientModal clientId={viewTarget} onClose={() => setViewTarget(null)} />}
    </div>
  );
}
