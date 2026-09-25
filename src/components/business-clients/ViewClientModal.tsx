import { useEffect, useState } from "react";
import * as businessClientApi from "../../api/businessClient.api.js";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Badge from "../ui/Badge.jsx";
import Spinner from "../ui/Spinner.jsx";

const CLIENT_TYPE_LABELS = {
  individual: "Individual",
  proprietorship: "Proprietorship",
  partnership: "Partnership",
  llp: "LLP",
  company: "Company",
  other: "Other",
};
const SERVICE_LABELS = {
  gst: "GST",
  income_tax: "Income Tax",
  tds: "TDS",
  accounting: "Accounting",
  roc_compliance: "ROC Compliance",
  audit: "Audit",
  payroll: "Payroll",
  other: "Other",
};

// Shared by BusinessClientsPage and PayrollManagementPage — always fetches
// fresh (rather than being handed a possibly-stale row from a list) so it can
// also pull this client's employees when relevant.
export default function ViewClientModal({ clientId, onClose }: { clientId: string | null; onClose: () => void }) {
  const [client, setClient] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    setError("");
    businessClientApi
      .getBusinessClient(clientId)
      .then(({ data }) => {
        const c = data.data;
        setClient(c);
        if (c.useHrms === false) {
          return businessClientApi.listClientEmployees(clientId).then(({ data: empData }) => setEmployees(empData.data || []));
        }
        setEmployees([]);
      })
      .catch(() => setError("Could not load this business client"))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (!clientId) return null;

  return (
    <Modal open onClose={onClose} title={client?.name || "Business Client"} size="lg" footer={<Button onClick={onClose}>Close</Button>}>
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size={24} />
        </div>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Business Information</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-text-muted">Client Name</p>
                <p className="text-text">{client.clientName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Client Type</p>
                <p className="text-text">{CLIENT_TYPE_LABELS[client.clientType] || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Industry</p>
                <p className="text-text">{client.industry || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">PAN</p>
                <p className="text-text">{client.pan || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">GSTIN</p>
                <p className="text-text">{client.gstin || "—"}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Primary Contact</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-text-muted">Contact Person</p>
                <p className="text-text">{client.contactPerson || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Mobile</p>
                <p className="text-text">{client.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Email</p>
                <p className="text-text">{client.email || "—"}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Address</p>
            <p className="text-sm text-text">
              {[client.address, client.city, client.state, client.pincode].filter(Boolean).join(", ") || "—"}
            </p>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Services</p>
            {client.services?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {client.services.map((s) => (
                  <Badge key={s} variant="neutral">
                    {SERVICE_LABELS[s] || s}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">—</p>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Client Portal</p>
            <p className="text-sm text-text">HRMS {client.useHrms !== false ? "enabled" : "not enabled"}</p>
          </div>

          {client.useHrms === false && (
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Employees ({employees.length})
              </p>
              {employees.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {employees.map((e) => (
                    <div key={e._id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-text">{e.name}</p>
                        <p className="text-xs text-text-muted">
                          {e.designation || "—"} · {e.employeeCode}
                          {e.dateOfJoining && ` · Joined ${new Date(e.dateOfJoining).toLocaleDateString("en-IN")}`}
                        </p>
                      </div>
                      <p className="shrink-0 pl-3 text-xs text-text-muted">{e.phone || e.email || "—"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">No employees have been added yet.</p>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
