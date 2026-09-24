/** @format */
import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

// Placeholder for sidebar entries that exist in the navigation plan but don't
// have a real page built yet (e.g. Training, Medical Policy, Insurance,
// POSH) — avoids dead/broken links while those modules are still pending.
export default function ComingSoon({ title }: { title?: string }) {
  const location = useLocation();
  const label = title || (location.state as any)?.label || "This module";

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]">
        <Construction className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold text-[var(--foreground)]">{label} — Coming Soon</h2>
      <p className="max-w-sm text-sm text-[var(--muted-foreground)]">
        This section is on the roadmap but hasn't been built yet.
      </p>
    </div>
  );
}
