import { Sparkles, ShieldCheck, Layers, MessageCircleMore, Building2, Wallet } from "lucide-react";

const POINTS = [
  {
    icon: ShieldCheck,
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-600 dark:text-blue-400",
    title: "Track every compliance deadline",
    desc: "GST, TDS, ROC templates assigned to clients and staff, with automatic reminders.",
  },
  {
    icon: Layers,
    iconBg: "bg-teal-500/10",
    iconText: "text-teal-600 dark:text-teal-400",
    title: "A dashboard for every tier",
    desc: "Super Admin, your firm's staff, and your business clients each see only what's theirs.",
  },
  {
    icon: MessageCircleMore,
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-600 dark:text-amber-400",
    title: "Automated WhatsApp & email alerts",
    desc: "Deadlines, follow-ups, and leave approvals — sent the moment they happen.",
  },
];

const STATS = [
  { icon: Sparkles, value: "4", label: "Modules", iconBg: "bg-blue-500/10", iconText: "text-blue-600 dark:text-blue-400" },
  { icon: Building2, value: "3", label: "Tier Access", iconBg: "bg-teal-500/10", iconText: "text-teal-600 dark:text-teal-400" },
  { icon: Wallet, value: "100%", label: "Data Isolation", iconBg: "bg-amber-500/10", iconText: "text-amber-600 dark:text-amber-400" },
];

export default function AuthShowcasePanel({ eyebrow, title, highlight, subtitle }) {
  return (
    <div className="hidden lg:block">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-brand/20 bg-surface px-3.5 py-1.5 text-sm font-semibold text-brand shadow-sm">
        <Sparkles size={14} /> {eyebrow}
      </span>

      <h2 className="mt-6 max-w-lg text-[44px] font-bold leading-[1.1] tracking-tight text-heading">
        {title} <span className="brand-gradient-text-multi">{highlight}</span>
      </h2>
      <p className="mt-4 max-w-md text-base text-text-muted">{subtitle}</p>

      <ul className="mt-10 flex flex-col gap-6">
        {POINTS.map(({ icon: Icon, iconBg, iconText, title: pointTitle, desc }) => (
          <li key={pointTitle} className="flex items-start gap-4">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconText}`}>
              <Icon size={20} />
            </span>
            <div>
              <p className="text-base font-semibold text-heading">{pointTitle}</p>
              <p className="mt-0.5 text-sm text-text-muted">{desc}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-11 flex max-w-lg gap-4">
        {STATS.map(({ icon: Icon, value, label, iconBg, iconText }) => (
          <div key={label} className="flex flex-1 flex-col gap-2 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg} ${iconText}`}>
              <Icon size={16} />
            </span>
            <span className="text-2xl font-bold text-heading">{value}</span>
            <span className="text-xs text-text-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
