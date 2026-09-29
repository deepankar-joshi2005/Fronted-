import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  Plus,
  Trash2,
  Pencil,
  Wallet,
  TrendingDown,
  TrendingUp,
  Landmark,
  Activity,
  Banknote,
  Download,
  Send,
  PieChart as PieChartIcon,
} from "lucide-react";
import * as financeTrackerApi from "../../../api/financeTracker.api";
import { useAuth } from "../../../hooks/useAuth";
import { CHART_COLORS } from "../../../utils/chartColors.js";
import { sanitizePhone, sanitizeGstin, validatePhone, validateGstin, validateEmail } from "../../../utils/validators.js";
import Card from "../../../components/ui/Card.jsx";
import Input from "../../../components/ui/Input.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Button from "../../../components/ui/Button.jsx";
import Switch from "../../../components/ui/Switch.jsx";
import Spinner from "../../../components/ui/Spinner.jsx";
import ChartTooltip from "../../../components/ui/ChartTooltip.jsx";
import DonutChart from "../../../components/ui/DonutChart.jsx";

const STEPS = ["Personal", "Professional & Income", "Current Loans", "Monthly Expenses", "Savings"];
const CONTACT_SANITIZERS: Record<string, (v: string) => string> = {
  phone: sanitizePhone,
  gstin: sanitizeGstin,
};
const CONTACT_VALIDATORS: Record<string, (v: string) => string> = {
  email: (v) => validateEmail(v, false),
  phone: (v) => validatePhone(v, false),
  gstin: (v) => validateGstin(v, false),
};
const HEALTH_VARIANT: Record<string, string> = { Excellent: "success", Good: "brand", Moderate: "warning", Stressed: "danger" };
const HEALTH_ICON_STYLE: Record<string, string> = {
  success: "bg-success-bg text-success",
  brand: "bg-brand-soft text-brand",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
};
const PIE_COLOR_CYCLE = [
  CHART_COLORS.brand,
  CHART_COLORS.teal,
  CHART_COLORS.gold,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
];
const EXPENSE_FIELDS: [string, string][] = [
  ["rent", "Rent"],
  ["groceries", "Groceries / Household"],
  ["utilities", "Utilities (electricity, water, internet)"],
  ["transportation", "Transportation"],
  ["insurance", "Insurance Premiums"],
  ["education", "Education"],
  ["entertainment", "Entertainment / Lifestyle"],
  ["other", "Other Expenses"],
];

function rupee(v: number) {
  return `₹${Math.round(v || 0).toLocaleString("en-IN")}`;
}

// jsPDF's built-in fonts only support WinAnsi encoding, which has no glyph for
// the ₹ sign — it silently renders as a garbled "¹". "Rs." is plain ASCII, so
// it's safe in any PDF font; used only for the exported report, never on-screen.
function pdfRupee(v: number) {
  return `Rs. ${Math.round(v || 0).toLocaleString("en-IN")}`;
}

type RGB = [number, number, number];
const PDF_COLORS: Record<string, RGB> = {
  brand: [36, 82, 201],
  brandSoft: [232, 237, 255],
  teal: [13, 148, 136],
  tealSoft: [227, 246, 244],
  success: [22, 163, 74],
  successSoft: [220, 252, 231],
  warning: [217, 119, 6],
  warningSoft: [254, 243, 199],
  danger: [220, 38, 38],
  dangerSoft: [254, 226, 226],
  heading: [14, 20, 36],
  muted: [91, 107, 133],
  white: [255, 255, 255],
};
const PDF_HEALTH_COLOR: Record<string, RGB> = {
  Excellent: PDF_COLORS.success,
  Good: PDF_COLORS.brand,
  Moderate: PDF_COLORS.warning,
  Stressed: PDF_COLORS.danger,
};
const PDF_PIE_CYCLE: RGB[] = [PDF_COLORS.brand, PDF_COLORS.teal, PDF_COLORS.success, PDF_COLORS.warning, PDF_COLORS.danger];

