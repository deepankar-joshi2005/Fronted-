import { useState, useMemo } from "react";
import type { CSSProperties } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2,
  User,
  CheckCircle2,
  ShieldCheck,
  Users,
  ChevronLeft,
  ChevronRight,
  Globe,
  FileText,
  Upload,
  CreditCard,
  Rocket,
  X,
  MapPin,
  Phone,
  Mail,
  Lock,
} from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "sonner";
import { isValidEmail, getGstinError, getPhoneNumberError } from "@/utils/validation";

/* ── Reusable styled input ─────────────────────────────── */
function PremiumInput({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  required,
  icon,
  className = "",
  uppercase = false,
  error,
}: {
  id: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  required?: boolean;
  icon?: React.ReactNode;
  className?: string;
  uppercase?: boolean;
  error?: string | null;
}) {
  const errorBorderColor = "#ef4444";
  const defaultBorderColor = "color-mix(in srgb, var(--primary) 15%, var(--border))";

  const baseStyle: CSSProperties = {
    width: "100%",
    height: "44px",
    paddingLeft: icon ? "42px" : "14px",
    paddingRight: "14px",
    background: "color-mix(in srgb, var(--primary) 4%, var(--background))",
    border: `1.5px solid ${error ? errorBorderColor : defaultBorderColor}`,
    borderRadius: "0.75rem",
    fontSize: "0.875rem",
    color: "var(--foreground)",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
    textTransform: uppercase ? "uppercase" : undefined,
  };

  return (
    <div className={`relative ${className}`}>
      {icon && (
        <span
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--muted-foreground)" }}
        >
          {icon}
        </span>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        style={baseStyle}
        onFocus={(e) => {
          e.target.style.borderColor = error ? errorBorderColor : "var(--primary)";
          e.target.style.boxShadow = `0 0 0 3px ${
            error ? "rgba(239, 68, 68, 0.14)" : "color-mix(in srgb, var(--primary) 14%, transparent)"
          }`;
          e.target.style.background = "color-mix(in srgb, var(--primary) 6%, var(--background))";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? errorBorderColor : defaultBorderColor;
          e.target.style.boxShadow = "none";
          e.target.style.background = "color-mix(in srgb, var(--primary) 4%, var(--background))";
          onBlur?.(e);
        }}
      />
      {error && (
        <p className="mt-1 text-xs" style={{ color: errorBorderColor }}>
          {error}
        </p>
      )}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="text-[10px] font-semibold uppercase tracking-widest block mb-1"
      style={{ color: "var(--muted-foreground)" }}
    >
      {children}
    </label>
  );
}

export default function CompanyRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ gstNo?: string; adminEmail?: string; adminPhone?: string }>({});
  const [formData, setFormData] = useState({
    companyName: "",
    logo: "",
    industry: "",
    website: "",
    gstNo: "",
    city: "",
    state: "",
    address: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    adminPhone: "",
    employeeCount: 10,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const pricePerEmployee = 25;
  const totalMonthly = useMemo(() => formData.employeeCount * pricePerEmployee, [formData.employeeCount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: id === "employeeCount" ? parseInt(value) || 0 : value }));
    if ((id === "gstNo" || id === "adminEmail" || id === "adminPhone") && fieldErrors[id as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [id]: undefined }));
    }
  };

  const validateGstField = (value: string) => {
    setFieldErrors((prev) => ({ ...prev, gstNo: getGstinError(value) || undefined }));
  };

  const validateAdminEmailField = (value: string) => {
    const trimmed = value.trim();
    setFieldErrors((prev) => ({
      ...prev,
      adminEmail: trimmed && !isValidEmail(trimmed) ? "Enter a valid email address" : undefined,
    }));
  };

  const validateAdminPhoneField = (value: string) => {
    setFieldErrors((prev) => ({ ...prev, adminPhone: getPhoneNumberError(value) || undefined }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File too large", { description: "Logo must be less than 2MB" });
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.companyName || !logoFile || !formData.industry) {
        toast.error("Required fields missing", { description: "Please provide Company Name, Upload Logo, and Industry." });
        return;
      }
      const gstError = getGstinError(formData.gstNo);
      if (gstError) {
        setFieldErrors((prev) => ({ ...prev, gstNo: gstError }));
        toast.error("Invalid GST Number", { description: gstError });
        return;
      }
    } else if (step === 2) {
      if (!formData.city || !formData.state || !formData.address) {
        toast.error("Location missing", { description: "Please provide City, State, and Address." });
        return;
      }
    } else if (step === 3) {
      if (!formData.adminName || !formData.adminEmail || !formData.adminPassword || !formData.adminPhone) {
        toast.error("Admin details missing", { description: "Please complete the admin account details." });
        return;
      }
      if (!isValidEmail(formData.adminEmail)) {
        setFieldErrors((prev) => ({ ...prev, adminEmail: "Enter a valid email address" }));
        toast.error("Invalid email", { description: "Please enter a valid corporate email address." });
        return;
      }
      const phoneError = getPhoneNumberError(formData.adminPhone);
      if (phoneError) {
        setFieldErrors((prev) => ({ ...prev, adminPhone: phoneError }));
        toast.error("Invalid phone number", { description: phoneError });
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value.toString());
      });
      if (logoFile) data.append("logo", logoFile);

      await axiosInstance.post("/saas/register", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Registration Successful!", {
        description: "Your HRMS is being provisioned. Please login with your admin credentials.",
      });
      navigate("/login");
    } catch (error: any) {
      toast.error("Registration Failed", {
        description: error.response?.data?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Step metadata ── */
  const steps = [
    { label: "Company", icon: <Building2 className="w-3.5 h-3.5" /> },
    { label: "Location", icon: <MapPin className="w-3.5 h-3.5" /> },
    { label: "Admin", icon: <User className="w-3.5 h-3.5" /> },
    { label: "Scale", icon: <CreditCard className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      ref={setRootEl}
      className="force-light-theme flex flex-col lg:flex-row bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--primary)] selection:text-white lg:h-screen overflow-hidden">

      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--stem-technology)] relative overflow-hidden h-screen sticky top-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--stem-technology)] via-[color-mix(in_srgb,_var(--stem-technology)_80%,_var(--soft-engineering))] to-[var(--soft-science)] opacity-60" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full blur-xl bg-[var(--soft-engineering)]" />
        <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full blur-2xl bg-[var(--soft-science)]" />
        <div className="absolute top-1/2 left-10 w-24 h-24 rounded-full blur-lg bg-[var(--soft-mathematics)]" />

        <div className="mx-auto relative z-10 flex flex-col justify-center items-center text-center p-12">
          <div className="mb-6">
            <div className="w-[200px] h-[200px] rounded-full backdrop-blur-sm shadow-2xl flex items-center justify-center mb-6 bg-[color-mix(in_srgb,_white_16%,_transparent)]">
              <img src="/hrms-logo.svg" alt="HRMS" className="w-[160px] h-[160px] object-cover rounded-full" />
            </div>
          </div>
          <p className="text-4xl font-bold text-[var(--sidebar-foreground)] mb-4">Launch Your Workspace</p>
          <p className="text-xl text-[color-mix(in_srgb,_white_88%,_transparent)] mb-8 max-w-md">
            Configure your professional HR ecosystem in 4 simple steps. Pay only for the seats you need.
          </p>

          {/* Step progress */}
          <div className="w-full max-w-xs space-y-4">
            <div className="flex justify-between text-sm font-black text-white/80 px-1 uppercase tracking-tighter">
              {steps.map((_, i) => (
                <span key={i} className={step >= i + 1 ? "text-white" : ""}>{`0${i + 1}`}</span>
              ))}
            </div>
            <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden p-[2px]">
              <div
                className="h-full bg-white rounded-full transition-all duration-700 ease-in-out shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-6 text-xs font-black text-white/90 uppercase tracking-[0.2em]">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant Setup</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 15-Day Trial</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> SaaS Billing</span>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="w-full lg:w-1/2 flex flex-col bg-[var(--background)] relative overflow-y-auto overflow-x-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[var(--primary)] opacity-[0.06] blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--soft-science)] opacity-[0.07] blur-[120px] rounded-full pointer-events-none" />

        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-10">
          <div className="w-full max-w-lg relative z-10">



            {/* ── Premium Card ── */}
            <div
              style={{
                background: "var(--card)",
                border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))",
                borderRadius: "1.25rem",
                boxShadow:
                  "0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 60px -10px color-mix(in srgb, var(--primary) 12%, transparent), 0 0 0 1px color-mix(in srgb, var(--primary) 6%, transparent)",
                overflow: "hidden",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Gradient top bar */}
              <div style={{ height: "3px", background: "linear-gradient(90deg, var(--stem-technology), var(--soft-engineering), var(--soft-science))" }} />

              <div className="px-6 sm:px-8 pt-6 pb-6">
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* ══ STEP 1: COMPANY PROFILE ══ */}
                  {step === 1 && (
                    <div className="space-y-5 animate-in fade-in duration-500">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-1">
                        <div
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl shadow-md shrink-0"
                          style={{ background: "linear-gradient(135deg, var(--stem-technology), var(--soft-engineering))" }}
                        >
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Company Profile</h2>
                          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Essential details to identify your company.</p>
                        </div>
                      </div>

                      {/* Logo Upload */}
                      <div>
                        <FieldLabel>Company Logo <span className="text-red-500 normal-case">*</span> <span className="normal-case font-normal opacity-70">(PNG / JPG, max 2MB)</span></FieldLabel>
                        <div
                          className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer group"
                          style={{
                            background: "color-mix(in srgb, var(--primary) 3%, var(--background))",
                            borderColor: logoFile ? "var(--primary)" : "color-mix(in srgb, var(--primary) 20%, var(--border))",
                          }}
                          onClick={() => !logoFile && document.getElementById("logo")?.click()}
                        >
                          {logoPreview ? (
                            <div className="relative shrink-0">
                              <img src={logoPreview} alt="Logo Preview" className="w-14 h-14 rounded-xl object-contain border" style={{ borderColor: "var(--border)", background: "var(--background)" }} />
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setLogoFile(null); setLogoPreview(""); }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-lg hover:bg-red-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div
                              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-all"
                              style={{ background: "color-mix(in srgb, var(--primary) 8%, var(--background))", color: "var(--primary)" }}
                            >
                              <Upload className="w-5 h-5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <input id="logo" type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} className="hidden" required={!logoFile} />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); document.getElementById("logo")?.click(); }}
                              className="text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200"
                              style={{
                                background: "linear-gradient(135deg, var(--stem-technology), var(--soft-engineering))",
                                color: "white",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              {logoFile ? "Change Image" : "Select Logo"}
                            </button>
                            <p className="text-[10px] mt-1.5" style={{ color: "var(--muted-foreground)" }}>
                              {logoFile ? logoFile.name : "PNG or JPG • Max 2MB"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Company Name */}
                      <div>
                        <FieldLabel>Legal Company Name <span className="text-red-500">*</span></FieldLabel>
                        <PremiumInput
                          id="companyName"
                          placeholder="e.g. Acme Pvt Ltd"
                          value={formData.companyName}
                          onChange={handleChange}
                          required
                          icon={<Building2 className="w-4 h-4" />}
                        />
                      </div>

                      {/* Industry */}
                      <div>
                        <FieldLabel>Industry <span className="text-red-500">*</span></FieldLabel>
                        <Select onValueChange={(v) => handleSelectChange("industry", v)}>
                          <SelectTrigger
                            id="industry"
                            style={{
                              height: "44px",
                              background: "color-mix(in srgb, var(--primary) 4%, var(--background))",
                              border: "1.5px solid color-mix(in srgb, var(--primary) 15%, var(--border))",
                              borderRadius: "0.75rem",
                              fontSize: "0.875rem",
                            }}
                          >
                            <SelectValue placeholder="Select Industry" />
                          </SelectTrigger>
                          <SelectContent container={rootEl}>
                            {["Technology", "Healthcare", "Finance", "Education", "Manufacturing", "Retail", "Services", "Logistics", "Other"].map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Website + GST */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>Website</FieldLabel>
                          <PremiumInput
                            id="website"
                            placeholder="www.techize.com"
                            value={formData.website}
                            onChange={handleChange}
                            icon={<Globe className="w-4 h-4" />}
                          />
                        </div>
                        <div>
                          <FieldLabel>GST Number</FieldLabel>
                          <PremiumInput
                            id="gstNo"
                            placeholder="22ABCDE1234F1Z5"
                            value={formData.gstNo}
                            onChange={handleChange}
                            onBlur={(e) => validateGstField(e.target.value)}
                            icon={<FileText className="w-4 h-4" />}
                            uppercase
                            error={fieldErrors.gstNo}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══ STEP 2: LOCATION ══ */}
                  {step === 2 && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl shadow-md shrink-0" style={{ background: "linear-gradient(135deg, var(--stem-technology), var(--soft-engineering))" }}>
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Base Location</h2>
                          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Where is your headquarters located?</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>City <span className="text-red-500">*</span></FieldLabel>
                          <PremiumInput id="city" placeholder="e.g. Mumbai" value={formData.city} onChange={handleChange} required icon={<MapPin className="w-4 h-4" />} />
                        </div>
                        <div>
                          <FieldLabel>State / Region <span className="text-red-500">*</span></FieldLabel>
                          <PremiumInput id="state" placeholder="e.g. Maharashtra" value={formData.state} onChange={handleChange} required />
                        </div>
                      </div>

                      <div>
                        <FieldLabel>Corporate Address <span className="text-red-500">*</span></FieldLabel>
                        <textarea
                          id="address"
                          placeholder="Full address here..."
                          value={formData.address}
                          onChange={handleChange}
                          rows={4}
                          required
                          style={{
                            width: "100%",
                            padding: "12px 14px",
                            background: "color-mix(in srgb, var(--primary) 4%, var(--background))",
                            border: "1.5px solid color-mix(in srgb, var(--primary) 15%, var(--border))",
                            borderRadius: "0.75rem",
                            fontSize: "0.875rem",
                            color: "var(--foreground)",
                            outline: "none",
                            resize: "vertical",
                            transition: "border-color 0.2s, box-shadow 0.2s",
                            lineHeight: "1.5",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "var(--primary)";
                            e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--primary) 14%, transparent)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "color-mix(in srgb, var(--primary) 15%, var(--border))";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ══ STEP 3: ADMIN CREDENTIALS ══ */}
                  {step === 3 && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl shadow-md shrink-0" style={{ background: "linear-gradient(135deg, var(--stem-technology), var(--soft-engineering))" }}>
                          <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Admin Credentials</h2>
                          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Set up the primary account for workspace control.</p>
                        </div>
                      </div>

                      <div>
                        <FieldLabel>Super Admin Name <span className="text-red-500">*</span></FieldLabel>
                        <PremiumInput id="adminName" placeholder="Full Name" value={formData.adminName} onChange={handleChange} required icon={<User className="w-4 h-4" />} />
                      </div>

                      <div>
                        <FieldLabel>Corporate Email <span className="text-red-500">*</span></FieldLabel>
                        <PremiumInput
                          id="adminEmail"
                          type="email"
                          placeholder="admin@company.com"
                          value={formData.adminEmail}
                          onChange={handleChange}
                          onBlur={(e) => validateAdminEmailField(e.target.value)}
                          required
                          icon={<Mail className="w-4 h-4" />}
                          error={fieldErrors.adminEmail}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>Initial Password <span className="text-red-500">*</span></FieldLabel>
                          <PremiumInput id="adminPassword" type="password" placeholder="••••••••" value={formData.adminPassword} onChange={handleChange} required icon={<Lock className="w-4 h-4" />} />
                        </div>
                        <div>
                          <FieldLabel>Phone Number <span className="text-red-500">*</span></FieldLabel>
                          <PremiumInput
                            id="adminPhone"
                            type="tel"
                            placeholder="+91 00000 00000"
                            value={formData.adminPhone}
                            onChange={handleChange}
                            onBlur={(e) => validateAdminPhoneField(e.target.value)}
                            required
                            icon={<Phone className="w-4 h-4" />}
                            error={fieldErrors.adminPhone}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══ STEP 4: SUBSCRIPTION & SCALE ══ */}
                  {step === 4 && (
                    <div className="space-y-5 animate-in fade-in duration-500">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl shadow-md shrink-0" style={{ background: "linear-gradient(135deg, var(--stem-technology), var(--soft-engineering))" }}>
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Scale Your Team</h2>
                          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Configure workspace size and check pricing.</p>
                        </div>
                      </div>

                      {/* Seat selector + price */}
                      <div
                        className="rounded-xl p-5"
                        style={{
                          background: "color-mix(in srgb, var(--primary) 4%, var(--background))",
                          border: "1.5px solid color-mix(in srgb, var(--primary) 15%, var(--border))",
                        }}
                      >
                        <FieldLabel>Total Active Employee Seats</FieldLabel>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="relative flex-1">
                            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                            <input
                              id="employeeCount"
                              type="number"
                              min="1"
                              value={formData.employeeCount}
                              onChange={handleChange}
                              required
                              style={{
                                width: "100%",
                                height: "50px",
                                paddingLeft: "42px",
                                paddingRight: "14px",
                                background: "var(--background)",
                                border: "1.5px solid color-mix(in srgb, var(--primary) 15%, var(--border))",
                                borderRadius: "0.75rem",
                                fontSize: "1.1rem",
                                fontWeight: "700",
                                color: "var(--foreground)",
                                outline: "none",
                                transition: "border-color 0.2s, box-shadow 0.2s",
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = "var(--primary)";
                                e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--primary) 14%, transparent)";
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = "color-mix(in srgb, var(--primary) 15%, var(--border))";
                                e.target.style.boxShadow = "none";
                              }}
                            />
                          </div>
                          <div
                            className="px-5 py-3 rounded-xl shadow-lg text-center shrink-0"
                            style={{ background: "linear-gradient(135deg, var(--stem-technology), var(--soft-engineering))", color: "white" }}
                          >
                            <span className="text-[10px] font-bold uppercase opacity-75 block">Monthly</span>
                            <span className="text-2xl font-black tracking-tighter">₹{totalMonthly}</span>
                          </div>
                        </div>
                        <p className="mt-3 text-xs flex items-center gap-1.5" style={{ color: "var(--primary)" }}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Priced at ₹25 per active employee seat/month
                        </p>
                      </div>

                      {/* Trial info box */}
                      <div
                        className="rounded-xl p-5 flex gap-4"
                        style={{
                          background: "color-mix(in srgb, var(--soft-engineering) 6%, var(--background))",
                          border: "1.5px solid color-mix(in srgb, var(--soft-engineering) 20%, var(--border))",
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: "color-mix(in srgb, var(--stem-technology) 12%, var(--background))", color: "var(--stem-technology)" }}
                        >
                          <Rocket className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>15-Day Premium Trial Included</h4>
                          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                            Full platform access from day one. Billing starts only after your trial period ends.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Footer Navigation ── */}
                  <div
                    className="pt-4 flex items-center gap-3"
                    style={{ borderTop: "1px solid color-mix(in srgb, var(--border) 80%, transparent)" }}
                  >
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 font-semibold px-5 transition-all duration-200 focus:outline-none"
                        style={{
                          height: "44px",
                          borderRadius: "0.75rem",
                          background: "transparent",
                          border: "1.5px solid color-mix(in srgb, var(--primary) 25%, var(--border))",
                          color: "var(--muted-foreground)",
                          fontSize: "0.875rem",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary)";
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--primary)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "color-mix(in srgb, var(--primary) 25%, var(--border))";
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
                        }}
                      >
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>
                    )}

                    {step < 4 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="relative flex-1 overflow-hidden font-semibold text-white focus:outline-none transition-all duration-300"
                        style={{
                          height: "46px",
                          borderRadius: "0.85rem",
                          background: "linear-gradient(135deg, var(--stem-technology) 0%, var(--soft-engineering) 60%, var(--soft-science) 100%)",
                          boxShadow: "0 4px 15px color-mix(in srgb, var(--primary) 35%, transparent)",
                          fontSize: "0.95rem",
                          border: "none",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px color-mix(in srgb, var(--primary) 45%, transparent)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 15px color-mix(in srgb, var(--primary) 35%, transparent)";
                        }}
                      >
                        {/* shimmer */}
                        <span
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                            backgroundSize: "200% 100%",
                            animation: "shimmer 2.5s infinite",
                          }}
                        />
                        <span className="relative flex items-center justify-center gap-2">
                          Continue <ChevronRight className="w-4 h-4" />
                        </span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="relative flex-1 overflow-hidden font-semibold text-white focus:outline-none transition-all duration-300"
                        style={{
                          height: "46px",
                          borderRadius: "0.85rem",
                          background: isSubmitting
                            ? "color-mix(in srgb, var(--primary) 70%, transparent)"
                            : "linear-gradient(135deg, var(--stem-technology) 0%, var(--soft-engineering) 60%, var(--soft-science) 100%)",
                          boxShadow: isSubmitting ? "none" : "0 4px 15px color-mix(in srgb, var(--primary) 35%, transparent)",
                          fontSize: "0.95rem",
                          border: "none",
                          cursor: isSubmitting ? "not-allowed" : "pointer",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSubmitting) {
                            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px color-mix(in srgb, var(--primary) 45%, transparent)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 15px color-mix(in srgb, var(--primary) 35%, transparent)";
                        }}
                      >
                        {!isSubmitting && (
                          <span
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                              backgroundSize: "200% 100%",
                              animation: "shimmer 2.5s infinite",
                            }}
                          />
                        )}
                        {isSubmitting ? (
                          <span className="flex items-center justify-center gap-2.5">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" style={{ animation: "spin 0.7s linear infinite" }} />
                            Deploying…
                          </span>
                        ) : (
                          <span className="relative flex items-center justify-center gap-2">
                            Deploy HRMS <CheckCircle2 className="w-4 h-4" />
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </form>

                <style>{`
                  @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                  }
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            </div>

            {/* Already have account */}
            <div className="mt-5 text-center">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Already have an account?{" "}
                <Link to="/login" className="font-semibold hover:underline underline-offset-2" style={{ color: "var(--primary)" }}>
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
