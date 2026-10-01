import { useEffect, useState } from "react";
import { Briefcase, CheckCircle2, XCircle } from "lucide-react";
import * as businessClientApi from "../../api/businessClient.api.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Input from "../../components/ui/Input.jsx";
import Table from "../../components/ui/Table.jsx";
import DateRangeFilter from "../../components/ui/DateRangeFilter.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import useDebouncedValue from "../../hooks/useDebouncedValue.js";
import useResettablePage from "../../hooks/useResettablePage.js";

const SUB_STATUS_BADGE = { PAID: "success", PENDING: "warning", OVERDUE: "danger" };
const PAGE_SIZE = 15;

export default function BusinessClientsPage() {
  const [data, setData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [dateRange, setDateRange] = useState({ preset: "all", startDate: "", endDate: "" });
  const [page, setPage] = useResettablePage(`${debouncedSearch}|${dateRange.startDate}|${dateRange.endDate}`);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    businessClientApi
      .getBusinessClientSummary()
      .then(({ data }) => setData(data.data))
      .finally(() => setSummaryLoading(false));
  }, []);

  useEffect(() => {
    setClientsLoading(true);
    const params: any = { page, limit: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (dateRange.startDate) params.startDate = dateRange.startDate;
    if (dateRange.endDate) params.endDate = dateRange.endDate;
    businessClientApi
      .listAllBusinessClients(params)
      .then(({ data }) => {
        setClients(data.data);
        setMeta(data.meta || { total: data.data.length, totalPages: 1 });
      })
      .finally(() => setClientsLoading(false));
  }, [page, debouncedSearch, dateRange.startDate, dateRange.endDate]);

  const loading = summaryLoading;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">Business Clients</h1>
        <p className="mt-1 text-sm text-text-muted">
          Plan and billing visibility only — operational data (employees, payroll, documents) stays with the CA firm
          that onboarded each client.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Briefcase size={20} />
          </div>
          <p className="mt-4 text-2xl font-bold text-heading">{data.total}</p>
          <p className="text-sm text-text-muted">Total business clients</p>
        </Card>
        <Card className="p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <CheckCircle2 size={20} />
          </div>
          <p className="mt-4 text-2xl font-bold text-heading">{data.active}</p>
          <p className="text-sm text-text-muted">Active</p>
        </Card>
        <Card className="p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <XCircle size={20} />
          </div>
          <p className="mt-4 text-2xl font-bold text-heading">{data.suspended}</p>
          <p className="text-sm text-text-muted">Suspended</p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-base font-semibold text-heading">Business clients by CA firm</h2>
        {data.byFirm.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No business clients yet"
            description="Business clients are onboarded by each CA firm from their own dashboard. Counts will appear here once that module is live."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {data.byFirm.map((row) => (
              <li key={row.caFirmId} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium text-text">{row.firmName}</span>
                <span className="text-sm font-semibold text-heading">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-heading">All business clients</h2>

        <Card className="mb-4 flex flex-wrap items-end gap-3 p-4">
          <div className="w-full max-w-sm">
            <Input
              label="Search"
              placeholder="Search business clients by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <DateRangeFilter
            preset={dateRange.preset}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
          />
        </Card>

        {clientsLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : clients.length === 0 ? (
          <EmptyState icon={Briefcase} title="No business clients found" description="Try adjusting your search or date range." />
        ) : (
          <Table
            columns={[
              { key: "name", label: "Business Client" },
              { key: "caFirmName", label: "CA Firm" },
              {
                key: "planTier",
                label: "HRMS Plan",
                render: (c) => (c.useHrms === false ? <span className="text-text-muted">Excel-based</span> : c.planTier || "—"),
              },
              {
                key: "status",
                label: "Status",
                render: (c) =>
                  c.useHrms === false ? (
                    <Badge variant={c.isActive ? "success" : "danger"}>{c.isActive ? "Active" : "Suspended"}</Badge>
                  ) : c.subscriptionStatus ? (
                    <Badge variant={SUB_STATUS_BADGE[c.subscriptionStatus] || "neutral"}>{c.subscriptionStatus}</Badge>
                  ) : (
                    "—"
                  ),
              },
              {
                key: "subscriptionEndDate",
                label: "Expires",
                render: (c) => (c.subscriptionEndDate ? new Date(c.subscriptionEndDate).toLocaleDateString() : "—"),
              },
            ]}
            data={clients}
            keyField="_id"
            pagination={{ page, totalPages: meta.totalPages, total: meta.total, limit: PAGE_SIZE, onChange: setPage }}
          />
        )}
      </div>
    </div>
  );
}
