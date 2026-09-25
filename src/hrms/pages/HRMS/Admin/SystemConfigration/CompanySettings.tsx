/** @format */

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  MapPin,
  FileText,
  Phone,
  Edit2,
  Save,
  X,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  Stamp,
} from "lucide-react";
import { toast } from "../../Alert/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { isValidEmail, getPhoneNumberError, getGstinError } from "@/utils/validation";

const API_BASE = import.meta.env.VITE_API_URL;
const IMG_BASE = API_BASE.replace("/api", "");

interface CompanyData {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  address?: string;
  city?: string;
  state?: string;
  gstNo?: string;
  logo?: string;
  stamp?: string;
  status?: "Active" | "Inactive";
}

function SectionCard({
  icon: Icon,
  tone,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  tone: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-premium shadow-premium-sm p-5">
      <div className="mb-1 flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in oklab, ${tone} 14%, transparent)` }}
        >
          <Icon className="h-4 w-4" style={{ color: tone }} />
        </div>
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      </div>
      {description && <p className="mb-3 text-xs text-[var(--muted-foreground)]">{description}</p>}
      <div className={description ? "" : "mt-4"}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</span>
      <span className="text-sm font-medium text-[var(--foreground)]">
        {value || <span className="italic text-[var(--muted-foreground)]">—</span>}
      </span>
    </div>
  );
}

function EditField({
  label,
  name,
  value,
  onChange,
  onBlur,
  type = "text",
  required,
  error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  required?: boolean;
  error?: string;
}) {
  const base = cn(
    "mt-1 w-full rounded-lg border bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1",
    error
      ? "border-[var(--status-critical)] focus:border-[var(--status-critical)] focus:ring-[var(--status-critical)]"
      : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]"
  );
  return (
    <div>
      <label className="text-xs font-medium text-[var(--muted-foreground)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--status-critical)]">*</span>}
      </label>
      {type === "textarea" ? (
        <textarea name={name} value={value} onChange={onChange} onBlur={onBlur} rows={3} className={cn(base, "resize-none")} />
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} onBlur={onBlur} className={base} />
      )}
      {error && <p className="mt-1 text-xs text-[var(--status-critical)]">{error}</p>}
    </div>
  );
}

