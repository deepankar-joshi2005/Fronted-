import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Landmark, Lock, CheckCircle2 } from "lucide-react";
import * as publicEmployeeFormApi from "../../api/publicEmployeeForm.api.js";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Spinner from "../../components/ui/Spinner.jsx";

const EMPTY_FORM = {
  phone: "",
  email: "",
  designation: "",
  dateOfJoining: "",
  fatherOrHusbandName: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  pan: "",
  bankAccountNumber: "",
  bankIfsc: "",
  bankName: "",
  accountHolderName: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

function Header({ companyName }: { companyName?: string }) {
  return (
    <header className="border-b border-border bg-surface/80 py-4">
      <div className="mx-auto flex max-w-2xl items-center gap-2.5 px-4 sm:px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white">
          <Landmark size={18} />
        </div>
        <span className="text-lg font-bold text-heading">Praxis</span>
        {companyName && <span className="ml-auto text-sm text-text-muted">for {companyName}</span>}
      </div>
    </header>
  );
}

function Shell({ children, companyName }: { children: React.ReactNode; companyName?: string }) {
  return (
    <div className="flex min-h-svh flex-col bg-bg">
      <Header companyName={companyName} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}

export default function PublicEmployeeFormPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [companyName, setCompanyName] = useState("");

  const [employeeCode, setEmployeeCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [idError, setIdError] = useState("");
  const [formToken, setFormToken] = useState(null);
  const [employeeName, setEmployeeName] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    publicEmployeeFormApi
      .getPublicBusinessClient(token)
      .then(({ data }) => {
        setCompanyName(data.data.companyName);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleIdentify(e) {
    e.preventDefault();
    setIdError("");
    setVerifying(true);
    try {
      const { data } = await publicEmployeeFormApi.identifyEmployee(token, employeeCode);
      setFormToken(data.data.formToken);
      setEmployeeName(data.data.name);
    } catch (err: any) {
      setIdError(err.response?.data?.message || "Employee ID not found");
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    if (!form.phone || !form.designation || !form.dateOfJoining) {
      setSubmitError("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await publicEmployeeFormApi.submitEmployeeForm(token, formToken, form);
      setSubmitted(true);
    } catch (err: any) {
      const fieldErrors = err.response?.data?.errors;
      const detail = fieldErrors && Object.entries(fieldErrors).map(([field, msgs]: any) => `${field}: ${msgs.join(", ")}`).join(" · ");
      setSubmitError(detail || err.response?.data?.message || "Could not submit your details — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center">
          <Spinner size={28} />
        </div>
      </Shell>
    );
  }

  if (notFound) {
    return (
      <Shell>
        <Card className="p-8 text-center">
          <p className="text-lg font-semibold text-heading">This link is invalid</p>
          <p className="mt-2 text-sm text-text-muted">
            The onboarding link you followed doesn't exist, or is no longer active. Please check with your employer
            for the correct link.
          </p>
        </Card>
      </Shell>
    );
  }

  if (submitted) {
    return (
      <Shell companyName={companyName}>
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 size={40} className="text-success" />
          <p className="text-lg font-semibold text-heading">Thanks, {employeeName.split(" ")[0]}!</p>
          <p className="text-sm text-text-muted">
            Your details have been submitted to <strong className="text-text">{companyName}</strong>. You can close
            this page now.
          </p>
        </Card>
      </Shell>
    );
  }

  if (!formToken) {
    return (
      <Shell companyName={companyName}>
        <Card className="mx-auto w-full max-w-sm p-8">
          <div className="mb-5 flex flex-col items-center gap-2 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Lock size={20} />
            </div>
            <p className="text-lg font-semibold text-heading">Join {companyName}</p>
            <p className="text-sm text-text-muted">Enter your Employee ID (given to you by {companyName}) to continue.</p>
          </div>
          <form onSubmit={handleIdentify} className="flex flex-col gap-4">
            {idError && (
              <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
                {idError}
              </div>
            )}
            <Input
              type="text"
              placeholder="Your Employee ID"
              autoFocus
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
            />
            <Button type="submit" loading={verifying}>
              Continue
            </Button>
          </form>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell companyName={companyName}>
      <div>
        <h1 className="text-xl font-bold text-heading">Hi {employeeName.split(" ")[0]}, please fill in your details</h1>
        <p className="mt-1 text-sm text-text-muted">{companyName} will review them.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {submitError && (
            <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
              {submitError}
            </div>
          )}

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Your Details</p>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Phone Number" required value={form.phone} onChange={update("phone")} />
                <Input label="Personal Email" type="email" value={form.email} onChange={update("email")} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Father's / Husband's Name"
                  value={form.fatherOrHusbandName}
                  onChange={update("fatherOrHusbandName")}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={update("dateOfBirth")} />
                <Select label="Gender" value={form.gender} onChange={update("gender")}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <Input label="Current Address" value={form.address} onChange={update("address")} />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Role</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Designation" required value={form.designation} onChange={update("designation")} />
              <Input
                label="Date of Joining"
                type="date"
                required
                value={form.dateOfJoining}
                onChange={update("dateOfJoining")}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Bank &amp; ID (optional — for payroll)
            </p>
            <div className="flex flex-col gap-4">
              <Input label="PAN" value={form.pan} onChange={update("pan")} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Account Holder Name" value={form.accountHolderName} onChange={update("accountHolderName")} />
                <Input label="Bank Name" value={form.bankName} onChange={update("bankName")} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Bank Account Number" value={form.bankAccountNumber} onChange={update("bankAccountNumber")} />
                <Input label="Bank IFSC Code" value={form.bankIfsc} onChange={update("bankIfsc")} />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Emergency Contact</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Contact Name" value={form.emergencyContactName} onChange={update("emergencyContactName")} />
              <Input label="Contact Phone" value={form.emergencyContactPhone} onChange={update("emergencyContactPhone")} />
            </div>
          </div>

          <Button type="submit" loading={submitting} className="mt-2">
            Submit my details
          </Button>
        </form>
      </Card>
    </Shell>
  );
}
