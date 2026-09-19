import { useState } from "react";
import * as supportTicketApi from "../../api/supportTicket.api.js";
import Modal from "../ui/Modal.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Select from "../ui/Select.jsx";

const STATUS_BADGE = { open: "warning", in_progress: "brand", resolved: "success", closed: "neutral" };
const STATUS_LABELS = { open: "Open", in_progress: "In progress", resolved: "Resolved", closed: "Closed" };

export default function TicketModal({ ticket, isSuperAdmin, onClose, onUpdated }) {
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  async function handleReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const { data } = await supportTicketApi.replyToTicket(ticket._id, { text: reply });
      setReply("");
      onUpdated(data.data);
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(e) {
    setStatusSaving(true);
    try {
      const { data } = await supportTicketApi.updateTicketStatus(ticket._id, { status: e.target.value });
      onUpdated(data.data);
    } finally {
      setStatusSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={ticket.subject}
      footer={
        <form id="ticket-reply-form" onSubmit={handleReply} className="flex w-full gap-2">
          <input
            className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-heading outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            placeholder="Write a reply..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <Button type="submit" loading={sending}>
            Send
          </Button>
        </form>
      }
    >
      <div className="mb-4 flex items-center gap-3">
        <Badge variant={STATUS_BADGE[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
        {ticket.caFirmId?.name && <span className="text-xs text-text-muted">{ticket.caFirmId.name}</span>}
        {isSuperAdmin && (
          <div className="ml-auto w-44">
            <Select value={ticket.status} onChange={handleStatusChange} disabled={statusSaving}>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </Select>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {ticket.messages.map((msg, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface-2 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-heading">{msg.fromName}</p>
              <p className="text-[11px] text-text-muted">{new Date(msg.createdAt).toLocaleString()}</p>
            </div>
            <p className="mt-1.5 text-sm text-text">{msg.text}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}
