import { useEffect, useState } from "react";
import { Building2, Users, Link2, Copy, Check } from "lucide-react";
import * as businessClientApi from "../../api/businessClient.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import Card from "../../components/ui/Card.jsx";
import Spinner from "../../components/ui/Spinner.jsx";

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Icon size={18} />
      </span>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-lg font-bold text-heading">{value}</p>
      </div>
    </Card>
  );
}

function OnboardingLinkCard() {
  const [form, setFormData] = useState<{ url: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    businessClientApi
      .getMyEmployeeForm()
      .then(({ data }) => setFormData(data.data))
      .finally(() => setLoading(false));
  }, []);

  function copyLink() {
    if (!form) return;
    navigator.clipboard.writeText(form.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading) {
    return (
      <Card className="flex justify-center p-8">
        <Spinner size={22} />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-heading">
          <Link2 size={15} /> Employee onboarding link
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Share this link with your employees. Each employee enters their own Employee ID (from their payslip, or
          told to them by you) to fill in or update their own details — no login, and no shared password, required.
        </p>
      </div>

      {form && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2.5">
          <p className="min-w-0 flex-1 truncate font-mono text-xs text-text">{form.url}</p>
          <button onClick={copyLink} className="text-text-muted hover:text-brand" aria-label="Copy link">
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      )}
    </Card>
  );
}

export default function ClientAdminDashboardPage() {
  const { user } = useAuth();
  const [client, setClient] = useState<any>(null);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([businessClientApi.getMyBusinessClient(), businessClientApi.listMyEmployees()])
      .then(([clientRes, employeesRes]) => {
        setClient(clientRes.data.data);
        setEmployeeCount((employeesRes.data.data || []).length);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">Welcome, {user?.name?.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {client?.name ? <>Managing <strong className="text-text">{client.name}</strong>'s employees.</> : "Manage your company's employees here."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard icon={Building2} label="Company" value={client?.name || "—"} />
        <StatCard icon={Users} label="Employees" value={employeeCount} />
      </div>

      <OnboardingLinkCard />
    </div>
  );
}
