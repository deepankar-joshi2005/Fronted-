import { useEffect, useState } from "react";
import { FileClock } from "lucide-react";
import * as auditLogApi from "../../api/auditLog.api.js";
import Card from "../../components/ui/Card.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";

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

  useEffect(() => {
    auditLogApi
      .listAuditLogs()
      .then(({ data }) => setLogs(data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">Audit Logs</h1>
        <p className="mt-1 text-sm text-text-muted">Every administrative action taken on the platform.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={FileClock} title="No activity yet" description="Administrative actions will show up here." />
      ) : (
        <Card className="divide-y divide-border p-0">
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
        </Card>
      )}
    </div>
  );
}
