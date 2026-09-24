import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Upload,
  Settings2,
  Pencil,
  Users,
  ClipboardCheck,
  TrendingUp,
  PercentCircle,
  MapPin,
  CheckCircle2,
  Circle,
  Eye,
  Table2,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";
import * as businessClientApi from "../../../api/businessClient.api.js";
import * as payrollApi from "../../../api/clientPayroll.api";
import { useAuth } from "../../../hooks/useAuth";
import ClientIdentityCard from "../../../components/payroll/ClientIdentityCard.jsx";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import Card from "../../../components/ui/Card.jsx";
import Table from "../../../components/ui/Table.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import Spinner from "../../../components/ui/Spinner.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import SegmentedTabs from "../../../components/ui/SegmentedTabs.jsx";
import Switch from "../../../components/ui/Switch.jsx";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Firm-wide column display order (ClientPayrollFirmSettings.columnOrder) —
// columns already known to the saved order are sorted by their position
// there; anything not yet ordered (e.g. a component only this client has)
// keeps its existing relative position, appended after the known ones.
function applyColumnOrder(columns: any[], savedOrder?: string[]) {
  if (!savedOrder || savedOrder.length === 0) return columns;
  const known = columns.filter((c) => savedOrder.includes(c.key));
  const unknown = columns.filter((c) => !savedOrder.includes(c.key));
  known.sort((a, b) => savedOrder.indexOf(a.key) - savedOrder.indexOf(b.key));
  return [...known, ...unknown];
}

