import { useEffect, useState } from "react";
import { Briefcase, CheckCircle2, XCircle } from "lucide-react";
import * as businessClientApi from "../../api/businessClient.api.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";

const SUB_STATUS_BADGE = { PAID: "success", PENDING: "warning", OVERDUE: "danger" };

export default function BusinessClientsPage() {
  const [data, setData] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([businessClientApi.getBusinessClientSummary(), businessClientApi.listAllBusinessClients()])
      .then(([summaryRes, clientsRes]) => {
        setData(summaryRes.data.data);
        setClients(clientsRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

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
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="px-4 py-3 font-semibold text-text-muted">Business Client</th>
                <th className="px-4 py-3 font-semibold text-text-muted">CA Firm</th>
                <th className="px-4 py-3 font-semibold text-text-muted">HRMS Plan</th>
                <th className="px-4 py-3 font-semibold text-text-muted">Status</th>
                <th className="px-4 py-3 font-semibold text-text-muted">Expires</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c._id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-text">{c.name}</td>
                  <td className="px-4 py-3 text-text">{c.caFirmName}</td>
                  <td className="px-4 py-3 text-text">
                    {c.useHrms === false ? <span className="text-text-muted">Excel-based</span> : c.planTier || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {c.useHrms === false ? (
                      <Badge variant={c.isActive ? "success" : "danger"}>{c.isActive ? "Active" : "Suspended"}</Badge>
                    ) : c.subscriptionStatus ? (
                      <Badge variant={SUB_STATUS_BADGE[c.subscriptionStatus] || "neutral"}>{c.subscriptionStatus}</Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-text">
                    {c.subscriptionEndDate ? new Date(c.subscriptionEndDate).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && <p className="px-4 py-8 text-center text-sm text-text-muted">No business clients yet.</p>}
        </div>
      </div>
    </div>
  );
}
