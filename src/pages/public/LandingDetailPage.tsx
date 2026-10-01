import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, MessageCircleMore, UserRound } from "lucide-react";
import { MODULES, TIERS, findLandingItem } from "../../config/landingContent.js";
import { accentAt } from "../../config/accentColors.js";
import NotFoundPage from "./NotFoundPage.jsx";

// Full description for one landing-page box — /modules/:slug (the five
// modules) or /platform/:slug (the three tenancy tiers).
export default function LandingDetailPage() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const kind = pathname.startsWith("/platform") ? "platform" : "modules";
  const list = kind === "modules" ? MODULES : TIERS;
  const item = findLandingItem(kind, slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!item) return <NotFoundPage />;

  const index = list.indexOf(item);
  const accent = accentAt(index);
  const Icon = item.icon;
  const sectionLabel = kind === "modules" ? "Modules" : "Platform structure";
  const others = list.filter((other) => other.slug !== item.slug);

  return (
    <div>
      <section className="auth-page-gradient px-4 pb-14 pt-10 md:px-6 md:pt-14">
        <div className="mx-auto max-w-5xl">
          <Link
            to={`/#${kind === "modules" ? "modules" : "tiers"}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-brand"
          >
            <ArrowLeft size={15} /> Back to {sectionLabel.toLowerCase()}
          </Link>
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${accent.bg} ${accent.text}`}>
              <Icon size={26} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">{sectionLabel}</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-heading sm:text-4xl">{item.title}</h1>
              <p className="mt-3 max-w-3xl text-lg text-text-muted">{item.tagline}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {item.highlights.map((h) => (
              <span key={h} className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text">
                {h}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 md:px-6">
        <div className="flex flex-col gap-4">
          {item.overview.map((p) => (
            <p key={p.slice(0, 40)} className="text-base leading-relaxed text-text">
              {p}
            </p>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-heading">Who uses it</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {item.audience.map((a) => (
            <div key={a.who} className="flex gap-3 rounded-xl border border-border bg-surface p-4">
              <UserRound size={18} className="mt-0.5 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-semibold text-heading">{a.who}</p>
                <p className="mt-0.5 text-sm text-text-muted">{a.access}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold text-heading">What's included</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {item.features.map((group) => (
            <div key={group.heading} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <h3 className="text-base font-semibold text-heading">{group.heading}</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {group.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-text">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {item.notifications?.length ? (
          <div className="mt-10 rounded-2xl border border-brand/20 bg-brand-soft p-6">
            <div className="flex items-center gap-2">
              <MessageCircleMore size={18} className="text-brand" />
              <h2 className="text-lg font-bold text-heading">Automatic notifications</h2>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {item.notifications.map((n) => (
                <li key={n} className="flex items-start gap-2 text-sm text-text">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-heading">Try {item.title.replace(/^Tier \d — /, "")} on Praxis</p>
            <p className="text-sm text-text-muted">Free 14-day trial · No credit card required</p>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg shadow-lg shadow-brand/25 hover:bg-brand-hover"
          >
            Start free trial <ArrowRight size={16} />
          </Link>
        </div>

        <h2 className="mt-14 text-lg font-bold text-heading">
          {kind === "modules" ? "Explore the other modules" : "The other tiers"}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((other) => {
            const OtherIcon = other.icon;
            const otherAccent = accentAt(list.indexOf(other));
            return (
              <Link
                key={other.slug}
                to={`/${kind}/${other.slug}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${otherAccent.bg} ${otherAccent.text}`}>
                  <OtherIcon size={18} />
                </span>
                <span className="text-sm font-semibold text-heading">{other.title}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
