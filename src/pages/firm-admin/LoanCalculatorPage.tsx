import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { Calculator, Plus, Download, Save, Trash2, X } from "lucide-react";
import * as loanApi from "../../api/loanCalculator.api.js";
import * as crmApi from "../../api/crm.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { ROLES } from "../../config/roles.js";
import { calculateEmi, estimateEligibility, buildAmortizationSchedule } from "../../utils/loanMath.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import Table from "../../components/ui/Table.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";

function formatCurrency(n) {
  if (!Number.isFinite(n)) return "—";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

const INITIAL_EMI_FORM = { principal: "500000", annualRate: "10.5", tenureMonths: "60" };
const INITIAL_ELIGIBILITY_FORM = { monthlyIncome: "80000", monthlyObligations: "10000", annualRate: "10.5", tenureMonths: "60" };

function SaveCalculationModal({ mode, inputs, result, clientOptions, onClose, onSaved }) {
  const [clientId, setClientId] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        type: mode,
        label,
        clientId,
        annualRate: Number(inputs.annualRate),
        tenureMonths: Number(inputs.tenureMonths),
      };
      if (mode === "emi") {
        payload.principal = Number(inputs.principal);
      } else {
        payload.monthlyIncome = Number(inputs.monthlyIncome);
        payload.monthlyObligations = Number(inputs.monthlyObligations);
      }
      await loanApi.createCalculation(payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save calculation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Save calculation to a client"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="save-calc-form" type="submit" loading={submitting}>
            <Save size={15} /> Save
          </Button>
        </>
      }
    >
      <form id="save-calc-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}
        <Select label="Client" required value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="" disabled>
            Select client
          </option>
          {clientOptions.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
              {c.company ? ` (${c.company})` : ""}
            </option>
          ))}
        </Select>
        <Input label="Label" placeholder="e.g. Home loan — Option A" value={label} onChange={(e) => setLabel(e.target.value)} />
        <p className="text-xs text-text-muted">
          {mode === "emi"
            ? `EMI ${formatCurrency(result.emi)}/month`
            : `Estimated eligible amount ${formatCurrency(result.maxEligibleAmount)}`}
        </p>
      </form>
    </Modal>
  );
}

