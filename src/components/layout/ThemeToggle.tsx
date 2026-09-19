import { Sun, Moon, Monitor } from "lucide-react";
import { useUiStore } from "../../store/uiStore.js";

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "system", icon: Monitor, label: "System" },
  { value: "dark", icon: Moon, label: "Dark" },
];

export default function ThemeToggle({ className = "" }) {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  return (
    <div className={`inline-flex items-center gap-0.5 rounded-full border border-border bg-surface-2 p-1 ${className}`}>
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={label}
          title={label}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
            theme === value ? "bg-brand text-white" : "text-text-muted hover:text-text"
          }`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
