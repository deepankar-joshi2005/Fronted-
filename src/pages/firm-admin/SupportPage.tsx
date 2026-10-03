import { useEffect, useState } from "react";
import { LifeBuoy, Plus } from "lucide-react";
import * as supportTicketApi from "../../api/supportTicket.api.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import DateRangeFilter from "../../components/ui/DateRangeFilter.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import TicketModal from "../../components/support/TicketModal.jsx";
import useDebouncedValue from "../../hooks/useDebouncedValue.js";
import useResettablePage from "../../hooks/useResettablePage.js";

const STATUS_BADGE = { open: "warning", in_progress: "brand", resolved: "success", closed: "neutral" };
const STATUS_LABELS = { open: "Open", in_progress: "In progress", resolved: "Resolved", closed: "Closed" };
const INITIAL_FORM = { subject: "", message: "", priority: "medium" };
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
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await supportTicketApi.createTicket(form);
      setCreateOpen(false);
      setForm(INITIAL_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit ticket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-heading">Support</h1>
          <p className="mt-1 text-sm text-text-muted">Raise a query or escalation to the Ledgerly team.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> New ticket
        </Button>
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
        <EmptyState
          icon={LifeBuoy}
          title="No tickets found"
          description="Try adjusting your search or filters, or raise a new ticket."
          action={
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus size={15} /> New ticket
            </Button>
          }
        />
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
                <p className="mt-0.5 text-xs text-text-muted">{new Date(ticket.updatedAt).toLocaleString()}</p>
              </div>
              <Badge variant={STATUS_BADGE[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
            </button>
          ))}
          </div>
          <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={PAGE_SIZE} onChange={setPage} />
        </Card>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Raise a support ticket"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button form="create-ticket-form" type="submit" loading={submitting}>
              Submit
            </Button>
          </>
        }
      >
        <form id="create-ticket-form" onSubmit={handleCreate} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}
          <Input label="Subject" required value={form.subject} onChange={update("subject")} />
          <Select label="Priority" value={form.priority} onChange={update("priority")}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text">
              Message <span className="text-danger">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={update("message")}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-heading outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder="Describe the issue or question..."
            />
          </div>
        </form>
      </Modal>

      {active && (
        <TicketModal
          ticket={active}
          isSuperAdmin={false}
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