// Chart Y-axis needs a short label — full Indian-format rupee strings (e.g.
// ₹81,31,868) don't fit in the tick column width.
function compactRupee(v: number) {
  const n = Math.round(v || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${Math.round(n / 1000)}k`;
  return `₹${n}`;
}

function emptyForm(prefill?: any) {
  return {
    clientModel: prefill?.clientModel || null,
    clientId: prefill?.clientId || null,
    name: prefill?.name || "",
    email: prefill?.email || "",
    phone: prefill?.phone || "",
    gstin: prefill?.gstin || "",
    company: "",
    designation: "",
    experienceYears: "",
    monthlyIncome: "",
    homeLoan: { active: false, emi: "" },
    carLoan: { active: false, emi: "" },
    personalLoan: { active: false, emi: "" },
    otherLoans: [] as { name: string; emi: string }[],
    expenses: { rent: "", groceries: "", utilities: "", transportation: "", insurance: "", education: "", entertainment: "", other: "" },
    currentMonthlySavings: "",
  };
}

function fromProfile(p: any) {
  return {
    clientModel: p.clientModel || null,
    clientId: p.clientId || null,
    name: p.name || "",
    email: p.email || "",
    phone: p.phone || "",
    gstin: p.gstin || "",
    company: p.company || "",
    designation: p.designation || "",
    experienceYears: p.experienceYears ?? "",
    monthlyIncome: p.monthlyIncome ?? "",
    homeLoan: { active: !!p.homeLoan?.active, emi: p.homeLoan?.emi ?? "" },
    carLoan: { active: !!p.carLoan?.active, emi: p.carLoan?.emi ?? "" },
    personalLoan: { active: !!p.personalLoan?.active, emi: p.personalLoan?.emi ?? "" },
    otherLoans: (p.otherLoans || []).map((l: any) => ({ name: l.name, emi: l.emi ?? "" })),
    expenses: {
      rent: p.expenses?.rent ?? "",
      groceries: p.expenses?.groceries ?? "",
      utilities: p.expenses?.utilities ?? "",
      transportation: p.expenses?.transportation ?? "",
      insurance: p.expenses?.insurance ?? "",
      education: p.expenses?.education ?? "",
      entertainment: p.expenses?.entertainment ?? "",
      other: p.expenses?.other ?? "",
    },
    currentMonthlySavings: p.currentMonthlySavings ?? "",
  };
}

function toPayload(form: ReturnType<typeof emptyForm>) {
  const num = (v: any) => (v === "" || v === null || v === undefined ? 0 : Number(v));
  return {
    clientModel: form.clientModel,
    clientId: form.clientId,
    name: form.name,
    email: form.email,
    phone: form.phone,
    gstin: form.gstin,
    company: form.company,
    designation: form.designation,
    experienceYears: num(form.experienceYears),
    monthlyIncome: num(form.monthlyIncome),
    homeLoan: { active: form.homeLoan.active, emi: num(form.homeLoan.emi) },
    carLoan: { active: form.carLoan.active, emi: num(form.carLoan.emi) },
    personalLoan: { active: form.personalLoan.active, emi: num(form.personalLoan.emi) },
    otherLoans: form.otherLoans.filter((l) => l.name.trim()).map((l) => ({ name: l.name, emi: num(l.emi) })),
    expenses: Object.fromEntries(Object.entries(form.expenses).map(([k, v]) => [k, num(v)])),
    currentMonthlySavings: num(form.currentMonthlySavings),
  };
}

function StatCard({ icon: Icon, label, value, sub, accentBg, accentText, barColor }: any) {
  return (
    <Card className="relative overflow-hidden p-5">
      {barColor && <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: barColor }} />}
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentBg} ${accentText}`}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-2xl font-bold text-heading">{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
      {sub && <p className="mt-1 text-xs text-text-muted">{sub}</p>}
    </Card>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              i === current ? "bg-brand text-white" : i < current ? "bg-success-bg text-success" : "bg-surface-2 text-text-muted"
            }`}
          >
            {i < current ? <Check size={14} /> : i + 1}
          </div>
          <span className={`text-sm ${i === current ? "font-medium text-text" : "text-text-muted"}`}>{label}</span>
          {i < STEPS.length - 1 && <div className="h-px w-6 bg-border" />}
        </div>
      ))}
    </div>
  );
}

export default function ClientFinanceWorkspacePage() {
  const { profileId } = useParams();
  const location = useLocation();
  const { basePath } = useAuth();
  const navigate = useNavigate();
  const isNew = profileId === "new";

  const [mode, setMode] = useState<"wizard" | "dashboard">(isNew ? "wizard" : "dashboard");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => emptyForm((location.state as any)?.prefill));
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [annualRate, setAnnualRate] = useState("10.5");
  const [tenureMonths, setTenureMonths] = useState("60");
  const [eligibility, setEligibility] = useState<any>(null);
  const [eligLoading, setEligLoading] = useState(false);

  const [contribution, setContribution] = useState("");
  const [returnRate, setReturnRate] = useState("12");
  const [projections, setProjections] = useState<any[]>([]);
  const [projLoading, setProjLoading] = useState(false);

  const [sendNotice, setSendNotice] = useState(false);

  async function loadProfile(rate: string, tenure: string) {
    if (profileId === "new") return;
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await financeTrackerApi.getFinanceProfile(profileId!, { annualRate: Number(rate), tenureMonths: Number(tenure) });
      setProfile(data.data);
      setEligibility(data.data.eligibility);
      setProjections(data.data.projections);
      setContribution(String(Math.max(0, Math.round(data.data.snapshot.surplus)) || data.data.currentMonthlySavings || 0));
    } catch (err: any) {
      setProfile(null);
      setLoadError(err.response?.data?.message || "Could not load this finance profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile(annualRate, tenureMonths);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  async function handleRecalcEligibility() {
    setEligLoading(true);
    try {
      const { data } = await financeTrackerApi.getFinanceProfile(profileId!, { annualRate: Number(annualRate), tenureMonths: Number(tenureMonths) });
      setEligibility(data.data.eligibility);
    } finally {
      setEligLoading(false);
    }
  }

  async function handleRecalcProjection() {
    setProjLoading(true);
    try {
      const { data } = await financeTrackerApi.computeFinanceProjection(profileId!, {
        monthlyContribution: Number(contribution) || 0,
        annualReturnPercent: Number(returnRate) || 0,
      });
      setProjections(data.data.projections);
    } finally {
      setProjLoading(false);
    }
  }

  function startEdit() {
    setForm(fromProfile(profile));
    setStep(0);
    setError("");
    setFieldErrors({});
    setMode("wizard");
  }

  function updateContactField(field: string, raw: string) {
    const sanitizer = CONTACT_SANITIZERS[field];
    const value = sanitizer ? sanitizer(raw) : raw;
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((fe) =>
      field in fe ? { ...fe, [field]: CONTACT_VALIDATORS[field] ? CONTACT_VALIDATORS[field](value) : "" } : fe
    );
  }
  function handleContactBlur(field: string) {
    return () => {
      if (!CONTACT_VALIDATORS[field]) return;
      setFieldErrors((fe) => ({ ...fe, [field]: CONTACT_VALIDATORS[field]((form as any)[field] || "") }));
    };
  }
  function validateContactStep(): boolean {
    const errors: Record<string, string> = {};
    for (const field of Object.keys(CONTACT_VALIDATORS)) {
      const msg = CONTACT_VALIDATORS[field]((form as any)[field] || "");
      if (msg) errors[field] = msg;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the highlighted fields");
      return false;
    }
    return true;
  }

  function setLoan(key: "homeLoan" | "carLoan" | "personalLoan", patch: any) {
    setForm((f) => ({ ...f, [key]: { ...f[key], ...patch } }));
  }
  function setExpense(key: string, value: string) {
    setForm((f) => ({ ...f, expenses: { ...f.expenses, [key]: value } }));
  }
  function setOtherLoan(index: number, patch: any) {
    setForm((f) => ({ ...f, otherLoans: f.otherLoans.map((l, i) => (i === index ? { ...l, ...patch } : l)) }));
  }
  function addOtherLoan() {
    setForm((f) => ({ ...f, otherLoans: [...f.otherLoans, { name: "", emi: "" }] }));
  }
  function removeOtherLoan(index: number) {
    setForm((f) => ({ ...f, otherLoans: f.otherLoans.filter((_, i) => i !== index) }));
  }

  function goNext() {
    if (step === 0 && !form.name.trim()) {
      setError("Name is required");
      return;
    }
    if (step === 0 && !validateContactStep()) {
      return;
    }
    if (step === 1 && form.monthlyIncome === "") {
      setError("Monthly income is required");
      return;
    }
    setError("");
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Name is required");
      setStep(0);
      return;
    }
    if (!validateContactStep()) {
      setStep(0);
      return;
    }
    if (form.monthlyIncome === "") {
      setError("Monthly income is required");
      setStep(1);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = toPayload(form);
      if (isNew) {
        const { data } = await financeTrackerApi.createFinanceProfile(payload);
        setMode("dashboard");
        navigate(`${basePath}/finance-tracker/${data.data._id}`, { replace: true });
      } else {
        await financeTrackerApi.updateFinanceProfile(profileId!, payload);
        setMode("dashboard");
        await loadProfile(annualRate, tenureMonths);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save this profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  if (!isNew && (loadError || !profile)) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-text-muted">{loadError || "This finance profile could not be found."}</p>
        <Link to={`${basePath}/finance-tracker`}>
          <Button variant="secondary" size="sm">
            <ArrowLeft size={15} /> Back to Personal Finance Tracker
          </Button>
        </Link>
      </div>
    );
  }

  const backLink = (
    <Link to={`${basePath}/finance-tracker`} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-2 hover:text-text">
      <ArrowLeft size={18} />
    </Link>
  );

  if (mode === "wizard") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          {backLink}
          <div>
            <h1 className="text-2xl font-bold text-heading">{isNew ? "Track a new client" : `Editing — ${profile?.name}`}</h1>
            <p className="mt-1 text-sm text-text-muted">Step-by-step: their details are saved once, and stay editable later.</p>
          </div>
        </div>

        <Card className="p-4 sm:p-5">
          <StepIndicator current={step} />
        </Card>

        {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}

        <Card className="p-5 sm:p-6">
          {step === 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Full Name" required value={form.name} onChange={(e: any) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e: any) => updateContactField("email", e.target.value)}
                onBlur={handleContactBlur("email")}
                error={fieldErrors.email}
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e: any) => updateContactField("phone", e.target.value)}
                onBlur={handleContactBlur("phone")}
                error={fieldErrors.phone}
                placeholder="10-digit mobile number"
                inputMode="numeric"
                maxLength={10}
              />
              <Input
                label="GSTIN"
                value={form.gstin}
                onChange={(e: any) => updateContactField("gstin", e.target.value)}
                onBlur={handleContactBlur("gstin")}
                error={fieldErrors.gstin}
                placeholder="22ABCDE1234F1Z5"
                maxLength={15}
              />
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Company Name" value={form.company} onChange={(e: any) => setForm((f) => ({ ...f, company: e.target.value }))} />
              <Input label="Designation" value={form.designation} onChange={(e: any) => setForm((f) => ({ ...f, designation: e.target.value }))} />
              <Input
                label="Experience (years)"
                type="number"
                value={form.experienceYears}
                onChange={(e: any) => setForm((f) => ({ ...f, experienceYears: e.target.value }))}
              />
              <Input
                label="Monthly Income"
                required
                type="number"
                value={form.monthlyIncome}
                onChange={(e: any) => setForm((f) => ({ ...f, monthlyIncome: e.target.value }))}
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              {(
                [
                  ["homeLoan", "Home Loan"],
                  ["carLoan", "Car Loan"],
                  ["personalLoan", "Personal Loan"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text">{label}</p>
                      <p className="text-xs text-text-muted">Currently running?</p>
                    </div>
                    <Switch checked={form[key].active} onChange={(v) => setLoan(key, { active: v })} />
                  </div>
                  {form[key].active && (
                    <div className="mt-3">
                      <Input label="Monthly EMI" type="number" value={form[key].emi} onChange={(e: any) => setLoan(key, { emi: e.target.value })} />
                    </div>
                  )}
                </div>
              ))}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Other loans</p>
                <div className="flex flex-col gap-2">
                  {form.otherLoans.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input placeholder="Loan name" value={l.name} onChange={(e: any) => setOtherLoan(i, { name: e.target.value })} />
                      <Input placeholder="EMI" type="number" value={l.emi} onChange={(e: any) => setOtherLoan(i, { emi: e.target.value })} />
                      <Button variant="ghost" size="sm" onClick={() => removeOtherLoan(i)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                  <div>
                    <Button variant="secondary" size="sm" onClick={addOtherLoan}>
                      <Plus size={14} /> Add another loan
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {EXPENSE_FIELDS.map(([key, label]) => (
                <Input
                  key={key}
                  label={label}
                  type="number"
                  value={(form.expenses as any)[key]}
                  onChange={(e: any) => setExpense(key, e.target.value)}
                />
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-3">
              <Input
                label="Current Monthly Savings / Investment (optional)"
                type="number"
                value={form.currentMonthlySavings}
                onChange={(e: any) => setForm((f) => ({ ...f, currentMonthlySavings: e.target.value }))}
              />
              <p className="text-sm text-text-muted">Used as the starting point for the investment projection on the dashboard.</p>
            </div>
          )}
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ChevronLeft size={15} /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={goNext}>
              Next <ChevronRight size={15} />
            </Button>
          ) : (
            <Button onClick={handleSave} loading={saving}>
              <Save size={15} /> Save & view dashboard
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Dashboard mode ─────────────────────────────────────────────────────────
  const snapshot = profile.snapshot;
  const surplusPositive = snapshot.surplus >= 0;

  const chartData = projections.map((p: any) => ({ label: `${p.years}yr`, value: p.value }));

  const incomeAllocation = [
    { label: "Expenses", value: Math.round(snapshot.totalExpenses), color: CHART_COLORS.danger },
    { label: "EMI Obligations", value: Math.round(snapshot.totalEmi), color: CHART_COLORS.warning },
    ...(surplusPositive ? [{ label: "Surplus / Savings", value: Math.round(snapshot.surplus), color: CHART_COLORS.success }] : []),
  ].filter((d) => d.value > 0);

  const expenseBreakdown = EXPENSE_FIELDS.map(([key, label]) => ({
    label,
    value: Math.round(profile.expenses?.[key] || 0),
  }))
    .filter((d) => d.value > 0)
    // Colors are assigned after filtering, not by each field's fixed position —
    // otherwise a zeroed-out category (e.g. Insurance) shifts every later
    // category onto the wrong color and two visible slices can end up sharing one.
    .map((d, i) => ({ ...d, color: PIE_COLOR_CYCLE[i % PIE_COLOR_CYCLE.length] }));

  function handleSendReport() {
    setSendNotice(true);
    window.setTimeout(() => setSendNotice(false), 5000);
  }

  function exportReportPdf() {
    const doc = new jsPDF();
    const marginX = 14;
    const rightEdge = 196;
    const pageWidth = 210;
    const pageBottom = 283;
    let y = 40;

    function ensureSpace(next = 7) {
      if (y + next > pageBottom) {
        doc.addPage();
        y = 20;
      }
    }
    function fill(c: RGB) {
      doc.setFillColor(c[0], c[1], c[2]);
    }
    function textColor(c: RGB) {
      doc.setTextColor(c[0], c[1], c[2]);
    }

    function heading(text: string, color: RGB = PDF_COLORS.brand) {
      ensureSpace(15);
      fill(color);
      doc.rect(marginX, y - 3.6, 3, 4.6, "F");
      doc.setFontSize(12.5);
      doc.setFont("helvetica", "bold");
      textColor(color);
      doc.text(text, marginX + 6, y);
      doc.setDrawColor(225, 227, 235);
      doc.setLineWidth(0.2);
      doc.line(marginX, y + 3, rightEdge, y + 3);
      doc.setFont("helvetica", "normal");
      y += 8;
    }
    function row(label: string, value: string) {
      ensureSpace(6);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      textColor(PDF_COLORS.muted);
      doc.text(label, marginX + 2, y);
      doc.setFont("helvetica", "bold");
      textColor(PDF_COLORS.heading);
      doc.text(value, rightEdge, y, { align: "right" });
      y += 6;
    }
    function dotRow(label: string, value: string, color: RGB) {
      ensureSpace(6);
      fill(color);
      doc.circle(marginX + 1.2, y - 1.6, 1.2, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      textColor(PDF_COLORS.muted);
      doc.text(label, marginX + 6, y);
      doc.setFont("helvetica", "bold");
      textColor(PDF_COLORS.heading);
      doc.text(value, rightEdge, y, { align: "right" });
      y += 6;
    }
    function paragraph(text: string) {
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      textColor(PDF_COLORS.muted);
      doc.splitTextToSize(text, rightEdge - marginX - 2).forEach((l: string) => {
        ensureSpace(5);
        doc.text(l, marginX + 2, y);
        y += 5;
      });
    }
    function statBox(x: number, boxY: number, w: number, h: number, label: string, value: string, color: RGB, soft: RGB) {
      fill(soft);
      doc.roundedRect(x, boxY, w, h, 2.2, 2.2, "F");
      fill(color);
      doc.roundedRect(x, boxY, w, 1.8, 2.2, 2.2, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      textColor(PDF_COLORS.muted);
      doc.text(label, x + 4, boxY + 9);
      doc.setFontSize(12.5);
      doc.setFont("helvetica", "bold");
      textColor(PDF_COLORS.heading);
      doc.text(value, x + 4, boxY + 17);
    }

    // ── Header band ──
    fill(PDF_COLORS.brand);
    doc.rect(0, 0, pageWidth, 32, "F");
    textColor(PDF_COLORS.white);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(profile.name || "Client", marginX, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const subtitle = [profile.company, profile.designation].filter(Boolean).join(" · ");
    if (subtitle) doc.text(subtitle, marginX, 21);
    doc.setFontSize(9);
    doc.text(`Personal Finance Report  ·  generated ${new Date().toLocaleDateString("en-IN")}`, marginX, subtitle ? 26.5 : 22);

    // ── Snapshot stat boxes ──
    const boxGap = 4;
    const boxW = (rightEdge - marginX - boxGap * 3) / 4;
    const boxH = 19;
    const boxY = 37;
    statBox(marginX, boxY, boxW, boxH, "Monthly Income", pdfRupee(snapshot.monthlyIncome), PDF_COLORS.brand, PDF_COLORS.brandSoft);
    statBox(marginX + boxW + boxGap, boxY, boxW, boxH, "Total Expenses", pdfRupee(snapshot.totalExpenses), PDF_COLORS.danger, PDF_COLORS.dangerSoft);
    statBox(marginX + (boxW + boxGap) * 2, boxY, boxW, boxH, "Total EMI", pdfRupee(snapshot.totalEmi), PDF_COLORS.warning, PDF_COLORS.warningSoft);
    statBox(
      marginX + (boxW + boxGap) * 3,
      boxY,
      boxW,
      boxH,
      surplusPositive ? "Monthly Surplus" : "Monthly Deficit",
      pdfRupee(Math.abs(snapshot.surplus)),
      surplusPositive ? PDF_COLORS.success : PDF_COLORS.danger,
      surplusPositive ? PDF_COLORS.successSoft : PDF_COLORS.dangerSoft
    );
    y = boxY + boxH + 7;

    // ── Financial health ──
    const healthColor = PDF_HEALTH_COLOR[snapshot.healthStatus] || PDF_COLORS.brand;
    heading("Financial Health", healthColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const pillW = doc.getTextWidth(snapshot.healthStatus) + 8;
    fill(healthColor);
    doc.roundedRect(rightEdge - pillW, y - 9.5, pillW, 6.5, 3.2, 3.2, "F");
    textColor(PDF_COLORS.white);
    doc.text(snapshot.healthStatus, rightEdge - pillW / 2, y - 5.3, { align: "center" });
    paragraph(snapshot.healthMessage);
    row("FOIR (obligations ÷ income)", `${snapshot.foir}%`);
    row("Savings rate", `${snapshot.savingsRate}%`);
    y += 2;

    // ── Loan eligibility ──
    heading("Loan Eligibility", PDF_COLORS.teal);
    row("Assumed rate", `${annualRate}% p.a.`);
    row("Tenure", `${tenureMonths} months`);
    y += 1;
    ensureSpace(boxH + 2);
    const halfGap = 4;
    const halfW = (rightEdge - marginX - halfGap) / 2;
    statBox(marginX, y, halfW, boxH, "Additional EMI capacity", `${pdfRupee(eligibility?.additionalEmiCapacity)}/mo`, PDF_COLORS.teal, PDF_COLORS.tealSoft);
    statBox(marginX + halfW + halfGap, y, halfW, boxH, "Max eligible new loan", pdfRupee(eligibility?.maxEligibleLoan), PDF_COLORS.teal, PDF_COLORS.tealSoft);
    y += boxH + 6;
    if (snapshot.foir < 20 && snapshot.savingsRate > 20) {
      ensureSpace(10);
      fill(PDF_COLORS.successSoft);
      doc.roundedRect(marginX, y - 4.5, rightEdge - marginX, 9, 2, 2, "F");
      textColor(PDF_COLORS.success);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc
        .splitTextToSize("Low existing debt and healthy savings — well placed to invest more, or take on a new loan.", rightEdge - marginX - 6)
        .forEach((l: string, i: number) => doc.text(l, marginX + 3, y + i * 4));
      y += 9;
    }

    // ── Investment projection ──
    heading("Investment Projection", PDF_COLORS.success);
    row("Monthly contribution", pdfRupee(Number(contribution) || 0));
    row("Assumed return", `${returnRate}% p.a.`);
    y += 1;
    projections.forEach((p: any) => dotRow(`In ${p.years} year${p.years > 1 ? "s" : ""}`, pdfRupee(p.value), PDF_COLORS.success));
    y += 2;

    // ── Loans ──
    heading("Loans", PDF_COLORS.brand);
    let hasLoan = false;
    if (profile.homeLoan?.active) {
      dotRow("Home Loan", `${pdfRupee(profile.homeLoan.emi)}/mo`, PDF_COLORS.brand);
      hasLoan = true;
    }
    if (profile.carLoan?.active) {
      dotRow("Car Loan", `${pdfRupee(profile.carLoan.emi)}/mo`, PDF_COLORS.teal);
      hasLoan = true;
    }
    if (profile.personalLoan?.active) {
      dotRow("Personal Loan", `${pdfRupee(profile.personalLoan.emi)}/mo`, PDF_COLORS.warning);
      hasLoan = true;
    }
    (profile.otherLoans || []).forEach((l: any, i: number) => {
      dotRow(l.name, `${pdfRupee(l.emi)}/mo`, PDF_PIE_CYCLE[i % PDF_PIE_CYCLE.length]);
      hasLoan = true;
    });
    if (!hasLoan) paragraph("No active loans on file.");
    y += 2;

    // ── Monthly expenses ──
    heading("Monthly Expenses", PDF_COLORS.danger);
    EXPENSE_FIELDS.forEach(([key, label], i) => dotRow(label, pdfRupee(profile.expenses?.[key]), PDF_PIE_CYCLE[i % PDF_PIE_CYCLE.length]));

    const fileSlug = (profile.name || "client").trim().toLowerCase().replace(/\s+/g, "-");
    doc.save(`${fileSlug}-finance-report.pdf`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="report-hero-gradient flex flex-col justify-between gap-4 rounded-2xl border border-border p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-center gap-3">
          {backLink}
          <div>
            <h1 className="text-2xl font-bold text-heading">{profile.name}</h1>
            <p className="mt-1 text-sm text-text-muted">
              {[profile.company, profile.designation].filter(Boolean).join(" · ") || "Personal finance overview"}
              {profile.gstin ? ` · GSTIN: ${profile.gstin}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={startEdit}>
            <Pencil size={14} /> Edit details
          </Button>
          <Button variant="secondary" size="sm" onClick={exportReportPdf}>
            <Download size={14} /> Download Report
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSendReport}>
            <Send size={14} /> Send Report
            <Badge variant="brand" className="ml-0.5">
              Soon
            </Badge>
          </Button>
        </div>
      </div>

      {sendNotice && (
        <div className="rounded-lg border border-brand/30 bg-brand-soft px-3.5 py-2.5 text-sm text-brand">
          Send Report is coming soon — this will email a copy of this report straight to the client.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Monthly Income"
          value={rupee(snapshot.monthlyIncome)}
          accentBg="bg-brand-soft"
          accentText="text-brand"
          barColor={CHART_COLORS.brand}
        />
        <StatCard
          icon={TrendingDown}
          label="Total Expenses"
          value={rupee(snapshot.totalExpenses)}
          accentBg="bg-danger-bg"
          accentText="text-danger"
          barColor={CHART_COLORS.danger}
        />
        <StatCard
          icon={Landmark}
          label="Total EMI Obligations"
          value={rupee(snapshot.totalEmi)}
          accentBg="bg-warning-bg"
          accentText="text-warning"
          barColor={CHART_COLORS.warning}
        />
        <StatCard
          icon={TrendingUp}
          label={surplusPositive ? "Monthly Surplus" : "Monthly Deficit"}
          value={rupee(Math.abs(snapshot.surplus))}
          accentBg={surplusPositive ? "bg-success-bg" : "bg-danger-bg"}
          accentText={surplusPositive ? "text-success" : "text-danger"}
          barColor={surplusPositive ? CHART_COLORS.success : CHART_COLORS.danger}
        />
      </div>

      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <PieChartIcon size={15} />
            </div>
            <h2 className="text-lg font-semibold text-heading">Where the income goes</h2>
          </div>
          {incomeAllocation.length === 0 ? (
            <p className="text-sm text-text-muted">Add income, expenses, or loans to see the breakdown.</p>
          ) : (
            <DonutChart data={incomeAllocation} formatValue={rupee} />
          )}
        </Card>
        <Card className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <PieChartIcon size={15} />
            </div>
            <h2 className="text-lg font-semibold text-heading">Expense breakdown</h2>
          </div>
          {expenseBreakdown.length === 0 ? (
            <p className="text-sm text-text-muted">No expenses on file yet.</p>
          ) : (
            <DonutChart data={expenseBreakdown} formatValue={rupee} />
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${HEALTH_ICON_STYLE[HEALTH_VARIANT[snapshot.healthStatus]]}`}>
              <Activity size={15} />
            </div>
            <h2 className="text-lg font-semibold text-heading">Financial health</h2>
          </div>
          <Badge variant={HEALTH_VARIANT[snapshot.healthStatus] as any}>{snapshot.healthStatus}</Badge>
        </div>
        <p className="text-sm text-text-muted">{snapshot.healthMessage}</p>
        <div className="mt-1 flex flex-wrap gap-6 text-sm">
          <span className="text-text">
            FOIR (obligations ÷ income): <strong>{snapshot.foir}%</strong>
          </span>
          <span className="text-text">
            Savings rate: <strong>{snapshot.savingsRate}%</strong>
          </span>
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-soft text-teal">
            <Banknote size={15} />
          </div>
          <h2 className="text-lg font-semibold text-heading">Loan eligibility</h2>
        </div>
        <p className="text-sm text-text-muted">
          Assumes up to {eligibility?.targetFoirPercent ?? 50}% of their income left over after existing EMIs could go toward a new loan.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Input label="Assumed rate (% p.a.)" type="number" value={annualRate} onChange={(e: any) => setAnnualRate(e.target.value)} className="max-w-40" />
          <Input label="Tenure (months)" type="number" value={tenureMonths} onChange={(e: any) => setTenureMonths(e.target.value)} className="max-w-40" />
          <Button variant="secondary" size="sm" onClick={handleRecalcEligibility} loading={eligLoading}>
            Recalculate
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative overflow-hidden rounded-xl bg-teal-soft p-4">
            <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: CHART_COLORS.teal }} />
            <p className="text-xs text-teal">Additional EMI capacity</p>
            <p className="mt-1 text-xl font-bold text-heading">{rupee(eligibility?.additionalEmiCapacity)}/mo</p>
          </div>
          <div className="relative overflow-hidden rounded-xl bg-teal-soft p-4">
            <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: CHART_COLORS.teal }} />
            <p className="text-xs text-teal">Max eligible new loan</p>
            <p className="mt-1 text-xl font-bold text-heading">{rupee(eligibility?.maxEligibleLoan)}</p>
          </div>
        </div>
        {snapshot.foir < 20 && snapshot.savingsRate > 20 && (
          <div className="rounded-lg border border-success/30 bg-success-bg px-3.5 py-2.5 text-sm text-success">
            Low existing debt and healthy savings — this client is well placed to invest more, or take on a new loan if needed.
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <TrendingUp size={15} />
          </div>
          <h2 className="text-lg font-semibold text-heading">Investment projection</h2>
        </div>
        <p className="text-sm text-text-muted">
          If they invest a fixed amount every month — illustrative only, assumes a steady return; actual returns vary.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <Input label="Monthly contribution (₹)" type="number" value={contribution} onChange={(e: any) => setContribution(e.target.value)} className="max-w-48" />
          <Input label="Assumed return (% p.a.)" type="number" value={returnRate} onChange={(e: any) => setReturnRate(e.target.value)} className="max-w-40" />
          <Button variant="secondary" size="sm" onClick={handleRecalcProjection} loading={projLoading}>
            Update projection
          </Button>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="projectionBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.brand} stopOpacity={1} />
                  <stop offset="100%" stopColor={CHART_COLORS.teal} stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} width={56} tickFormatter={(v) => compactRupee(v)} />
              <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip formatter={(value: number) => rupee(value)} />} />
              <Bar dataKey="value" name="Projected value" fill="url(#projectionBarGradient)" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <Landmark size={15} />
            </div>
            <h3 className="text-sm font-semibold text-heading">Loans</h3>
          </div>
          <div className="flex flex-col gap-2.5 text-sm">
            {profile.homeLoan?.active && (
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-text-muted">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS.brand }} />
                  Home Loan
                </span>
                <span className="font-semibold text-heading">{rupee(profile.homeLoan.emi)}/mo</span>
              </div>
            )}
            {profile.carLoan?.active && (
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-text-muted">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS.teal }} />
                  Car Loan
                </span>
                <span className="font-semibold text-heading">{rupee(profile.carLoan.emi)}/mo</span>
              </div>
            )}
            {profile.personalLoan?.active && (
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-text-muted">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS.gold }} />
                  Personal Loan
                </span>
                <span className="font-semibold text-heading">{rupee(profile.personalLoan.emi)}/mo</span>
              </div>
            )}
            {(profile.otherLoans || []).map((l: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-text-muted">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLOR_CYCLE[i % PIE_COLOR_CYCLE.length] }} />
                  {l.name}
                </span>
                <span className="font-semibold text-heading">{rupee(l.emi)}/mo</span>
              </div>
            ))}
            {snapshot.totalEmi === 0 && <p className="text-text-muted">No active loans on file.</p>}
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger">
              <TrendingDown size={15} />
            </div>
            <h3 className="text-sm font-semibold text-heading">Monthly expenses</h3>
          </div>
          <div className="flex flex-col gap-2.5 text-sm">
            {EXPENSE_FIELDS.map(([key, label], i) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-text-muted">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLOR_CYCLE[i % PIE_COLOR_CYCLE.length] }} />
                  {label}
                </span>
                <span className="whitespace-nowrap font-semibold text-heading">{rupee(profile.expenses?.[key])}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
