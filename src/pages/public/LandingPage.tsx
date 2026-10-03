import { Link } from "react-router-dom";
import {
  Users,
  Contact2,
  ClipboardCheck,
  Calculator,
  Wallet,
  ArrowRight,
  Sparkles,
  Building2,
  Briefcase,
  Mail,
  User,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check,
  MessageSquare,
  PiggyBank,
} from "lucide-react";

const MODULES = [
  {
    id: "hrms",
    icon: Users,
    title: "HRMS",
    category: "Workforce & HR",
    desc: "Give your business clients a lightweight HR system — employee records, attendance, leave and payroll inputs.",
    gradient: "from-blue-600 to-indigo-600",
    shadowColor: "shadow-blue-500/25",
    cardBg: "bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/30",
    borderColor: "border-blue-200/90 dark:border-blue-900/60 hover:border-blue-400 dark:hover:border-blue-600",
    tagBg: "bg-blue-100/80 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300",
    topAccent: "from-blue-500 via-indigo-500 to-blue-600",
    features: ["Employee Records", "Attendance & Leave", "Self-service Portal"],
  },
  {
    id: "crm",
    icon: Contact2,
    title: "CRM",
    category: "Client Pipeline",
    desc: "Track leads and prospects, manage follow-ups and communication history, and convert prospects into clients.",
    gradient: "from-purple-600 to-fuchsia-600",
    shadowColor: "shadow-purple-500/25",
    cardBg: "bg-gradient-to-br from-purple-50/80 via-white to-fuchsia-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-purple-950/30",
    borderColor: "border-purple-200/90 dark:border-purple-900/60 hover:border-purple-400 dark:hover:border-purple-600",
    tagBg: "bg-purple-100/80 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300",
    topAccent: "from-purple-500 via-fuchsia-500 to-pink-500",
    features: ["Lead Tracking", "Follow-up Reminders", "Conversion Funnel"],
  },
  {
    id: "compliance",
    icon: ClipboardCheck,
    title: "Compliance Tool",
    category: "Tax & Statutory",
    desc: "Recurring GST, TDS and ROC templates assigned to clients and staff, with deadline tracking and reminders.",
    gradient: "from-emerald-600 to-teal-600",
    shadowColor: "shadow-emerald-500/25",
    cardBg: "bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/30",
    borderColor: "border-emerald-200/90 dark:border-emerald-900/60 hover:border-emerald-400 dark:hover:border-emerald-600",
    tagBg: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300",
    topAccent: "from-emerald-500 via-teal-500 to-cyan-500",
    features: ["GST, TDS & ROC", "Deadline Alerts", "Staff Allocation"],
  },
  {
    id: "finance-tracker",
    icon: PiggyBank,
    title: "Personal Finance Tracker",
    category: "Wealth & Debt Advisory",
    desc: "5-step financial health assessment, income vs expense tracking, loan liability analysis, and branded PDF advisory reports.",
    gradient: "from-amber-500 to-orange-500",
    shadowColor: "shadow-amber-500/25",
    cardBg: "bg-gradient-to-br from-amber-50/80 via-white to-orange-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-amber-950/30",
    borderColor: "border-amber-200/90 dark:border-amber-900/60 hover:border-amber-400 dark:hover:border-amber-600",
    tagBg: "bg-amber-100/80 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300",
    topAccent: "from-amber-500 via-orange-500 to-red-500",
    features: ["Financial Health Score", "Income & Debt Analysis", "PDF Advisory Reports"],
  },
  {
    id: "payroll",
    icon: Wallet,
    title: "Payroll",
    category: "Salary & Payouts",
    desc: "Run monthly payroll for HRMS and non-HRMS clients alike — salary structures, payroll runs, payslips and bank payment files.",
    gradient: "from-cyan-600 to-blue-600",
    shadowColor: "shadow-cyan-500/25",
    cardBg: "bg-gradient-to-br from-cyan-50/80 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-cyan-950/30",
    borderColor: "border-cyan-200/90 dark:border-cyan-900/60 hover:border-cyan-400 dark:hover:border-cyan-600",
    tagBg: "bg-cyan-100/80 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300",
    topAccent: "from-cyan-500 via-sky-500 to-blue-600",
    features: ["Salary Structures", "Monthly Payroll Runs", "Bank Payout Files"],
  },
];

