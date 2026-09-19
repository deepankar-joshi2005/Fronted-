import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus, PiggyBank, ArrowRight, Users } from "lucide-react";
import * as businessClientApi from "../../../api/businessClient.api.js";
import * as financeTrackerApi from "../../../api/financeTracker.api";
import { useAuth } from "../../../hooks/useAuth";
import Card from "../../../components/ui/Card.jsx";
import Input from "../../../components/ui/Input.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Button from "../../../components/ui/Button.jsx";
import Spinner from "../../../components/ui/Spinner.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";

const CLIENT_TYPE_LABELS: Record<string, string> = {
  individual: "Individual",
  proprietorship: "Proprietorship",
  partnership: "Partnership",
  llp: "LLP",
  company: "Company",
  other: "Other",
};

const HEALTH_VARIANT: Record<string, string> = { Excellent: "success", Good: "brand", Moderate: "warning", Stressed: "danger" };

export default function FinanceTrackerPage() {
  const { basePath } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [directoryRes, profilesRes] = await Promise.all([
        businessClientApi.listClientDirectory(),
        financeTrackerApi.listFinanceProfiles(),
      ]);
      setRows(directoryRes.data.data || []);
      setProfiles(profilesRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const profileByClientId = useMemo(() => {
    const map = new Map<string, any>();
    profiles.forEach((p) => {
      if (p.clientId) map.set(String(p.clientId), p);
    });
    return map;
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.gstin, r.pan, r.contactPerson, r.phone, r.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, search]);

  function openNewProfile(prefill?: any) {
    navigate(`${basePath}/finance-tracker/new`, { state: { prefill: prefill || null } });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-heading">Personal Finance Tracker</h1>
          <p className="mt-1 text-sm text-text-muted">
            Track a client's income, loans and expenses — see their financial health, loan eligibility and a savings projection.
          </p>
        </div>
        <Button onClick={() => openNewProfile()}>
          <UserPlus size={16} /> Add new client
        </Button>
      </div>

      {profiles.length > 0 && (
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <PiggyBank size={16} className="text-text-muted" />
            <h2 className="text-lg font-semibold text-heading">Tracked profiles</h2>
            <Badge variant="neutral">{profiles.length}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <button
                key={p._id}
                onClick={() => navigate(`${basePath}/finance-tracker/${p._id}`)}
                className="flex flex-col gap-2 rounded-xl border border-border p-4 text-left transition-colors hover:border-brand hover:bg-brand-soft/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-heading" title={p.name}>
                      {p.name}
                    </p>
                    <p className="truncate text-xs text-text-muted">{p.company || "—"}</p>
                  </div>
                  <Badge variant={HEALTH_VARIANT[p.snapshot?.healthStatus] as any}>{p.snapshot?.healthStatus}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>Income ₹{Math.round(p.snapshot?.monthlyIncome || 0).toLocaleString("en-IN")}/mo</span>
                  <span className="flex items-center gap-1 text-brand">
                    View <ArrowRight size={12} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search by company or client name, GSTIN, PAN..."
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={rows.length === 0 ? "No clients yet" : "No matches"}
          description={
            rows.length === 0
              ? "Business Clients and converted CRM leads will show up here once you have some — or add a brand new client above."
              : "Try a different search term."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => {
            const existingProfile = profileByClientId.get(String(row._id));
            return (
              <Card key={`${row.kind}-${row._id}`} className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-heading" title={row.name}>
                      {row.name}
                    </p>
                    <p className="text-xs text-text-muted">{row.clientType ? CLIENT_TYPE_LABELS[row.clientType] : "Converted lead"}</p>
                  </div>
                  {existingProfile && <Badge variant="success">Tracked</Badge>}
                </div>
                <div className="flex flex-col gap-0.5 text-xs text-text-muted">
                  {row.gstin && <p>GSTIN: {row.gstin}</p>}
                  {row.contactPerson && <p>{row.contactPerson}</p>}
                  {row.phone && <p>{row.phone}</p>}
                </div>
                {existingProfile ? (
                  <Button size="sm" variant="secondary" onClick={() => navigate(`${basePath}/finance-tracker/${existingProfile._id}`)}>
                    <PiggyBank size={14} /> View tracked profile
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() =>
                      openNewProfile({
                        clientModel: row.kind === "business_client" ? "BusinessClient" : "Lead",
                        clientId: row._id,
                        name: row.name,
                        email: row.email,
                        phone: row.phone,
                        gstin: row.gstin,
                      })
                    }
                  >
                    <PiggyBank size={14} /> Track finances
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
