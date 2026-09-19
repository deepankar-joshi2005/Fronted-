import { Building2 } from "lucide-react";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";

const CLIENT_TYPE_LABELS: Record<string, string> = {
  individual: "Individual",
  proprietorship: "Proprietorship",
  partnership: "Partnership",
  llp: "LLP",
  company: "Company",
  other: "Other",
};

// Shown at the top of the payroll & salary-structure pages so the CA can
// confirm at a glance that this is the right client before running payroll.
export default function ClientIdentityCard({ client }: { client: any }) {
  if (!client) return null;

  const details = [
    client.clientType && CLIENT_TYPE_LABELS[client.clientType],
    client.gstin && `GSTIN: ${client.gstin}`,
    client.pan && `PAN: ${client.pan}`,
    client.contactPerson,
    client.phone,
  ].filter(Boolean);

  return (
    <Card className="flex flex-wrap items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Building2 size={18} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-heading">{client.name}</p>
          {!client.gstin && !client.pan && (
            <Badge variant="neutral">No GSTIN/PAN on file</Badge>
          )}
        </div>
        {details.length > 0 && (
          <p className="text-sm text-text-muted">{details.join(" · ")}</p>
        )}
      </div>
    </Card>
  );
}