const TIERS = [
  {
    id: "super-admin",
    icon: Layers,
    label: "TENANT — PLATFORM OVERVIEW",
    title: "Super Admin",
    desc: "Manages tenants, onboard CA firms, and oversees the whole platform.",
    accentBorder: "border-b-4 border-b-blue-500",
    iconBg: "bg-blue-50 dark:bg-blue-950/60",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeColor: "text-blue-600 dark:text-blue-400",
    arrowBg: "bg-blue-50 text-blue-500 dark:bg-blue-950/50 dark:text-blue-400",
  },
  {
    id: "ca-firm",
    icon: Users,
    label: "TENANT — CA FIRM ACCESS",
    title: "A CA firm that purchases a license",
    desc: "CRM, Compliance Tool, Personal Finance Tracker and Payroll — for their own practice.",
    accentBorder: "border-b-4 border-b-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/60",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeColor: "text-emerald-600 dark:text-emerald-400",
    arrowBg: "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  {
    id: "business-client",
    icon: Building2,
    label: "TENANT — CA FIRM'S BUSINESS CLIENT",
    title: "A business client onboarded by the CA firm",
    desc: "HRMS — to manage their own employees, fully isolated from every other client.",
    accentBorder: "border-b-4 border-b-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-950/60",
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeColor: "text-amber-600 dark:text-amber-400",
    arrowBg: "bg-amber-50 text-amber-500 dark:bg-amber-950/50 dark:text-amber-400",
  },
];

const PLANS = [
  {
    name: "Starter",
    icon: User,
    tag: "For Solo CAs",
    fit: "Solo practitioners / small firms.",
    seats: "Up to 2 staff seats",
    clients: "Up to 10 business clients",
    quotaLine: "WhatsApp notification quota included",
    highlight: false,
    gradient: "from-blue-600 to-indigo-600",
    cardBg: "bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40",
    borderColor: "border-blue-200/90 hover:border-blue-400",
    tagBg: "bg-blue-100/80 text-blue-700",
    topAccent: "from-blue-500 via-indigo-500 to-blue-600",
    checkBg: "bg-blue-100 text-blue-600",
    btnClass: "border border-blue-300 bg-white text-blue-700 hover:bg-blue-50",
    cta: { label: "Start Free Trial", to: "/signup" },
  },
  {
    name: "Growth",
    icon: Users,
    tag: "Most Popular",
    fit: "Mid-sized firms.",
    seats: "Up to 10 staff seats",
    clients: "Up to 50 business clients",
    quotaLine: "WhatsApp notification quota included",
    highlight: true,
    gradient: "from-purple-600 to-fuchsia-600",
    cardBg: "bg-gradient-to-br from-purple-50/80 via-white to-fuchsia-50/40",
    borderColor: "border-purple-300/90 hover:border-purple-500",
    tagBg: "bg-purple-600 text-white",
    topAccent: "from-purple-500 via-fuchsia-500 to-pink-500",
    checkBg: "bg-purple-100 text-purple-600",
    btnClass: "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-500/25 hover:from-purple-700 hover:to-fuchsia-700",
    cta: { label: "Start Free Trial", to: "/signup" },
  },
  {
    name: "Enterprise",
    icon: Building2,
    tag: "For Large Firms",
    fit: "Large firms, multi-location operations.",
    seats: "Unlimited staff seats",
    clients: "Unlimited business clients",
    quotaLine: "WhatsApp notification quotas included",
    highlight: false,
    gradient: "from-emerald-600 to-teal-600",
    cardBg: "bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40",
    borderColor: "border-emerald-200/90 hover:border-emerald-400",
    tagBg: "bg-emerald-100/80 text-emerald-700",
    topAccent: "from-emerald-500 via-teal-500 to-cyan-500",
    checkBg: "bg-emerald-100 text-emerald-600",
    btnClass: "border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50",
    cta: { label: "Start Free Trial", to: "/signup" },
  },
];