export default function LoanCalculatorPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.CA_FIRM_ADMIN;

  const [mode, setMode] = useState("emi");
  const [emiForm, setEmiForm] = useState(INITIAL_EMI_FORM);
  const [eligibilityForm, setEligibilityForm] = useState(INITIAL_ELIGIBILITY_FORM);
  const [scenarios, setScenarios] = useState([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [clientOptions, setClientOptions] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const inputs = mode === "emi" ? emiForm : eligibilityForm;
  const result = useMemo(() => {
    if (mode === "emi") {
      return calculateEmi({
        principal: Number(emiForm.principal),
        annualRate: Number(emiForm.annualRate),
        tenureMonths: Number(emiForm.tenureMonths),
      });
    }
    return estimateEligibility({
      monthlyIncome: Number(eligibilityForm.monthlyIncome),
      monthlyObligations: Number(eligibilityForm.monthlyObligations),
      annualRate: Number(eligibilityForm.annualRate),
      tenureMonths: Number(eligibilityForm.tenureMonths),
    });
  }, [mode, emiForm, eligibilityForm]);

  const schedule = useMemo(() => {
    const principal = mode === "emi" ? Number(emiForm.principal) : result.maxEligibleAmount;
    const tenureMonths = Number(inputs.tenureMonths);
    const annualRate = Number(inputs.annualRate);
    if (!principal || !tenureMonths) return [];
    return buildAmortizationSchedule({ principal, annualRate, tenureMonths });
  }, [mode, emiForm, inputs, result]);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const { data } = await loanApi.listCalculations();
      setHistory(data.data);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
    crmApi.listLeads({ limit: 100 }).then(({ data }) => setClientOptions(data.data));
  }, []);

  function updateEmi(field) {
    return (e) => setEmiForm((f) => ({ ...f, [field]: e.target.value }));
  }
  function updateEligibility(field) {
    return (e) => setEligibilityForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function addToComparison() {
    if (scenarios.length >= 3) return;
    setScenarios((s) => [
      ...s,
      {
        id: Date.now(),
        mode,
        inputs: { ...inputs },
        result: { ...result },
      },
    ]);
  }

  function removeScenario(id) {
    setScenarios((s) => s.filter((sc) => sc.id !== id));
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Loan Calculation Summary", 14, 18);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString(), 14, 25);

    let y = 38;
    const rows =
      scenarios.length > 0
        ? scenarios
        : [{ mode, inputs, result }];

    rows.forEach((sc, i) => {
      doc.setFontSize(12);
      doc.text(`Scenario ${i + 1} — ${sc.mode === "emi" ? "EMI Calculation" : "Eligibility Estimate"}`, 14, y);
      doc.setFontSize(10);
      y += 7;
      if (sc.mode === "emi") {
        doc.text(`Principal: ${formatCurrency(Number(sc.inputs.principal))}`, 14, y);
        y += 6;
      } else {
        doc.text(`Monthly income: ${formatCurrency(Number(sc.inputs.monthlyIncome))}`, 14, y);
        y += 6;
        doc.text(`Monthly obligations: ${formatCurrency(Number(sc.inputs.monthlyObligations))}`, 14, y);
        y += 6;
      }
      doc.text(`Interest rate: ${sc.inputs.annualRate}% p.a. · Tenure: ${sc.inputs.tenureMonths} months`, 14, y);
      y += 6;
      if (sc.mode === "emi") {
        doc.text(`EMI: ${formatCurrency(sc.result.emi)}/month`, 14, y);
        y += 6;
        doc.text(`Total interest: ${formatCurrency(sc.result.totalInterest)}`, 14, y);
        y += 6;
        doc.text(`Total payment: ${formatCurrency(sc.result.totalPayment)}`, 14, y);
      } else {
        doc.text(`Max affordable EMI: ${formatCurrency(sc.result.maxEmi)}/month`, 14, y);
        y += 6;
        doc.text(`Estimated eligible loan amount: ${formatCurrency(sc.result.maxEligibleAmount)}`, 14, y);
      }
      y += 12;
    });

    doc.save("loan-calculation.pdf");
  }

  async function handleDeleteHistory(id) {
    await loanApi.deleteCalculation(id);
    loadHistory();
  }

  const historyColumns = [
    { key: "label", label: "Label", render: (row) => row.label || (row.type === "emi" ? "EMI calculation" : "Eligibility estimate") },
    { key: "client", label: "Client", render: (row) => row.clientId?.name || "—" },
    { key: "emi", label: "EMI / month", render: (row) => formatCurrency(row.emi) },
    { key: "principal", label: "Amount", render: (row) => formatCurrency(row.principal) },
    ...(isAdmin ? [{ key: "createdBy", label: "By", render: (row) => row.createdBy?.name || "—" }] : []),
    { key: "date", label: "Date", render: (row) => new Date(row.createdAt).toLocaleDateString() },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => handleDeleteHistory(row._id)}>
          <Trash2 size={14} />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">Loan Calculator</h1>
        <p className="mt-1 text-sm text-text-muted">EMI, eligibility, and scenario comparison for client advisory.</p>
      </div>

      <div className="flex gap-2">
        {[
          { value: "emi", label: "EMI Calculator" },
          { value: "eligibility", label: "Eligibility Estimator" },
        ].map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              mode === m.value ? "bg-brand text-white" : "bg-surface-2 text-text-muted hover:text-text"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-4 p-5">
          {mode === "emi" ? (
            <>
              <Input label="Loan amount" type="number" value={emiForm.principal} onChange={updateEmi("principal")} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Interest rate (% p.a.)" type="number" step="0.01" value={emiForm.annualRate} onChange={updateEmi("annualRate")} />
                <Input label="Tenure (months)" type="number" value={emiForm.tenureMonths} onChange={updateEmi("tenureMonths")} />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Monthly income" type="number" value={eligibilityForm.monthlyIncome} onChange={updateEligibility("monthlyIncome")} />
                <Input label="Monthly obligations" type="number" value={eligibilityForm.monthlyObligations} onChange={updateEligibility("monthlyObligations")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Interest rate (% p.a.)" type="number" step="0.01" value={eligibilityForm.annualRate} onChange={updateEligibility("annualRate")} />
                <Input label="Tenure (months)" type="number" value={eligibilityForm.tenureMonths} onChange={updateEligibility("tenureMonths")} />
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button variant="secondary" onClick={addToComparison} disabled={scenarios.length >= 3}>
              <Plus size={15} /> Add to comparison
            </Button>
            <Button variant="secondary" onClick={() => setShowSchedule((s) => !s)}>
              {showSchedule ? "Hide" : "View"} amortization
            </Button>
            <Button variant="secondary" onClick={exportPdf}>
              <Download size={15} /> Export PDF
            </Button>
            <Button onClick={() => setSaveModalOpen(true)}>
              <Save size={15} /> Save to client
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Result</p>
          {mode === "emi" ? (
            <>
              <p className="text-3xl font-bold text-heading">{formatCurrency(result.emi)}</p>
              <p className="text-sm text-text-muted">per month</p>
              <div className="mt-2 grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-xs text-text-muted">Total interest</p>
                  <p className="text-base font-semibold text-heading">{formatCurrency(result.totalInterest)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Total payment</p>
                  <p className="text-base font-semibold text-heading">{formatCurrency(result.totalPayment)}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-heading">{formatCurrency(result.maxEligibleAmount)}</p>
              <p className="text-sm text-text-muted">estimated eligible loan amount</p>
              <div className="mt-2 border-t border-border pt-3">
                <p className="text-xs text-text-muted">Max affordable EMI</p>
                <p className="text-base font-semibold text-heading">{formatCurrency(result.maxEmi)}/month</p>
              </div>
            </>
          )}
        </Card>
      </div>

      {showSchedule && schedule.length > 0 && (
        <Card className="p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Amortization schedule</p>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-border text-text-muted">
                  <th className="py-2 pr-4 font-medium">Month</th>
                  <th className="py-2 pr-4 font-medium">Interest</th>
                  <th className="py-2 pr-4 font-medium">Principal</th>
                  <th className="py-2 pr-4 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.month} className="border-b border-border/60">
                    <td className="py-1.5 pr-4">{row.month}</td>
                    <td className="py-1.5 pr-4">{formatCurrency(row.interest)}</td>
                    <td className="py-1.5 pr-4">{formatCurrency(row.principalPaid)}</td>
                    <td className="py-1.5 pr-4">{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {scenarios.length > 0 && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Scenario comparison</p>
            <Button variant="ghost" size="sm" onClick={() => setScenarios([])}>
              Clear all
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {scenarios.map((sc, i) => (
              <div key={sc.id} className="relative rounded-xl border border-border p-4">
                <button
                  onClick={() => removeScenario(sc.id)}
                  className="absolute right-2 top-2 text-text-muted hover:text-danger"
                  aria-label="Remove scenario"
                >
                  <X size={14} />
                </button>
                <p className="text-sm font-semibold text-heading">Option {i + 1}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {sc.mode === "emi" ? formatCurrency(Number(sc.inputs.principal)) : "Eligibility"} · {sc.inputs.annualRate}% ·{" "}
                  {sc.inputs.tenureMonths}mo
                </p>
                <p className="mt-3 text-lg font-bold text-heading">
                  {formatCurrency(sc.mode === "emi" ? sc.result.emi : sc.result.maxEmi)}
                </p>
                <p className="text-xs text-text-muted">{sc.mode === "emi" ? "EMI/month" : "Max EMI/month"}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-bold text-heading">Saved calculations</h2>
        {historyLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size={24} />
          </div>
        ) : history.length === 0 ? (
          <EmptyState icon={Calculator} title="No saved calculations yet" description="Save a calculation against a client to see it here." />
        ) : (
          <Table columns={historyColumns} data={history} keyField="_id" />
        )}
      </div>

      {saveModalOpen && (
        <SaveCalculationModal
          mode={mode}
          inputs={inputs}
          result={result}
          clientOptions={clientOptions}
          onClose={() => setSaveModalOpen(false)}
          onSaved={() => {
            setSaveModalOpen(false);
            loadHistory();
          }}
        />
      )}
    </div>
  );
}
