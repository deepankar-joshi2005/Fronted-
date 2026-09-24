import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Banknote, RefreshCw, Download, ClipboardList } from "lucide-react";
import * as businessClientApi from "../../../api/businessClient.api.js";
import * as payrollApi from "../../../api/clientPayroll.api";
import { useAuth } from "../../../hooks/useAuth";
import Button from "../../../components/ui/Button.jsx";
import Card from "../../../components/ui/Card.jsx";
import Table from "../../../components/ui/Table.jsx";
import Spinner from "../../../components/ui/Spinner.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const currency = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

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

export default function ClientPaymentFilePage() {
  const { clientId, month } = useParams();
  const { basePath } = useAuth();

  const [client, setClient] = useState<any>(null);
  const [run, setRun] = useState<any>(null);
  const [paymentFile, setPaymentFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!clientId || !month) return;
    setLoading(true);
    try {
      const [clientRes, fileRes] = await Promise.all([
        businessClientApi.getBusinessClient(clientId),
        payrollApi.getPaymentFile(clientId, month),
      ]);
      setClient(clientRes.data.data);
      setRun(fileRes.data.run);
      setPaymentFile(fileRes.data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, month]);

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const { data } = await payrollApi.generatePaymentFile(clientId!, month!);
      setPaymentFile(data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not generate the Payment File");
    } finally {
      setGenerating(false);
    }
  }

  async function handleExport() {
    const { data } = await payrollApi.exportPaymentFile(clientId!, month!);
    downloadBlob(data, `${client?.name || "client"}_Payment_File_${month}.xlsx`);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  const canGenerate = run && run.status !== "Draft";

  const columns = [
    { key: "employeeCode", label: "Emp ID" },
    { key: "employeeName", label: "Employee Name" },
    { key: "accountHolderName", label: "Account Holder Name" },
    { key: "bankName", label: "Bank Name" },
    { key: "bankAccountNumber", label: "Bank Account Number" },
    { key: "bankIfsc", label: "IFSC Code" },
    { key: "netPayment", label: "Net Payment", align: "center" as const, render: (row: any) => currency(row.netPayment) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to={`${basePath}/clients/${clientId}/payroll/${month}`} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-2 hover:text-text">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-heading">Payment File — {monthLabel(month!)}</h1>
            <p className="mt-1 text-sm text-text-muted">{client?.name} — bank-ready net payment file.</p>
          </div>
        </div>
        {canGenerate && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleGenerate} loading={generating}>
              <RefreshCw size={15} /> {paymentFile ? "Regenerate" : "Generate"}
            </Button>
            {paymentFile && (
              <Button variant="brand" size="sm" onClick={handleExport}>
                <Download size={15} /> Export Excel
              </Button>
            )}
          </div>
        )}
      </div>

      {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}

      {!canGenerate ? (
        <Card className="p-4 sm:p-5">
          <EmptyState
            icon={Banknote}
            title="Payroll hasn't been run for this month yet"
            description="A Payment File can only be generated once this month's payroll has been run — Net Payment needs to be final first."
            action={
              <Link to={`${basePath}/clients/${clientId}/payroll/${month}`}>
                <Button variant="brand" size="sm">
                  <ClipboardList size={14} /> Go to Payroll Run
                </Button>
              </Link>
            }
          />
        </Card>
      ) : !paymentFile ? (
        <Card className="p-4 sm:p-5">
          <EmptyState
            icon={Banknote}
            title="No Payment File generated yet"
            description="Generate it from this month's payroll run — it'll pull each employee's Net Payment and bank details."
            action={
              <Button variant="brand" size="sm" onClick={handleGenerate} loading={generating}>
                <RefreshCw size={14} /> Generate Payment File
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-heading">{paymentFile.rows.length} employee(s)</h2>
              <p className="text-sm text-text-muted">
                Generated {new Date(paymentFile.generatedAt).toLocaleString("en-IN")}
                {paymentFile.generatedBy?.name && ` by ${paymentFile.generatedBy.name}`}
              </p>
            </div>
            <p className="text-lg font-bold text-heading">Total: {currency(paymentFile.totalAmount)}</p>
          </div>
          <Table columns={columns} data={paymentFile.rows} keyField="clientEmployeeId" />
        </Card>
      )}
    </div>
  );
}
