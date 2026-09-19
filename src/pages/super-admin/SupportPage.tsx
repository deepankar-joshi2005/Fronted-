import { useEffect, useState } from "react";
import { LifeBuoy } from "lucide-react";
import * as supportTicketApi from "../../api/supportTicket.api.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Select from "../../components/ui/Select.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import TicketModal from "../../components/support/TicketModal.jsx";

const STATUS_BADGE = { open: "warning", in_progress: "brand", resolved: "success", closed: "neutral" };
const STATUS_LABELS = { open: "Open", in_progress: "In progress", resolved: "Resolved", closed: "Closed" };

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [active, setActive] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await supportTicketApi.listTickets(params);
      setTickets(data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-heading">Support</h1>
          <p className="mt-1 text-sm text-text-muted">Escalations and queries raised by CA firms.</p>
        </div>
        <div className="w-full sm:w-52">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets" description="No CA firm has raised a support request yet." />
      ) : (
        <Card className="divide-y divide-border p-0">
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