const CompanySettings = () => {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const { user, refreshUser } = useAuth();

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Partial<CompanyData>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const [stampFile, setStampFile] = useState<File | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const stampRef = useRef<HTMLInputElement>(null);

  const fetchCompany = async () => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/companies/${user.companyId}`, { headers });
      setCompany(res.data);
    } catch (err) {
      console.error(err);
      toast({ type: "error", title: "Error", message: "Failed to load company details." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.companyId]);

  const startEdit = () => {
    if (!company) return;
    setForm({ ...company });
    setLogoFile(null);
    setLogoPreview(null);
    setStampFile(null);
    setStampPreview(null);
    setFieldErrors({});
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setLogoFile(null);
    setLogoPreview(null);
    setStampFile(null);
    setStampPreview(null);
    setFieldErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let error = "";
    if (name === "phone") {
      error = getPhoneNumberError(value) || "";
    } else if (name === "email") {
      error = value && !isValidEmail(value) ? "Enter a valid email address" : "";
    } else if (name === "gstNo") {
      error = getGstinError(value) || "";
    }
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleStampFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStampFile(file);
    setStampPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!company) return;

    const newErrors: Record<string, string> = {
      phone: getPhoneNumberError(form.phone || "") || "",
      email: form.email && !isValidEmail(form.email) ? "Enter a valid email address" : "",
      gstNo: getGstinError(form.gstNo || "") || "",
    };
    if (Object.values(newErrors).some(Boolean)) {
      setFieldErrors(newErrors);
      toast({ type: "error", title: "Invalid Details", message: "Please fix the highlighted fields before saving." });
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      delete (payload as any)._id;
      delete (payload as any).logo;
      delete (payload as any).stamp;

      await axios.put(`${API_BASE}/companies/${company._id}`, payload, { headers });

      if (logoFile) {
        const fd = new FormData();
        fd.append("logo", logoFile);
        await axios.put(`${API_BASE}/companies/${company._id}/logo`, fd, { headers });
      }

      if (stampFile) {
        const fd = new FormData();
        fd.append("stamp", stampFile);
        await axios.put(`${API_BASE}/companies/${company._id}/stamp`, fd, { headers });
      }

      toast({ type: "success", title: "Saved", message: "Company details updated successfully." });
      await fetchCompany();
      await refreshUser();
      cancelEdit();
    } catch (err: any) {
      toast({
        type: "error",
        title: "Save Failed",
        message: err?.response?.data?.message || "Could not save changes.",
      });
    } finally {
      setSaving(false);
    }
  };

  const logoSrc = logoPreview || (company?.logo ? `${IMG_BASE}${company.logo}` : null);
  const stampSrc = stampPreview || (company?.stamp ? `${IMG_BASE}${company.stamp}` : null);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-[var(--muted-foreground)]">
        No company data found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">My Company</h1>
          <p className="text-sm text-[var(--muted-foreground)]">System Configuration &gt; Company Settings</p>
        </div>
        {!editing ? (
          <button
            onClick={startEdit}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
          >
            <Edit2 className="h-4 w-4" /> Edit Details
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[var(--status-good)] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* IDENTITY CARD */}
      <div className="card-premium shadow-premium-sm flex flex-wrap items-center gap-6 border-l-4 border-l-[var(--primary)] p-6">
        <div className="shrink-0">
          {logoSrc ? (
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-2 border-[var(--primary)]/20 bg-white shadow-sm">
              <img src={logoSrc} alt="Company Logo" className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <div className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]">
              <ImageIcon className="h-7 w-7" />
              <span className="text-[10px] font-medium">No Logo</span>
            </div>
          )}
          {editing && (
            <div className="mt-2 text-center">
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="mx-auto flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
              >
                <Upload className="h-3 w-3" />
                {company.logo ? "Replace Logo" : "Upload Logo"}
              </button>
              {logoFile && <p className="mt-0.5 text-[10px] text-[var(--status-good)]">{logoFile.name}</p>}
            </div>
          )}
          <p className="mt-1 max-w-[6rem] text-center text-[10px] text-[var(--muted-foreground)]">
            Shown at the top of the sidebar
          </p>
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <EditField label="Company Name" name="name" value={form.name || ""} onChange={handleChange} required />
              <EditField label="Industry" name="industry" value={form.industry || ""} onChange={handleChange} required />
            </div>
          ) : (
            <div>
              <h2 className="truncate text-xl font-bold text-[var(--foreground)]">{company.name}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {company.industry && (
                  <span className="rounded-full bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[var(--primary)]">
                    {company.industry}
                  </span>
                )}
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    company.status !== "Inactive"
                      ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                      : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                  )}
                >
                  {company.status !== "Inactive" ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTACT + LOCATION */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SectionCard icon={Phone} tone="var(--primary)" title="Contact Information">
          {editing ? (
            <div className="space-y-3">
              <EditField
                label="Phone"
                name="phone"
                type="tel"
                value={form.phone || ""}
                onChange={handleChange}
                onBlur={handleFieldBlur}
                required
                error={fieldErrors.phone}
              />
              <EditField
                label="Email"
                name="email"
                type="email"
                value={form.email || ""}
                onChange={handleChange}
                onBlur={handleFieldBlur}
                required
                error={fieldErrors.email}
              />
              <EditField label="Website" name="website" value={form.website || ""} onChange={handleChange} />
            </div>
          ) : (
            <div className="space-y-3">
              <InfoRow label="Phone" value={company.phone} />
              <InfoRow label="Email" value={company.email} />
              <InfoRow label="Website" value={company.website} />
            </div>
          )}
        </SectionCard>

        <SectionCard icon={MapPin} tone="var(--status-good)" title="Location">
          {editing ? (
            <div className="space-y-3">
              <EditField label="Address" name="address" type="textarea" value={form.address || ""} onChange={handleChange} required />
              <div className="grid grid-cols-2 gap-3">
                <EditField label="City" name="city" value={form.city || ""} onChange={handleChange} required />
                <EditField label="State" name="state" value={form.state || ""} onChange={handleChange} required />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <InfoRow label="Address" value={company.address} />
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="City" value={company.city} />
                <InfoRow label="State" value={company.state} />
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* LEGAL INFORMATION */}
      <SectionCard icon={FileText} tone="#7C3AED" title="Legal Information">
        {editing ? (
          <EditField
            label="GST Number"
            name="gstNo"
            value={form.gstNo || ""}
            onChange={handleChange}
            onBlur={handleFieldBlur}
            error={fieldErrors.gstNo}
          />
        ) : (
          <InfoRow label="GST Number" value={company.gstNo} />
        )}
      </SectionCard>

      {/* COMPANY STAMP */}
      <SectionCard
        icon={Stamp}
        tone="var(--status-warning)"
        title="Company Stamp / Seal"
        description='Printed at the bottom of every employee payslip PDF.'
      >
        <div className="flex items-center gap-4">
          {stampSrc ? (
            <div className="flex h-24 w-32 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted)] shadow-sm">
              <img src={stampSrc} alt="Company Stamp" className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <div className="flex h-24 w-32 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[var(--status-warning)]/40 bg-[color-mix(in_oklab,var(--status-warning)_8%,transparent)] text-[var(--status-warning)]">
              <ImageIcon className="h-6 w-6" />
              <span className="text-[10px] font-medium">No Stamp</span>
            </div>
          )}

          {editing ? (
            <div>
              <input ref={stampRef} type="file" accept="image/*" className="hidden" onChange={handleStampFile} />
              <button
                type="button"
                onClick={() => stampRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--status-warning)]/40 px-3 py-1.5 text-xs font-medium text-[var(--status-warning)] transition-colors hover:bg-[color-mix(in_oklab,var(--status-warning)_10%,transparent)]"
              >
                <Upload className="h-3.5 w-3.5" />
                {company.stamp ? "Replace Stamp" : "Upload Stamp"}
              </button>
              {stampFile && <p className="mt-1.5 text-[10px] text-[var(--status-good)]">{stampFile.name}</p>}
            </div>
          ) : stampSrc ? (
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--status-good)]">
                <CheckCircle2 className="h-4 w-4" /> Stamp uploaded
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">Click "Edit Details" to replace the stamp.</p>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              No stamp uploaded yet.
              <br />
              <span className="font-medium text-[var(--primary)]">Click "Edit Details" to upload your company stamp.</span>
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default CompanySettings;
