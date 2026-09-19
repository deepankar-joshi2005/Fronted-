import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import * as caFirmApi from "../../api/caFirm.api.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";

const PLAN_BADGE = { trial: "brand", active: "success", suspended: "danger", expired: "neutral" };

export default function FirmSettingsPage() {
  const [firm, setFirm] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    caFirmApi.getMyFirm().then(({ data }) => {
      setFirm(data.data);
      setForm({
        name: data.data.name || "",
        email: data.data.email || "",
        phone: data.data.phone || "",
        icaiRegistrationNumber: data.data.icaiRegistrationNumber || "",
        constitutionType: data.data.constitutionType || "",
        pan: data.data.pan || "",
        gstin: data.data.gstin || "",
        address: {
          line1: data.data.address?.line1 || "",
          city: data.data.address?.city || "",
          state: data.data.address?.state || "",
          pincode: data.data.address?.pincode || "",
          country: data.data.address?.country || "India",
        },
      });
      setLoading(false);
    });
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function updateAddress(field) {
    return (e) => setForm((f) => ({ ...f, address: { ...f.address, [field]: e.target.value } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const { data } = await caFirmApi.updateMyFirm(form);
      setFirm(data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save firm settings");
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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-heading">Firm Settings</h1>
          <p className="mt-1 text-sm text-text-muted">Your firm's profile, registration details, and plan.</p>
        </div>
        <Badge variant={PLAN_BADGE[firm.plan?.status] || "neutral"}>
          {firm.plan?.tier} · {firm.plan?.status}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-base font-semibold text-heading">Firm Profile</h2>
          <Input label="Firm name" required value={form.name} onChange={update("name")} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Firm email" type="email" value={form.email} onChange={update("email")} />
            <Input label="Firm phone" value={form.phone} onChange={update("phone")} />
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-base font-semibold text-heading">Registration &amp; Compliance</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="ICAI registration no. (FRN)"
              value={form.icaiRegistrationNumber}
              onChange={update("icaiRegistrationNumber")}
              placeholder="e.g. 123456C"
            />
            <Select label="Constitution type" value={form.constitutionType} onChange={update("constitutionType")}>
              <option value="">Select type</option>
              <option value="proprietorship">Proprietorship</option>
              <option value="partnership">Partnership</option>
              <option value="llp">LLP</option>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Firm PAN" value={form.pan} onChange={update("pan")} placeholder="ABCDE1234F" maxLength={10} />
            <Input label="GSTIN" value={form.gstin} onChange={update("gstin")} placeholder="Optional" />
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-base font-semibold text-heading">Address</h2>
          <Input label="Address line" value={form.address.line1} onChange={updateAddress("line1")} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="City" value={form.address.city} onChange={updateAddress("city")} />
            <Input label="State" value={form.address.state} onChange={updateAddress("state")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Pincode" value={form.address.pincode} onChange={updateAddress("pincode")} />
            <Input label="Country" value={form.address.country} onChange={updateAddress("country")} />
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>
            <Save size={16} /> Save changes
          </Button>
          {saved && <span className="text-sm font-medium text-success">Saved</span>}
        </div>
      </form>
    </div>
  );
}
