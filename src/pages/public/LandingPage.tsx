import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Users, ArrowRight, CheckCircle2, ShieldCheck, Building2, MessageCircleMore, Mail } from "lucide-react";
import { MODULES, TIERS } from "../../config/landingContent.js";
import { ROLE_LABELS } from "../../config/roles.js";
import { ROLE_DESCRIPTIONS, ROLE_ORDER } from "../../config/roleDescriptions.js";
import { accentAt } from "../../config/accentColors.js";

const PLANS = [
  {
    name: "Starter",
    fit: "Solo practitioners / small firms",
    seats: "Up to 3 staff seats",
    clients: "Up to 10 business clients",
    highlight: false,
  },
  {
    name: "Growth",
    fit: "Mid-sized firms",
    seats: "Up to 10 staff seats",
    clients: "Up to 50 business clients",
    highlight: true,
  },
  {
    name: "Enterprise",
    fit: "Large firms, negotiated separately",
    seats: "Unlimited staff seats",
    clients: "Unlimited business clients",
    highlight: false,
  },
];

export default function LandingPage() {
  const { hash } = useLocation();

  // "Back to modules" on a detail page links to /#modules — land on that section.
  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <div>
      {/* Hero */}
      <section className="auth-page-gradient relative overflow-hidden px-4 pb-20 pt-16 md:px-6 md:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3.5 py-1.5 text-xs font-semibold text-brand">
            <ShieldCheck size={14} /> CA Practice Management &amp; Client Services
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-heading sm:text-5xl md:text-6xl">
            Run your <span className="text-brand">CA practice</span>
            <br className="hidden sm:block" /> and <span className="text-accent">license it</span> to other firms
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-text-muted">
            Replace scattered spreadsheets with one platform for client relationships, compliance tracking and
            loan advisory — then offer it as a subscription to other CA firms as a second revenue stream.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-brand-fg shadow-lg shadow-brand/25 hover:bg-brand-hover"
            >
              Start Free 14-Day Trial <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold text-text hover:bg-surface-2"
            >
              Log in
            </Link>
          </div>
          <p className="mt-4 text-xs text-text-muted">No credit card required · Set up in minutes</p>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-heading">Five modules, one platform</h2>
          <p className="mt-2 text-text-muted">Everything your firm needs to run day-to-day practice work. Click a module to see everything it does.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {MODULES.map(({ slug, icon: Icon, title, desc }, i) => {
            const accent = accentAt(i);
            return (
              <Link
                key={slug}
                to={`/modules/${slug}`}
                className="group flex flex-col rounded-xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent.bg} ${accent.text}`}>
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-heading">{title}</h3>
                <p className="mt-1.5 flex-1 text-sm text-text-muted">{desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                  Learn more <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3-tier structure */}
      <section id="tiers" className="scroll-mt-20 border-y border-border bg-surface-2/50 px-4 py-16 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand">
              <Building2 size={14} /> Built to be licensed
            </span>
            <h2 className="mt-2 text-3xl font-bold text-heading">A platform with tenants inside tenants</h2>
            <p className="mx-auto mt-2 max-w-2xl text-text-muted">
              Every business client's HRMS data stays isolated — even from other clients of the same CA firm.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {TIERS.map(({ slug, icon: Icon, title, desc, audience }, i) => {
              const accent = accentAt(i);
              return (
                <Link
                  key={slug}
                  to={`/platform/${slug}`}
                  className="group flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent.bg} ${accent.text}`}>
                    <Icon size={22} />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</p>
                  <p className="mt-1 text-base font-semibold text-heading">{audience.map((a) => a.who).join(" · ")}</p>
                  <p className="mt-2 flex-1 text-sm text-text-muted">{desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                    Learn more <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Notification strip */}
      <section className="mx-auto max-w-5xl px-4 py-14 md:px-6">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-brand/20 bg-brand-soft p-8 text-center sm:flex-row sm:text-left">
          <div className="flex shrink-0 items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-brand shadow-sm">
              <MessageCircleMore size={22} />
            </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-brand shadow-sm">
              <Mail size={22} />
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-heading">Automated WhatsApp &amp; email notifications</h3>
            <p className="mt-1 text-sm text-text-muted">
              Compliance deadlines, CRM follow-ups, HR approvals and finance reports — sent automatically the moment
              they happen, not as a manual broadcast. Everyone chooses their own channels.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing tiers */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-heading">Plans that scale with your firm</h2>
          <p className="mt-2 text-text-muted">Start on a 14-day trial. Upgrade as you onboard more clients.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-7 shadow-sm ${
                plan.highlight ? "border-brand bg-surface shadow-lg shadow-brand/10 ring-1 ring-brand" : "border-border bg-surface"
              }`}
            >
              {plan.highlight && (
                <span className="mb-3 inline-block rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-xl font-bold text-heading">{plan.name}</h3>
              <p className="mt-1 text-sm text-text-muted">{plan.fit}</p>
              <ul className="mt-5 flex flex-col gap-2.5">
                {[plan.seats, plan.clients, "WhatsApp notification quota included"].map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm text-text">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand" />
                    {line}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={`mt-7 flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-brand text-brand-fg hover:bg-brand-hover"
                    : "border border-border text-text hover:bg-surface-2"
                }`}
              >
                Start free trial
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Roles — dark contrast section */}
      <section className="dark-section-gradient px-4 py-16 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-light">
              <Users size={14} /> Role-based access
            </span>
            <h2 className="mt-2 text-3xl font-bold text-white">A dashboard built for every role</h2>
            <p className="mt-2 text-white/60">
              Each person sees exactly the modules relevant to their tier — nothing more.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROLE_ORDER.map((role, i) => {
              const accent = accentAt(i);
              return (
                <div key={role} className="rounded-xl border border-white/10 bg-white/3 p-5">
                  <div className="flex items-center gap-2.5">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full ${accent.bg} ${accent.text}`}>
                      <CheckCircle2 size={14} />
                    </span>
                    <h3 className="text-sm font-semibold text-white">{ROLE_LABELS[role]}</h3>
                  </div>
                  <p className="mt-2 text-sm text-white/60">{ROLE_DESCRIPTIONS[role]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden px-4 py-20 text-center md:px-6">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{
            background: "radial-gradient(500px circle at 50% 30%, var(--brand-soft) 0%, transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-heading">Ready to run your practice on Praxis?</h2>
          <p className="mt-2 text-text-muted">Create your firm's workspace and invite your staff today.</p>
          <div className="mt-7">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-brand-fg shadow-lg shadow-brand/25 hover:bg-brand-hover"
            >
              Start free trial <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
