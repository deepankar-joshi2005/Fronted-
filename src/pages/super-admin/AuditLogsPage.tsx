import { useEffect, useState } from "react";
import { FileClock } from "lucide-react";
import * as auditLogApi from "../../api/auditLog.api.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import DateRangeFilter from "../../components/ui/DateRangeFilter.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import useDebouncedValue from "../../hooks/useDebouncedValue.js";
import useResettablePage from "../../hooks/useResettablePage.js";

const PAGE_SIZE = 15;

const ACTION_LABELS = {
  "ca_firm.created": "CA firm created",
  "ca_firm.suspended": "CA firm suspended",
  "ca_firm.activated": "CA firm activated",
  "ca_firm.admin_password_reset": "Admin password reset",
  "user.activated": "User activated",
  "user.deactivated": "User deactivated",
  "settings.updated": "Platform settings updated",
};

function formatDateTime(value) {
  return new Date(value).toLocaleString();
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [dateRange, setDateRange] = useState({ preset: "all", startDate: "", endDate: "" });
  const [page, setPage] = useResettablePage(`${debouncedSearch}|${dateRange.startDate}|${dateRange.endDate}`);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    setLoading(true);
    const params: any = { page, limit: PAGE_SIZE };
    if (debouncedSearch) params.search = debouncedSearch;
    if (dateRange.startDate) params.startDate = dateRange.startDate;
    if (dateRange.endDate) params.endDate = dateRange.endDate;
    auditLogApi
      .listAuditLogs(params)
      .then(({ data }) => {
        setLogs(data.data);
        setMeta(data.meta || { total: data.data.length, totalPages: 1 });
      })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, dateRange.startDate, dateRange.endDate]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">Audit Logs</h1>
        <p className="mt-1 text-sm text-text-muted">Every administrative action taken on the platform.</p>
      </div>

      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div className="w-full max-w-sm">
          <Input
            label="Search"
            placeholder="Search by actor, action, or target..."
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

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={FileClock} title="No activity found" description="Try adjusting your search or date range." />
      ) : (
        <Card className="p-0">
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log._id} className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-medium text-heading">
                    {ACTION_LABELS[log.action] || log.action}
                    {log.targetLabel ? ` — ${log.targetLabel}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    by {log.actorName} ({log.actorRole})
                  </p>
                </div>
                <span className="shrink-0 text-xs text-text-muted">{formatDateTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={PAGE_SIZE} onChange={setPage} />
        </Card>
      )}
    </div>
  );
}