const ROLES = [
  {
    icon: User,
    title: "Super Admin",
    desc: "Manages CA firm license, platform-wide settings, and tenant isolation across every firm.",
    iconBg: "bg-blue-500/20 text-blue-400",
  },
  {
    icon: Users,
    title: "CA Firm Admin",
    desc: "Full control over firm, CRM, Compliance Tool, and Personal Finance Tracker, plus staff and business client management.",
    iconBg: "bg-teal-500/20 text-teal-400",
  },
  {
    icon: Briefcase,
    title: "CA Firm Staff",
    desc: "Access to assigned clients, Compliance Tool, and Personal Finance Tracker - with role-based access managed by the firm.",
    iconBg: "bg-amber-500/20 text-amber-400",
  },
  {
    icon: ShieldCheck,
    title: "Business Client Admin",
    desc: "Manages their own business's HRMS, independently - employees, leave, attendance, and payroll object.",
    iconBg: "bg-purple-500/20 text-purple-400",
  },
  {
    icon: User,
    title: "Employees",
    desc: "Access to personal HRMS records — leave, profile, apply for leave, download payslip.",
    iconBg: "bg-blue-500/20 text-blue-300",
  },
];

function DotGrid({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-6 gap-2.5 opacity-30 select-none pointer-events-none ${className}`}>
      {Array.from({ length: 30 }).map((_, i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full bg-blue-500" />
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden px-4 pb-20 pt-16 md:px-6 md:pt-24 bg-gradient-to-b from-blue-50/70 via-sky-50/30 to-[#f8faff] dark:from-slate-950 dark:via-slate-900 dark:to-[#0a0b12]">
        {/* Soft background ambient glows */}
        <div className="pointer-events-none absolute -left-20 top-0 -z-10 h-96 w-96 rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-600/10" />
        <div className="pointer-events-none absolute -right-20 top-10 -z-10 h-96 w-96 rounded-full bg-indigo-400/15 blur-3xl dark:bg-indigo-600/10" />

        {/* Decorative dot grid in top-right */}
        <div className="absolute right-8 top-12 hidden md:block">
          <DotGrid />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 shadow-xs dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-400">
            <Sparkles size={13} className="text-blue-600 dark:text-blue-400" />
            <span>CA Practice Management &amp; Client Services</span>
          </div>

          {/* Heading */}
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
            Run your CA practice
            <br />
            <span className="text-blue-600 dark:text-blue-400">and license it to other firms</span>
          </h1>

          {/* Paragraph */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Replace scattered spreadsheets with one platform for client relationships, compliance tracking and loan
            advisory — then offer it as a subscription to other CA firms as a second revenue stream.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-700 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/35"
            >
              Start Free 14-Day Trial <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-7 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors"
            >
              Log in
            </Link>
          </div>

          {/* Microcopy */}
          <p className="mt-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            No credit card required · Set up in minutes
          </p>
        </div>
      </section>

      {/* 2. FIVE MODULES IN ONE PLACE */}
      <section
        id="modules"
        className="relative overflow-hidden py-16 md:py-20 px-4 md:px-6 bg-gradient-to-b from-white via-indigo-50/30 to-[#f8faff] dark:from-[#0a0b12] dark:via-slate-900/50 dark:to-[#0a0b12] border-b border-slate-200/60 dark:border-slate-800/60"
      >
        {/* Colorful ambient glowing background spheres */}
        <div className="pointer-events-none absolute left-10 top-20 -z-10 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl dark:bg-blue-600/10" />
        <div className="pointer-events-none absolute right-10 top-32 -z-10 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl dark:bg-purple-600/10" />
        <div className="pointer-events-none absolute bottom-10 left-1/3 -z-10 h-72 w-72 rounded-full bg-emerald-500/12 blur-3xl dark:bg-emerald-600/10" />

        <div className="mx-auto max-w-6xl relative z-10">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 shadow-xs dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>Five Modules in One Place</span>
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Five modules,{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                one platform
              </span>
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300 text-base max-w-2xl mx-auto">
              Everything your firm needs to run day-to-day practice work.
            </p>
          </div>

          {/* Top Row: 3 Modules */}
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.slice(0, 3).map(
              ({
                id,
                icon: Icon,
                title,
                category,
                desc,
                gradient,
                shadowColor,
                cardBg,
                borderColor,
                tagBg,
                topAccent,
                features,
              }) => (
                <Link
                  key={title}
                  to={`/modules/${id}`}
                  className={`group rounded-2xl border ${borderColor} ${cardBg} p-5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer`}
                >
                  {/* Colorful Top Accent Bar */}
                  <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${topAccent}`} />

                  <div>
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr ${gradient} text-white shadow-sm ${shadowColor} transition-transform group-hover:scale-110`}
                      >
                        <Icon size={19} />
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${tagBg}`}>
                        {category}
                      </span>
                    </div>

                    <h3 className="mt-3.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-between">
                      <span>{title}</span>
                      <ArrowRight size={15} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600 dark:text-blue-400" />
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{desc}</p>
                  </div>

                  {/* Feature chips & Explore link */}
                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-col gap-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {features.map((feat) => (
                        <span
                          key={feat}
                          className="inline-flex items-center gap-1 text-[10.5px] font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 px-2 py-0.5 rounded-md shadow-2xs"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          {feat}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 pt-1">
                      <span>Explore Features &amp; Roles</span>
                      <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              )
            )}
          </div>

          {/* Bottom Row: 2 Modules Centered */}
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 max-w-4xl mx-auto">
            {MODULES.slice(3, 5).map(
              ({
                id,
                icon: Icon,
                title,
                category,
                desc,
                gradient,
                shadowColor,
                cardBg,
                borderColor,
                tagBg,
                topAccent,
                features,
              }) => (
                <Link
                  key={title}
                  to={`/modules/${id}`}
                  className={`group rounded-2xl border ${borderColor} ${cardBg} p-5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer`}
                >
                  {/* Colorful Top Accent Bar */}
                  <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${topAccent}`} />

                  <div>
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr ${gradient} text-white shadow-sm ${shadowColor} transition-transform group-hover:scale-110`}
                      >
                        <Icon size={19} />
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${tagBg}`}>
                        {category}
                      </span>
                    </div>

                    <h3 className="mt-3.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-between">
                      <span>{title}</span>
                      <ArrowRight size={15} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600 dark:text-blue-400" />
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{desc}</p>
                  </div>

                  {/* Feature chips & Explore link */}
                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-col gap-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {features.map((feat) => (
                        <span
                          key={feat}
                          className="inline-flex items-center gap-1 text-[10.5px] font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 px-2 py-0.5 rounded-md shadow-2xs"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          {feat}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 pt-1">
                      <span>Explore Features &amp; Roles</span>
                      <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* 3. TENANTS SECTION ("A platform with tenants inside tenants") */}
      <section id="tenants" className="relative px-4 py-16 md:px-6 bg-[#f0f5ff]/60 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60">
        {/* Decorative dot pattern */}
        <div className="absolute right-8 top-12 hidden md:block">
          <DotGrid />
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-blue-600 shadow-xs dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400">
              <Sparkles size={12} /> Smarter Practice, Better Results
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              A platform with <span className="text-blue-600 dark:text-blue-400">tenants inside tenants</span>
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-slate-600 dark:text-slate-300 text-base">
              Every business client's HRMS data stays isolated — even from other clients of the same CA firm.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {TIERS.map(({ id, icon: Icon, label, title, desc, accentBorder, iconBg, iconColor, badgeColor, arrowBg }) => (
              <Link
                key={label}
                to={`/tenants/${id}`}
                className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between ${accentBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} ${iconColor} shadow-xs`}>
                      <Icon size={22} />
                    </div>
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${arrowBg}`}>
                      <ChevronRight size={16} />
                    </div>
                  </div>

                  <p className={`mt-4 text-[11px] font-bold tracking-wider uppercase ${badgeColor}`}>{label}</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white leading-snug">{title}</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* 4. NOTIFICATION BANNER */}
          <div className="mt-10 mx-auto max-w-5xl rounded-3xl border border-blue-200/70 dark:border-blue-900/50 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 dark:from-slate-900/90 dark:via-blue-950/40 dark:to-slate-900/90 p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-xs">
            <div className="flex shrink-0 items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-slate-700">
                <MessageSquare size={22} />
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-slate-700">
                <Mail size={22} />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Automated WhatsApp &amp; email notifications
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Compliance deadlines, CRM follow-ups, leave approvals and financial advisory updates — sent automatically the
                moment they happen, not as a manual broadcast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PLANS & PRICING */}
      <section id="pricing" className="relative overflow-hidden px-4 py-20 md:px-6">
        {/* Subtle gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white to-blue-50/30" />
        <div className="pointer-events-none absolute left-1/4 top-0 h-80 w-80 rounded-full bg-purple-400/6 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-blue-400/6 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200/80 bg-purple-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-700">
              <Sparkles size={12} />
              Plans &amp; Pricing
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Plans that{" "}
              <span className="bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                scale with your firm
              </span>
            </h2>
            <p className="mt-3 text-slate-500 text-base max-w-md mx-auto">
              Start on a 14-day free trial. Upgrade as you onboard more clients.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 items-stretch">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${plan.cardBg} ${plan.borderColor} ${
                    plan.highlight ? "shadow-lg ring-2 ring-purple-400/30" : "shadow-sm"
                  }`}
                >
                  {/* Top accent bar */}
                  <div className={`h-1 w-full bg-gradient-to-r ${plan.topAccent}`} />

                  <div className="p-7 flex flex-col flex-1">
                    <div>
                      <div className="flex items-center justify-between">
                        {/* Gradient icon badge */}
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${plan.gradient} text-white shadow-sm`}
                        >
                          <Icon size={20} />
                        </span>
                        {/* Tag pill */}
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase ${plan.tagBg}`}>
                          {plan.tag}
                        </span>
                      </div>

                      <h3 className="mt-5 text-xl font-bold text-slate-900">{plan.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{plan.fit}</p>

                      <ul className="mt-6 flex flex-col gap-3">
                        {[plan.seats, plan.clients, plan.quotaLine].map((line) => (
                          <li key={line} className="flex items-start gap-2.5 text-sm text-slate-700">
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 ${plan.checkBg}`}>
                              <Check size={12} strokeWidth={2.8} />
                            </span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8">
                      <Link
                        to={plan.cta.to}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${plan.btnClass}`}
                      >
                        {plan.cta.label} <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. BUILT FOR EVERY ROLE (DARK SECTION) */}
      <section className="relative overflow-hidden bg-[#0c1322] px-4 py-20 md:px-6 text-white">
        {/* Ambient subtle glow */}
        <div className="pointer-events-none absolute left-1/4 top-0 -z-0 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 bottom-0 -z-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full bg-blue-500/20 border border-blue-400/30 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-blue-300">
              Built for Every Role
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              A dashboard built for every role
            </h2>
            <p className="mt-2 text-slate-400 text-base max-w-xl mx-auto">
              Each person sees exactly the modules relevant to their tier — nothing more.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.slice(0, 3).map(({ icon: Icon, title, desc, iconBg }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-700/60 bg-[#121c32]/85 p-6 hover:border-blue-500/40 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                    <Icon size={18} />
                  </span>
                  <h3 className="text-base font-bold text-white">{title}</h3>
                </div>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 max-w-4xl mx-auto">
            {ROLES.slice(3, 5).map(({ icon: Icon, title, desc, iconBg }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-700/60 bg-[#121c32]/85 p-6 hover:border-blue-500/40 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                    <Icon size={18} />
                  </span>
                  <h3 className="text-base font-bold text-white">{title}</h3>
                </div>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CTA SECTION */}
      <section className="relative overflow-hidden px-4 py-20 md:px-6 bg-gradient-to-b from-[#f8faff] via-blue-50/40 to-[#edf3ff] dark:from-[#0a0b12] dark:via-slate-900/60 dark:to-slate-950">
        {/* Decorative dot pattern */}
        <div className="absolute right-8 top-12 hidden md:block">
          <DotGrid />
        </div>

        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Left: Graphic illustration mockup */}
          <div className="relative shrink-0 w-64 sm:w-72">
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl">
              <div className="flex items-center gap-1.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <User size={16} />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-2 w-16 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <Layers size={16} />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-2 w-20 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            </div>

            {/* Shield Check Badge */}
            <div className="absolute -bottom-3 -right-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
              <Check size={24} strokeWidth={2.5} />
            </div>
          </div>

          {/* Right: Content & CTA */}
          <div className="text-center md:text-left flex-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Ready to run your practice on Ledgerly?
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-base">
              Join thousands of learners and teams already using Ledgerly.
            </p>
            <div className="mt-6">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-700 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/35"
              >
                Start Free Trial <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
