interface TabOption {
  value: string;
  label: string;
}

interface SegmentedTabsProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function SegmentedTabs({ options, value, onChange }: SegmentedTabsProps) {
  return (
    <div className="inline-flex gap-1 rounded-xl border border-border bg-surface p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === opt.value ? "border border-brand bg-brand-soft text-brand" : "border border-transparent text-text-muted hover:text-text"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
