import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.js";
import { getRoleBasePath } from "../../config/roles.js";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { sanitizePhone, validatePhone, validateEmail } from "../../utils/validators.js";

const INITIAL_FORM = { firmName: "", adminName: "", adminEmail: "", phone: "", password: "" };

const SANITIZERS = {
  phone: sanitizePhone,
};

export default function SignupForm() {
  const registerFirm = useAuthStore((s) => s.registerFirm);
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const VALIDATORS = {
    adminEmail: (v) => validateEmail(v, true),
    phone: (v) => validatePhone(v, false),
  };

  function update(field) {
    return (e) => {
      const raw = e.target.value;
      const value = SANITIZERS[field] ? SANITIZERS[field](raw) : raw;
      setForm((f) => ({ ...f, [field]: value }));
      setFieldErrors((fe) => (field in fe ? { ...fe, [field]: VALIDATORS[field] ? VALIDATORS[field](value) : "" } : fe));
    };
  }

  function handleBlur(field) {
    return () => {
      if (!VALIDATORS[field]) return;
      setFieldErrors((fe) => ({ ...fe, [field]: VALIDATORS[field](form[field] || "") }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const errors = {};
    for (const field of Object.keys(VALIDATORS)) {
      const msg = VALIDATORS[field](form[field] || "");
      if (msg) errors[field] = msg;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the highlighted fields");
      return;
    }
    setLoading(true);
    try {
      const user = await registerFirm(form);
      navigate(getRoleBasePath(user.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}
      <Input
        label="CA firm name"
        name="firmName"
        required
        value={form.firmName}
        onChange={update("firmName")}
        placeholder="Sharma & Associates"
      />
      <Input
        label="Your name"
        name="adminName"
        required
        value={form.adminName}
        onChange={update("adminName")}
        placeholder="CA Amit Sharma"
      />
      <Input
        label="Work email"
        type="email"
        name="adminEmail"
        autoComplete="email"
        required
        value={form.adminEmail}
        onChange={update("adminEmail")}
        onBlur={handleBlur("adminEmail")}
        error={fieldErrors.adminEmail}
        placeholder="you@firm.com"
      />
      <Input
        label="Phone"
        name="phone"
        value={form.phone}
        onChange={update("phone")}
        onBlur={handleBlur("phone")}
        error={fieldErrors.phone}
        placeholder="10-digit mobile number"
        inputMode="numeric"
        maxLength={10}
      />
      <Input
        label="Password"
        type="password"
        name="password"
        autoComplete="new-password"
        required
        minLength={8}
        value={form.password}
        onChange={update("password")}
        placeholder="At least 8 characters"
      />
      <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
        Create my firm's account
      </Button>
      <p className="text-center text-xs text-text-muted">
        You'll be set up as the CA Firm Admin on a 14-day free trial.
      </p>
    </form>
  );
}
