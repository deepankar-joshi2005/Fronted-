import { useEffect, useState } from "react";
import { LifeBuoy } from "lucide-react";
import * as supportTicketApi from "../../api/supportTicket.api.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Select from "../../components/ui/Select.jsx";
import Input from "../../components/ui/Input.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import DateRangeFilter from "../../components/ui/DateRangeFilter.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import TicketModal from "../../components/support/TicketModal.jsx";
import useDebouncedValue from "../../hooks/useDebouncedValue.js";
import useResettablePage from "../../hooks/useResettablePage.js";

const STATUS_BADGE = { open: "warning", in_progress: "brand", resolved: "success", closed: "neutral" };
const STATUS_LABELS = { open: "Open", in_progress: "In progress", resolved: "Resolved", closed: "Closed" };
const PAGE_SIZE = 15;

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [dateRange, setDateRange] = useState({ preset: "all", startDate: "", endDate: "" });
  const [page, setPage] = useResettablePage(`${statusFilter}|${debouncedSearch}|${dateRange.startDate}|${dateRange.endDate}`);
  const [active, setActive] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const params: any = { page, limit: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      const { data } = await supportTicketApi.listTickets(params);
      setTickets(data.data);
      setMeta(data.meta || { total: data.data.length, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, debouncedSearch, dateRange.startDate, dateRange.endDate]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">Support</h1>
        <p className="mt-1 text-sm text-text-muted">Escalations and queries raised by CA firms.</p>
      </div>

      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div className="w-full max-w-sm">
          <Input label="Search" placeholder="Search by subject..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-full sm:w-52">
          <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Select>
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
      ) : tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets found" description="Try adjusting your search or filters." />
      ) : (
        <Card className="p-0">
          <div className="divide-y divide-border">
            {tickets.map((ticket) => (
              <button
                key={ticket._id}
                onClick={() => setActive(ticket)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-surface-2"
              >
                <div>
                  <p className="text-sm font-medium text-heading">{ticket.subject}</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {ticket.caFirmId?.name} · {new Date(ticket.updatedAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant={STATUS_BADGE[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
              </button>
            ))}
          </div>
          <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={PAGE_SIZE} onChange={setPage} />
        </Card>
      )}

      {active && (
        <TicketModal
          ticket={active}
          isSuperAdmin
          onClose={() => {
            setActive(null);
            load();
          }}
          onUpdated={setActive}
        />
      )}
    </div>
  );
}
