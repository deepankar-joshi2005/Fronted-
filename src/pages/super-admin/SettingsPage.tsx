import { useEffect, useState } from "react";
import * as settingsApi from "../../api/settings.api.js";
import * as hrmsPlanTierApi from "../../api/hrmsPlanTier.api.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Switch from "../../components/ui/Switch.jsx";
import Spinner from "../../components/ui/Spinner.jsx";

function HrmsPlanTiersCard() {
  const [tiers, setTiers] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    hrmsPlanTierApi.listHrmsPlanTiers().then(({ data }) => setTiers(data.data));
  }, []);

  function updateField(id, field) {
    return (e) => setTiers((list) => list.map((t) => (t._id === id ? { ...t, [field]: e.target.value } : t)));
  }

  async function handleSave(tier) {
    setSavingId(tier._id);
    setMessage("");
    try {
      const { data } = await hrmsPlanTierApi.updateHrmsPlanTier(tier._id, {
        name: tier.name,
        minEmployees: Number(tier.minEmployees),
        maxEmployees: tier.maxEmployees === "" || tier.maxEmployees === null ? null : Number(tier.maxEmployees),
        price: Number(tier.price),
      });
      setTiers((list) => list.map((t) => (t._id === tier._id ? data.data : t)));
      setMessage(`${data.data.name} plan updated`);
    } finally {
      setSavingId(null);
    }
  }

  if (!tiers) {
    return (
      <Card className="max-w-3xl p-6">
        <Spinner size={20} />
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl p-6">
      <p className="mb-1 text-base font-semibold text-heading">Business Client HRMS Plans</p>
      <p className="mb-4 text-sm text-text-muted">
        Employee-count-based plans offered when a CA firm onboards a Business Client, and on that client's own HRMS
        billing dashboard.
      </p>
      {message && (
        <div className="mb-4 rounded-lg border border-success/30 bg-success-bg px-3.5 py-2.5 text-sm text-success">{message}</div>
      )}
      <div className="flex flex-col gap-3">
        {tiers.map((tier) => (
          <div key={tier._id} className="grid grid-cols-2 items-end gap-3 rounded-lg border border-border p-3 sm:grid-cols-5">
            <Input label="Name" value={tier.name} onChange={updateField(tier._id, "name")} />
            <Input label="Min employees" type="number" min={1} value={tier.minEmployees} onChange={updateField(tier._id, "minEmployees")} />
            <Input
              label="Max employees"
              type="number"
              min={1}
              value={tier.maxEmployees ?? ""}
              onChange={updateField(tier._id, "maxEmployees")}
              placeholder="Unlimited"
            />
            <Input label="Price / month" type="number" min={0} value={tier.price} onChange={updateField(tier._id, "price")} />
            <Button size="sm" loading={savingId === tier._id} onClick={() => handleSave(tier)}>
              Save
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    settingsApi
      .getSettings()
      .then(({ data }) => setForm(data.data))
      .finally(() => setLoading(false));
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const { data } = await settingsApi.updateSettings({
        platformName: form.platformName,
        supportEmail: form.supportEmail,
        maintenanceMode: form.maintenanceMode,
        defaultTrialDays: Number(form.defaultTrialDays),
        starterPrice: Number(form.starterPrice),
        growthPrice: Number(form.growthPrice),
        enterprisePrice: Number(form.enterprisePrice),
        currency: form.currency,
      });
      setForm(data.data);
      setMessage("Platform settings updated");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">Platform Settings</h1>
        <p className="mt-1 text-sm text-text-muted">Plan limits, pricing and platform-wide defaults.</p>
      </div>

      <Card className="max-w-2xl p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg border border-success/30 bg-success-bg px-3.5 py-2.5 text-sm text-success">
              {message}
            </div>
          )}

          <Input label="Platform name" value={form.platformName} onChange={update("platformName")} />
          <Input label="Support email" type="email" value={form.supportEmail || ""} onChange={update("supportEmail")} />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Default trial length (days)"
              type="number"
              min={0}
              value={form.defaultTrialDays}
              onChange={update("defaultTrialDays")}
            />
            <Input label="Currency" value={form.currency} onChange={update("currency")} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Starter price / month"
              type="number"
              min={0}
              value={form.starterPrice}
              onChange={update("starterPrice")}
            />
            <Input
              label="Growth price / month"
              type="number"
              min={0}
              value={form.growthPrice}
              onChange={update("growthPrice")}
            />
            <Input
              label="Enterprise price / month"
              type="number"
              min={0}
              value={form.enterprisePrice}
              onChange={update("enterprisePrice")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
            <div>
              <p className="text-sm font-medium text-text">Maintenance mode</p>
              <p className="text-xs text-text-muted">Temporarily block firm access while you make changes.</p>
            </div>
            <Switch
              checked={form.maintenanceMode}
              onChange={(checked) => setForm((f) => ({ ...f, maintenanceMode: checked }))}
            />
          </div>

          <Button type="submit" loading={saving} className="w-fit">
            Save changes
          </Button>
        </form>
      </Card>

      <HrmsPlanTiersCard />
    </div>
  );
}