function downloadBlob(data: BlobPart, filename: string) {
  const url = URL.createObjectURL(new Blob([data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function StatCard({ icon: Icon, label, value, sub, accentBg, accentText }: any) {
  return (
    <Card className="p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentBg} ${accentText}`}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-2xl font-bold text-heading">{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
      {sub && <p className="mt-1 text-xs text-text-muted">{sub}</p>}
    </Card>
  );
}

// ── Salary components list (which columns exist at all) ────────────────────

function ComponentsModal({ open, onClose, settings, onSaved, businessClientId }: any) {
  const [earnings, setEarnings] = useState("");
  const [deductions, setDeductions] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setEarnings((settings?.earningComponents || []).join(", "));
    setDeductions((settings?.deductionComponents || []).join(", "));
    setError("");
  }, [open, settings]);

  async function handleSave() {
    const earningComponents = earnings.split(",").map((s) => s.trim()).filter(Boolean);
    const deductionComponents = deductions.split(",").map((s) => s.trim()).filter(Boolean);
    if (earningComponents.length === 0) {
      setError("At least one earning component is required");
      return;
    }
    if (!earningComponents.includes("Basic")) earningComponents.unshift("Basic");
    setSaving(true);
    setError("");
    try {
      const { data } = await payrollApi.updatePayrollSettings(businessClientId, { earningComponents, deductionComponents });
      onSaved(data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save components");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Salary components for this client"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="brand" onClick={handleSave} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}
        <p className="text-sm text-text-muted">
          These are the columns that appear on the salary structure below. "Basic" is a % of CTC (or a flat fixed
          amount); every other component here is a % of Basic — set percentages via Structure Setting.
          Comma-separated.
        </p>
        <Input label="Earning components" value={earnings} onChange={(e: any) => setEarnings(e.target.value)} placeholder="Basic, HRA, DA" />
        <Input
          label="Deduction components"
          value={deductions}
          onChange={(e: any) => setDeductions(e.target.value)}
          placeholder="PF, Professional Tax, TDS"
        />
      </div>
    </Modal>
  );
}

// ── Template Settings: which columns appear on the downloadable/uploadable
// monthly Excel, in what order — separate from "Salary components" above,
// which only drives the % calculator. ───────────────────────────────────────

const ROLE_BADGES: Record<string, string> = {
  employeeName: "Employee identifier",
  ctc: "CTC",
  payDays: "Pay Days",
  totalWorkingDays: "Total Working Days",
};
const ROLE_DELETE_WARNING: Record<string, string> = {
  ctc: "No component — including Basic — will be calculated until you add a CTC column back.",
  payDays: "Payroll will no longer be prorated for this client — everyone gets full pay every month.",
  totalWorkingDays: "Payroll will no longer be prorated for this client — everyone gets full pay every month.",
};

function TemplateColumnsModal({ open, onClose, settings, businessClientId, onSaved }: any) {
  const [columns, setColumns] = useState<any[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState("text");
  const [newPosition, setNewPosition] = useState("");
  const [pendingDeleteIdx, setPendingDeleteIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const sorted = [...(settings?.templateColumns || [])].sort((a: any, b: any) => a.order - b.order);
    setColumns(sorted.map((c: any) => ({ ...c })));
    setNewLabel("");
    setNewType("text");
    setNewPosition("");
    setPendingDeleteIdx(null);
    setError("");
  }, [open, settings]);

  function updateLabel(idx: number, label: string) {
    setColumns((cols) => cols.map((c, i) => (i === idx ? { ...c, label } : c)));
  }

  function updateType(idx: number, dataType: string) {
    setColumns((cols) => cols.map((c, i) => (i === idx ? { ...c, dataType } : c)));
  }

  function setPosition(idx: number, posRaw: string) {
    const pos = Math.max(1, Math.min(columns.length, Number(posRaw) || 1));
    setColumns((cols) => {
      const next = [...cols];
      const [item] = next.splice(idx, 1);
      next.splice(pos - 1, 0, item);
      return next;
    });
  }

  function requestDelete(idx: number) {
    const col = columns[idx];
    if (col.role === "employeeName") return;
    if (ROLE_DELETE_WARNING[col.role]) {
      setPendingDeleteIdx(idx);
    } else {
      setColumns((cols) => cols.filter((_, i) => i !== idx));
    }
  }

  function confirmDelete() {
    setColumns((cols) => cols.filter((_, i) => i !== pendingDeleteIdx));
    setPendingDeleteIdx(null);
  }

  function addColumn() {
    if (!newLabel.trim()) return;
    const maxPos = columns.length + 1;
    // Blank position = append at the end (matches the placeholder shown in
    // the input); otherwise insert at that column number, pushing everything
    // from there onward down by one — same splice-based reorder as
    // setPosition uses for existing columns.
    const pos = newPosition ? Math.max(1, Math.min(maxPos, Number(newPosition) || maxPos)) : maxPos;
    setColumns((cols) => {
      const next = [...cols];
      next.splice(pos - 1, 0, { label: newLabel.trim(), role: "custom", dataType: newType, order: pos });
      return next;
    });
    setNewLabel("");
    setNewType("text");
    setNewPosition("");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const { data } = await payrollApi.updateTemplateColumns(businessClientId, columns);
      onSaved(data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save template columns");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Template Settings"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="brand" onClick={handleSave} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}
        <p className="text-sm text-text-muted">
          These are the columns on the downloadable/uploadable Excel each month, in this order. Employee Name always stays (it's
          how rows are matched to employees); everything else can be renamed, reordered, or deleted — including CTC, Pay Days and
          Total Working Days, though deleting those changes how payroll is calculated for this client.
        </p>

        {pendingDeleteIdx !== null && (
          <div className="flex flex-col gap-2 rounded-lg border border-warning/30 bg-warning-bg px-3.5 py-2.5 text-sm text-warning">
            <span>{ROLE_DELETE_WARNING[columns[pendingDeleteIdx]?.role]}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="danger" onClick={confirmDelete}>
                Delete anyway
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setPendingDeleteIdx(null)}>
                Keep it
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {columns.map((col, idx) => (
            <div key={col.key || `new-${idx}`} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
              <Input
                type="number"
                min={1}
                max={columns.length}
                value={idx + 1}
                onChange={(e: any) => setPosition(idx, e.target.value)}
                className="w-14 shrink-0 text-center"
              />
              <Input value={col.label} onChange={(e: any) => updateLabel(idx, e.target.value)} className="flex-1" />
              {col.role === "custom" ? (
                <Select value={col.dataType} onChange={(e: any) => updateType(idx, e.target.value)} className="w-28 shrink-0">
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </Select>
              ) : (
                <Badge variant="brand" className="shrink-0">
                  {ROLE_BADGES[col.role]}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => requestDelete(idx)}
                disabled={col.role === "employeeName"}
                title={col.role === "employeeName" ? "Required to match rows to employees" : "Delete column"}
              >
                <Trash2 size={14} className={col.role === "employeeName" ? "text-text-muted" : "text-danger"} />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-border pt-4">
          <Input
            type="number"
            min={1}
            max={columns.length + 1}
            placeholder={String(columns.length + 1)}
            title="Column number to insert at — anything already there shifts down"
            value={newPosition}
            onChange={(e: any) => setNewPosition(e.target.value)}
            className="w-16 shrink-0 text-center"
          />
          <Input
            placeholder="New column label, e.g. Department"
            value={newLabel}
            onChange={(e: any) => setNewLabel(e.target.value)}
            className="flex-1"
          />
          <Select value={newType} onChange={(e: any) => setNewType(e.target.value)} className="w-28 shrink-0">
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
          </Select>
          <Button variant="secondary" size="sm" onClick={addColumn} disabled={!newLabel.trim()}>
            <Plus size={14} /> Add
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Structure Settings: Basic is % of CTC (or a flat Fixed amount) — it's
// the one component whose % is of CTC, not of Basic, since it can't be a %
// of itself. Everything else is either % of Basic or a flat Fixed amount
// (same for every employee), per-component. NPS stays percent-only — flat
// "fixed" wouldn't be statutorily meaningful for it. Employee PF and Employee
// ESI aren't configured here at all — they're fixed statutory formulas — see
// NON_CONFIGURABLE_COMPONENTS / applyPercentagesToStructure. ───────────────

const PERCENT_ONLY_COMPONENTS = ["NPS"];
const NON_CONFIGURABLE_COMPONENTS = ["Employee PF", "Employee ESI"];
const MODE_OPTIONS = [
  { value: "percent", label: "%" },
  { value: "fixed", label: "₹ Fixed" },
];

function StructureSettingsModal({ open, onClose, settings, firmSettings, businessClientId, month, onSaved }: any) {
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [fixedAmounts, setFixedAmounts] = useState<Record<string, string>>({});
  const [modes, setModes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Employee PF/Employee ESI are fixed statutory formulas — never configured
  // here. Basic IS configured here (first in the list, its % is of CTC).
  const requiredComponents = [...(settings?.earningComponents || []), ...(settings?.deductionComponents || [])].filter(
    (c: string) => !NON_CONFIGURABLE_COMPONENTS.includes(c)
  );
  const modeFor = (c: string) => (PERCENT_ONLY_COMPONENTS.includes(c) ? "percent" : modes[c] || "percent");

  useEffect(() => {
    if (!open) return;
    const currentPct = settings?.componentPercentages || {};
    const currentFixed = settings?.componentFixedAmounts || {};
    const currentModes = settings?.componentModes || {};
    const defaultPct = firmSettings?.defaultComponentPercentages || {};
    const defaultFixed = firmSettings?.defaultComponentFixedAmounts || {};
    const defaultModes = firmSettings?.defaultComponentModes || {};

    const nextPct: Record<string, string> = {};
    const nextFixed: Record<string, string> = {};
    const nextModes: Record<string, string> = {};
    requiredComponents.forEach((c: string) => {
      nextModes[c] = PERCENT_ONLY_COMPONENTS.includes(c) ? "percent" : currentModes[c] || defaultModes[c] || "percent";
      nextPct[c] =
        currentPct[c] !== undefined && currentPct[c] !== null
          ? String(currentPct[c])
          : defaultPct[c] !== undefined && defaultPct[c] !== null
            ? String(defaultPct[c])
            : "";
      nextFixed[c] =
        currentFixed[c] !== undefined && currentFixed[c] !== null
          ? String(currentFixed[c])
          : defaultFixed[c] !== undefined && defaultFixed[c] !== null
            ? String(defaultFixed[c])
            : "";
    });
    setPercentages(nextPct);
    setFixedAmounts(nextFixed);
    setModes(nextModes);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, settings, firmSettings]);

  async function handleSave() {
    const missing = requiredComponents.filter((c: string) => {
      const val = modeFor(c) === "fixed" ? fixedAmounts[c] : percentages[c];
      return val === undefined || val === "";
    });
    if (missing.length > 0) {
      setError(`Set a value for: ${missing.join(", ")}`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const percentagesPayload: Record<string, number> = {};
      const fixedAmountsPayload: Record<string, number> = {};
      const modesPayload: Record<string, string> = {};
      requiredComponents.forEach((c: string) => {
        const mode = modeFor(c);
        modesPayload[c] = mode;
        if (mode === "fixed") fixedAmountsPayload[c] = Number(fixedAmounts[c]) || 0;
        else percentagesPayload[c] = Number(percentages[c]) || 0;
      });
      await payrollApi.updateComponentPercentages(businessClientId, {
        percentages: percentagesPayload,
        fixedAmounts: fixedAmountsPayload,
        modes: modesPayload,
        month,
      });
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save Structure Settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Structure Setting"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="brand" onClick={handleSave} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}
        <p className="text-sm text-text-muted">
          <strong className="text-text">Basic</strong> is the only component whose{" "}
          <strong className="text-text">%</strong> is of CTC (it can't be a % of itself) — everything else is a %{" "}
          of Basic, or <strong className="text-text">₹ Fixed</strong> for the same flat amount every employee, e.g.
          set Arrears to a fixed ₹1,000 and every employee's Arrears is ₹1,000 that month.{" "}
          <strong className="text-text">Employee PF</strong>/<strong className="text-text">Employee ESI</strong> aren't
          set here at all — calculated automatically via statutory wage rules. NPS always stays % (statutory).
        </p>

        {requiredComponents.length === 0 ? (
          <p className="text-sm text-text-muted">No components configured yet — add some via "Salary components" first.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {requiredComponents.map((c: string) => {
              const locked = PERCENT_ONLY_COMPONENTS.includes(c);
              const mode = modeFor(c);
              const pctOfLabel = c === "Basic" ? "% of CTC" : "%";
              return (
                <div key={c} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
                  <span className="w-full shrink-0 text-sm font-medium text-text sm:w-40" title={c}>
                    {c}
                  </span>
                  {!locked && (
                    <SegmentedTabs options={MODE_OPTIONS} value={mode} onChange={(v) => setModes((m) => ({ ...m, [c]: v }))} />
                  )}
                  {mode === "fixed" ? (
                    <Input
                      type="number"
                      min={0}
                      value={fixedAmounts[c] ?? ""}
                      onChange={(e: any) => setFixedAmounts((v) => ({ ...v, [c]: e.target.value }))}
                      placeholder="₹ amount"
                      className="min-w-32 flex-1"
                    />
                  ) : (
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={percentages[c] ?? ""}
                      onChange={(e: any) => setPercentages((v) => ({ ...v, [c]: e.target.value }))}
                      placeholder={pctOfLabel}
                      className="min-w-32 flex-1"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Manual edit of one employee's structure for the selected month ─────────

function EmployeeStructureModal({ open, onClose, row, settings, businessClientId, month, onSaved }: any) {
  const [ctc, setCtc] = useState("");
  const [payDays, setPayDays] = useState("");
  const [totalWorkingDays, setTotalWorkingDays] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  // Per-component override state — "Custom for this employee" toggle, plus
  // the mode/%/fixed to use only while that toggle is on. When off, the
  // component just follows the client-wide Structure Setting (shown read-only).
  const [overrideOn, setOverrideOn] = useState<Record<string, boolean>>({});
  const [modes, setModes] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [fixedAmounts, setFixedAmounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const templateColumns = settings?.templateColumns || [];
  const hasRole = (role: string) => templateColumns.some((c: any) => c.role === role);
  const ctcCol = templateColumns.find((c: any) => c.role === "ctc");
  const payDaysCol = templateColumns.find((c: any) => c.role === "payDays");
  const totalWorkingDaysCol = templateColumns.find((c: any) => c.role === "totalWorkingDays");
  const customColumns = templateColumns.filter((c: any) => c.role === "custom").sort((a: any, b: any) => a.order - b.order);
  const earningComponents = (settings?.earningComponents || []).filter((c: string) => !NON_CONFIGURABLE_COMPONENTS.includes(c));
  const deductionComponents = (settings?.deductionComponents || []).filter((c: string) => !NON_CONFIGURABLE_COMPONENTS.includes(c));
  const isLocked = (c: string) => PERCENT_ONLY_COMPONENTS.includes(c);
  const clientDefaultMode = (c: string) => (isLocked(c) ? "percent" : settings?.componentModes?.[c] || "percent");

  function clientDefaultLabel(c: string) {
    const mode = clientDefaultMode(c);
    if (mode === "fixed") {
      const amt = settings?.componentFixedAmounts?.[c];
      return amt !== undefined && amt !== null ? `Client default: ₹${amt} fixed` : "Client default: not set";
    }
    const pct = settings?.componentPercentages?.[c];
    const ofLabel = c === "Basic" ? "of CTC" : "of Basic";
    return pct !== undefined && pct !== null ? `Client default: ${pct}% ${ofLabel}` : "Client default: not set";
  }

  useEffect(() => {
    if (!open || !row) return;
    setCtc(String(row.ctc ?? ""));
    setPayDays(String(row.payDays ?? ""));
    setTotalWorkingDays(String(row.totalWorkingDays ?? ""));
    setCostCenter(row.costCenter || "");
    const nextCustom: Record<string, string> = {};
    customColumns.forEach((c: any) => (nextCustom[c.key] = row.customFields?.[c.key] || ""));
    setCustomValues(nextCustom);

    const modeOverrides = row.componentModeOverrides || {};
    const pctOverrides = row.componentPercentageOverrides || {};
    const fixedOverrides = row.componentFixedAmountOverrides || {};
    const nextOverrideOn: Record<string, boolean> = {};
    const nextModes: Record<string, string> = {};
    const nextPct: Record<string, string> = {};
    const nextFixed: Record<string, string> = {};
    [...earningComponents, ...deductionComponents].forEach((c: string) => {
      const hasOverride = modeOverrides[c] !== undefined || pctOverrides[c] !== undefined || fixedOverrides[c] !== undefined;
      nextOverrideOn[c] = hasOverride;
      nextModes[c] = hasOverride && (modeOverrides[c] === "fixed" || modeOverrides[c] === "percent") ? modeOverrides[c] : clientDefaultMode(c);
      nextPct[c] = String(
        pctOverrides[c] !== undefined && pctOverrides[c] !== null ? pctOverrides[c] : settings?.componentPercentages?.[c] ?? ""
      );
      nextFixed[c] = String(
        fixedOverrides[c] !== undefined && fixedOverrides[c] !== null ? fixedOverrides[c] : settings?.componentFixedAmounts?.[c] ?? ""
      );
    });
    setOverrideOn(nextOverrideOn);
    setModes(nextModes);
    setPercentages(nextPct);
    setFixedAmounts(nextFixed);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row, settings]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await payrollApi.updateEmployeeStructure(businessClientId, month, row.employee._id, {
        ...(hasRole("ctc") ? { ctc: Number(ctc) || 0 } : {}),
        ...(hasRole("payDays") ? { payDays: Number(payDays) || 0 } : {}),
        ...(hasRole("totalWorkingDays") ? { totalWorkingDays: Number(totalWorkingDays) || 0 } : {}),
        costCenter,
        customFields: customValues,
      });

      const modesPayload: Record<string, string> = {};
      const percentagesPayload: Record<string, number> = {};
      const fixedAmountsPayload: Record<string, number> = {};
      for (const c of [...earningComponents, ...deductionComponents]) {
        if (!overrideOn[c]) continue;
        const mode = isLocked(c) ? "percent" : modes[c] === "fixed" ? "fixed" : "percent";
        modesPayload[c] = mode;
        if (mode === "fixed") fixedAmountsPayload[c] = Number(fixedAmounts[c]) || 0;
        else percentagesPayload[c] = Number(percentages[c]) || 0;
      }
      await payrollApi.updateEmployeeComponentSettings(businessClientId, month, row.employee._id, {
        modes: modesPayload,
        percentages: percentagesPayload,
        fixedAmounts: fixedAmountsPayload,
      });
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save salary structure");
    } finally {
      setSaving(false);
    }
  }

  function renderComponentRow(c: string) {
    const on = overrideOn[c] || false;
    const locked = isLocked(c);
    const mode = locked ? "percent" : modes[c] || "percent";
    return (
      <div key={c} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-2.5">
        <span className="w-full shrink-0 text-sm font-medium text-text sm:w-40" title={c}>
          {c}
        </span>
        <label className="flex shrink-0 items-center gap-1.5 text-xs text-text-muted">
          <Switch checked={on} onChange={(v) => setOverrideOn((s) => ({ ...s, [c]: v }))} />
          Custom for this employee
        </label>
        {on ? (
          <>
            {!locked && (
              <SegmentedTabs options={MODE_OPTIONS} value={mode} onChange={(v) => setModes((m) => ({ ...m, [c]: v }))} />
            )}
            {mode === "fixed" ? (
              <Input
                type="number"
                min={0}
                value={fixedAmounts[c] ?? ""}
                onChange={(e: any) => setFixedAmounts((v) => ({ ...v, [c]: e.target.value }))}
                placeholder="₹ amount"
                className="min-w-32 flex-1"
              />
            ) : (
              <Input
                type="number"
                min={0}
                max={100}
                value={percentages[c] ?? ""}
                onChange={(e: any) => setPercentages((v) => ({ ...v, [c]: e.target.value }))}
                placeholder={c === "Basic" ? "% of CTC" : "%"}
                className="min-w-32 flex-1"
              />
            )}
          </>
        ) : (
          <span className="text-xs text-text-muted">{clientDefaultLabel(c)}</span>
        )}
      </div>
    );
  }

  if (!row) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Salary structure — ${row.employee?.name} · ${monthLabel(month)}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="brand" onClick={handleSave} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ctcCol && <Input label={ctcCol.label} type="number" value={ctc} onChange={(e: any) => setCtc(e.target.value)} />}
          {payDaysCol && <Input label={payDaysCol.label} type="number" value={payDays} onChange={(e: any) => setPayDays(e.target.value)} />}
          {totalWorkingDaysCol && (
            <Input
              label={totalWorkingDaysCol.label}
              type="number"
              value={totalWorkingDays}
              onChange={(e: any) => setTotalWorkingDays(e.target.value)}
            />
          )}
          <Input label="Cost Center" value={costCenter} onChange={(e: any) => setCostCenter(e.target.value)} />
        </div>
        <div className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text-muted">
          {(row.deductions?.["Employee PF"] !== undefined || row.deductions?.["Employee ESI"] !== undefined) && (
            <p>
              <strong className="text-text">Employee PF:</strong> ₹{row.deductions?.["Employee PF"] ?? 0} ·{" "}
              <strong className="text-text">Employee ESI:</strong> ₹{row.deductions?.["Employee ESI"] ?? 0} — both
              calculated automatically via statutory wage rules, not editable here.
            </p>
          )}
          <p className="mt-1">
            <strong className="text-text">Employer PF:</strong> ₹{row.employerPf ?? 0} ·{" "}
            <strong className="text-text">Employer ESI:</strong> ₹{row.employerEsi ?? 0} — the employer's own cost, not
            deducted from the employee.
          </p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Earnings</p>
          <div className="flex flex-col gap-2">{earningComponents.map((c: string) => renderComponentRow(c))}</div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Deductions</p>
          <div className="flex flex-col gap-2">{deductionComponents.map((c: string) => renderComponentRow(c))}</div>
        </div>
        {customColumns.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Other details</p>
            <div className="grid grid-cols-2 gap-3">
              {customColumns.map((c: any) => (
                <Input
                  key={c.key}
                  label={c.label}
                  type={c.dataType === "number" ? "number" : c.dataType === "date" ? "date" : "text"}
                  value={customValues[c.key] ?? ""}
                  onChange={(e: any) => setCustomValues((v) => ({ ...v, [c.key]: e.target.value }))}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Upload Excel: preview then confirm ──────────────────────────────────────

function previewValueFor(row: any, col: any) {
  if (col.role === "employeeName") return row.employeeName;
  if (col.role === "ctc") return row.ctc !== undefined && row.ctcCarriedForward ? `${row.ctc} (carried forward)` : row.ctc;
  if (col.role === "payDays") return row.payDays;
  if (col.role === "totalWorkingDays") return row.totalWorkingDays;
  return row.customFields?.[col.key];
}

function UploadModal({ open, onClose, businessClientId, month, templateColumns, onImported }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ data: any[]; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setPreview(null);
    setError("");
  }, [open]);

  async function handlePreview() {
    if (!file) {
      setError("Choose an Excel file first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await payrollApi.previewStructureUpload(businessClientId, month, file);
      setPreview({ data: data.data, errors: data.errors || [] });
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not read this file");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!preview || preview.data.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await payrollApi.confirmStructureUpload(businessClientId, month, {
        rows: preview.data,
        sourceFileName: file?.name,
      });
      const { success = 0, failed = 0, errors: rowErrors = [] } = data.results || {};
      if (failed > 0) {
        // A 200 response here doesn't mean every row was imported — each row is
        // saved independently server-side, so partial/total failure is normal
        // and must be surfaced instead of silently treated as a full success.
        setError(`${failed} of ${success + failed} employee(s) failed to import: ${rowErrors.join("; ")}`);
        if (success > 0) onImported(); // refresh so the ones that did succeed show up
        return;
      }
      onImported();
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not import this file");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Upload payroll Excel — ${monthLabel(month)}`}
      size="lg"
      footer={
        preview ? (
          <>
            <Button variant="secondary" onClick={() => setPreview(null)}>
              Back
            </Button>
            <Button variant="brand" onClick={handleConfirm} loading={loading} disabled={preview.data.length === 0}>
              Confirm import ({preview.data.length} employee{preview.data.length === 1 ? "" : "s"})
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="brand" onClick={handlePreview} loading={loading}>
              Preview
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}

        {!preview ? (
          <div>
            <label className="text-sm font-medium text-text">
              Excel file ({(templateColumns || []).map((c: any) => c.label).join(", ")})
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1.5 block w-full text-sm text-text file:mr-3 file:rounded-xl file:border-0 file:bg-brand-soft file:px-3.5 file:py-2 file:text-sm file:font-medium file:text-brand"
            />
          </div>
        ) : (
          <>
            {preview.errors.length > 0 && (
              <div className="rounded-lg border border-warning/30 bg-warning-bg px-3.5 py-2.5 text-sm text-warning">
                <p className="mb-1 font-medium">{preview.errors.length} row(s) skipped:</p>
                <ul className="list-inside list-disc space-y-0.5">
                  {preview.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-text-muted">{preview.data.length} employee(s) ready to import for {monthLabel(month)}.</p>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2">
                  <tr>
                    {(templateColumns || []).map((c: any) => (
                      <th key={c.key} className="px-3 py-2">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.data.map((r: any, i: number) => (
                    <tr key={i} className="border-t border-border">
                      {(templateColumns || []).map((c: any) => (
                        <td key={c.key} className="px-3 py-1.5">
                          {previewValueFor(r, c) ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ClientSalaryStructurePage() {
  const { clientId } = useParams();
  const { basePath } = useAuth();
  const navigate = useNavigate();

  const [client, setClient] = useState<any>(null);
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [run, setRun] = useState<any>(null);
  const [firmSettings, setFirmSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [componentsOpen, setComponentsOpen] = useState(false);
  const [templateColumnsOpen, setTemplateColumnsOpen] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [costCenterInput, setCostCenterInput] = useState("");
  const [costCenterSaving, setCostCenterSaving] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState("");

  async function loadClient() {
    if (!clientId) return;
    const { data } = await businessClientApi.getBusinessClient(clientId);
    setClient(data.data);
  }

  async function loadFirmSettings() {
    const { data } = await payrollApi.getFirmPayrollSettings();
    setFirmSettings(data.data);
  }

  async function loadStructure(targetMonth: string) {
    if (!clientId) return;
    setLoading(true);
    try {
      const { data } = await payrollApi.getStructureForMonth(clientId, targetMonth);
      setRows(data.data || []);
      setSettings(data.settings || null);
      setRun(data.run || null);
      setCostCenterInput(data.data?.[0]?.costCenter || "");
      setJustSaved(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClient();
    loadFirmSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    loadStructure(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, month]);

  async function handleDownloadTemplate() {
    const { data } = await payrollApi.downloadPayrollTemplate(clientId!);
    downloadBlob(data, `${client?.name || "client"}_Salary_Structure_Template.xlsx`);
  }

  async function handleApplyCostCenter() {
    setCostCenterSaving(true);
    setError("");
    try {
      await payrollApi.updateCostCenter(clientId!, month, costCenterInput);
      await loadStructure(month);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not apply cost center");
    } finally {
      setCostCenterSaving(false);
    }
  }

  async function handleSaveStructure() {
    setSaving(true);
    setError("");
    try {
      await payrollApi.saveStructureForMonth(clientId!, month);
      setConfirmSaveOpen(false);
      setJustSaved(true);
      await loadStructure(month);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save salary structure");
      setConfirmSaveOpen(false);
    } finally {
      setSaving(false);
    }
  }

  const totalGross = rows.reduce((sum, r) => sum + (r.gross || 0), 0);
  const percentagesConfigured = settings?.componentPercentages && Object.keys(settings.componentPercentages).length > 0;
  // CTC uploaded is never adjusted — this only flags rows where Gross +
  // Employer PF + Employer ESI doesn't add back up to it (see ctcMismatch,
  // computed server-side in applyPercentagesToStructure).
  const mismatchedRows = rows.filter((r) => r.ctcMismatch);

  const steps = [
    { label: "Import Excel for this month", done: rows.length > 0 },
    { label: "Set % in Structure Settings (or edit manually)", done: percentagesConfigured },
    { label: "Save salary structure", done: !!run?.structureSaved },
    { label: "Go to Payroll runs to view & run", done: false, link: true },
  ];

  const earningColumns = settings
    ? settings.earningComponents.map((c: string) => ({
        key: `e:${c}`,
        label: c,
        align: "center" as const,
        render: (row: any) => (row.earnings?.[c] !== undefined ? `₹${row.earnings[c]}` : "—"),
      }))
    : [];
  const deductionColumns = settings
    ? settings.deductionComponents.map((c: string) => ({
        key: `d:${c}`,
        label: c,
        align: "center" as const,
        render: (row: any) => (row.deductions?.[c] !== undefined ? `₹${row.deductions[c]}` : "—"),
      }))
    : [];

  const templateColumns = settings?.templateColumns || [];
  const byRole = (role: string) => templateColumns.find((c: any) => c.role === role);
  const ctcCol = byRole("ctc");
  // Fixed on-screen order: Emp ID, then every "employeeName"/"custom" template
  // column in its configured order (First Name, Last Name, Full Name,
  // Department, Designation, Location, PAN, UAN/EPF NO, ESI NO — whatever
  // Template Settings has, excluding "Month" which isn't shown on this table),
  // then CTC, the earning components (Basic first), Gross Remuneration, the
  // deduction components, Net Payment, then Employer PF/ESI. Firms can still
  // drag-reorder via the table header — that saved order
  // (firmSettings.columnOrder) wins over this default once set.
  const infoColumns = templateColumns
    .filter((c: any) => (c.role === "employeeName" || c.role === "custom") && c.key !== "month")
    .sort((a: any, b: any) => a.order - b.order)
    .map((c: any) =>
      c.role === "employeeName"
        ? { key: "name", label: c.label, render: (row: any) => row.employee?.name || "—" }
        : {
            key: `custom:${c.key}`,
            label: c.label,
            align: "center" as const,
            render: (row: any) => row.customFields?.[c.key] || "—",
          }
    );

  function netPayment(row: any) {
    const deductionValues: any[] = Object.values(row.deductions || {});
    const deductionSum = deductionValues.reduce((sum: number, v) => sum + (Number(v) || 0), 0);
    return Math.max(0, (Number(row.gross) || 0) - deductionSum);
  }

  const columns = [
    { key: "code", label: "Emp ID", render: (row: any) => row.employee?.employeeCode || "—" },
    ...infoColumns,
    ...(ctcCol ? [{ key: "ctc", label: ctcCol.label, align: "center" as const, render: (row: any) => `₹${row.ctc ?? 0}` }] : []),
    ...earningColumns,
    {
      key: "gross",
      label: "Gross Remuneration",
      align: "center" as const,
      render: (row: any) => (row.gross ? `₹${row.gross}` : "—"),
    },
    ...deductionColumns,
    {
      key: "netPayment",
      label: "Net Payment",
      align: "center" as const,
      render: (row: any) => `₹${netPayment(row)}`,
    },
    {
      key: "employerPf",
      label: "Employer PF",
      align: "center" as const,
      render: (row: any) => `₹${row.employerPf ?? 0}`,
    },
    {
      key: "employerEsi",
      label: "Employer ESI",
      align: "center" as const,
      render: (row: any) => `₹${row.employerEsi ?? 0}`,
    },
    {
      key: "actions",
      label: "",
      align: "center" as const,
      noReorder: true,
      render: (row: any) => (
        <Button variant="ghost" size="sm" title="Edit salary structure" onClick={() => setEditRow(row)}>
          <Pencil size={14} />
        </Button>
      ),
    },
  ];
  const orderedColumns = applyColumnOrder(columns, firmSettings?.columnOrder);

  async function handleReorderColumns(newKeyOrder: string[]) {
    setFirmSettings((prev: any) => ({ ...prev, columnOrder: newKeyOrder }));
    try {
      await payrollApi.updateFirmPayrollSettings({ columnOrder: newKeyOrder });
    } catch {
      // Best-effort — if it fails to save, the next page load just falls
      // back to the last successfully saved order.
    }
  }

  // Column keys change whenever components are renamed/added/removed (e.g.
  // "Basic Salary" -> "Basic") — a firm-wide saved drag order from before such
  // a rename no longer matches any current column, so renamed/new columns
  // (Basic, Net Payment, Employer PF/ESI...) get pushed to the very end
  // instead of their intended default position. This clears it so the
  // built-in default order takes over again — the CA can re-drag afterward.
  async function handleResetColumnOrder() {
    setFirmSettings((prev: any) => ({ ...prev, columnOrder: [] }));
    try {
      await payrollApi.updateFirmPayrollSettings({ columnOrder: [] });
    } catch {
      // Best-effort — if it fails, the next page load re-fetches anyway.
    }
  }

  if (loading && !client) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link to={`${basePath}/clients/${clientId}/payroll`} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-2 hover:text-text">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-heading">Salary Structure</h1>
            <p className="mt-1 text-sm text-text-muted">Import each month's Excel, configure once, then review before payroll.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input type="month" value={month} onChange={(e: any) => setMonth(e.target.value)} />
          <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
            <Download size={15} /> Download template
          </Button>
          <Button variant="brand" size="sm" onClick={() => setUploadOpen(true)}>
            <Upload size={15} /> Upload Excel
          </Button>
        </div>
      </div>

      <ClientIdentityCard client={client} />

      {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Employees" value={rows.length} sub={monthLabel(month)} accentBg="bg-brand-soft" accentText="text-brand" />
        <StatCard
          icon={ClipboardCheck}
          label="Structure status"
          value={run?.structureSaved ? "Saved" : rows.length > 0 ? "In progress" : "Not started"}
          sub={monthLabel(month)}
          accentBg={run?.structureSaved ? "bg-success-bg" : "bg-warning-bg"}
          accentText={run?.structureSaved ? "text-success" : "text-warning"}
        />
        <StatCard icon={TrendingUp} label="Total Gross" value={totalGross ? `₹${totalGross}` : "—"} sub="This month, all employees" accentBg="bg-surface-2" accentText="text-text" />
        <StatCard
          icon={PercentCircle}
          label="Components configured"
          value={percentagesConfigured ? "Yes" : "No"}
          sub="Via Structure Setting"
          accentBg={percentagesConfigured ? "bg-success-bg" : "bg-surface-2"}
          accentText={percentagesConfigured ? "text-success" : "text-text-muted"}
        />
      </div>

      <Card className="flex flex-col gap-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Steps for {monthLabel(month)}</p>
        <div className="flex flex-wrap items-center gap-4">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 text-sm">
              {s.done ? <CheckCircle2 size={16} className="text-success" /> : <Circle size={16} className="text-text-muted" />}
              <span className={s.done ? "text-text" : "text-text-muted"}>{s.label}</span>
              {i < steps.length - 1 && <span className="ml-3 text-text-muted">→</span>}
            </div>
          ))}
        </div>
        {justSaved && (
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-success/30 bg-success-bg px-3.5 py-2.5 text-sm text-success">
            <span>Structure complete for {monthLabel(month)} — ready for payroll.</span>
            <Button variant="brand" size="sm" onClick={() => navigate(`${basePath}/clients/${clientId}/payroll`)}>
              <Eye size={14} /> Go to View Payroll
            </Button>
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <MapPin size={15} />
          <span>Cost Center for {monthLabel(month)} (applies to every employee below):</span>
        </div>
        <div className="flex items-center gap-2">
          <Input value={costCenterInput} onChange={(e: any) => setCostCenterInput(e.target.value)} placeholder="e.g. Head Office" />
          <Button variant="secondary" size="sm" onClick={handleApplyCostCenter} loading={costCenterSaving} disabled={rows.length === 0}>
            Apply to all
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings2 size={15} /> Structure Setting
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setComponentsOpen(true)}>
            Salary components
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setTemplateColumnsOpen(true)}>
            <Table2 size={15} /> Template Settings
          </Button>
          {firmSettings?.columnOrder?.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetColumnOrder}
              title="Clear the saved column drag-order for this firm and go back to the default order"
            >
              <RotateCcw size={15} /> Reset column order
            </Button>
          )}
        </div>
      </Card>

      {mismatchedRows.length > 0 && (
        <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
          <strong>CTC mismatch for {mismatchedRows.length} employee(s):</strong> Gross + Employer PF + Employer ESI
          should equal CTC. Please check and update Structure Setting for the row(s) highlighted red below —
          the structure can't be saved until this is fixed.
        </div>
      )}

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users size={16} className="text-text-muted" />
          <h2 className="text-lg font-semibold text-heading">Employees & salary structure</h2>
          <Badge variant="neutral">{rows.length}</Badge>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={Upload}
            title={`No salary structure for ${monthLabel(month)} yet`}
            description="Download the template, have the client fill it in, then upload it here to get started."
          />
        ) : (
          <Table
            columns={orderedColumns}
            data={rows}
            keyField="_id"
            onReorderColumns={handleReorderColumns}
            rowClassName={(row: any) => (row.ctcMismatch ? "bg-danger-bg" : "")}
          />
        )}
      </Card>

      {rows.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="brand"
            onClick={() => setConfirmSaveOpen(true)}
            disabled={run?.structureSaved || mismatchedRows.length > 0}
            title={mismatchedRows.length > 0 ? "Fix the CTC mismatch(es) above before saving" : undefined}
          >
            <ClipboardCheck size={15} /> {run?.structureSaved ? `Structure saved for ${monthLabel(month)}` : `Save structure for ${monthLabel(month)}`}
          </Button>
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        businessClientId={clientId}
        month={month}
        templateColumns={[...(settings?.templateColumns || [])].sort((a: any, b: any) => a.order - b.order)}
        onImported={() => {
          setUploadOpen(false);
          loadStructure(month);
        }}
      />
      <ComponentsModal
        open={componentsOpen}
        onClose={() => setComponentsOpen(false)}
        settings={settings}
        businessClientId={clientId}
        onSaved={(saved: any) => {
          setSettings(saved);
          setComponentsOpen(false);
        }}
      />
      <StructureSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        firmSettings={firmSettings}
        businessClientId={clientId}
        month={month}
        onSaved={() => {
          setSettingsOpen(false);
          loadFirmSettings();
          loadStructure(month);
        }}
      />
      <TemplateColumnsModal
        open={templateColumnsOpen}
        onClose={() => setTemplateColumnsOpen(false)}
        settings={settings}
        businessClientId={clientId}
        onSaved={(saved: any) => {
          setSettings(saved);
          setTemplateColumnsOpen(false);
        }}
      />
      <EmployeeStructureModal
        open={!!editRow}
        onClose={() => setEditRow(null)}
        row={editRow}
        settings={settings}
        businessClientId={clientId}
        month={month}
        onSaved={() => {
          setEditRow(null);
          loadStructure(month);
        }}
      />

      <Modal
        open={confirmSaveOpen}
        onClose={() => setConfirmSaveOpen(false)}
        title="Save salary structure?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmSaveOpen(false)}>
              Cancel
            </Button>
            <Button variant="brand" onClick={handleSaveStructure} loading={saving}>
              Confirm & save
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">
          This locks in {monthLabel(month)}'s salary structure for {rows.length} employee{rows.length === 1 ? "" : "s"}. Payroll for
          this month can only be generated and run after this is saved. You can still come back and edit it later, but any
          previously generated payroll for this month will need to be regenerated.
        </p>
      </Modal>
    </div>
  );
}
