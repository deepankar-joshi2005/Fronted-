import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Settings2, ArrowLeft } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSocket } from "@/contexts/SocketContext";
import {
  hrmsNotificationService,
  type HrmsNotification,
  type HrmsNotificationPreferences,
} from "@/api/hrmsNotificationService";

// HRMS in-app notifications — Module Scope doc, Section 6.1 ("Notification
// engine (in-app + email + WhatsApp)"): leave/attendance/request decisions,
// shifts, payslips, letters, new leave requests for approvers. Live via the
// "notification:new" socket event, with a slow poll as a fallback. The gear
// opens per-channel opt-out (Section 6.1: "opt-out per channel").

const TYPE_DOT: Record<string, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-blue-500",
};

const CHANNELS: { key: keyof HrmsNotificationPreferences; label: string; hint: string }[] = [
  { key: "inApp", label: "In-app", hint: "Alerts in this bell" },
  { key: "email", label: "Email", hint: "Updates to your email" },
  { key: "whatsapp", label: "WhatsApp", hint: "Updates on your mobile number" },
];

function timeAgo(dateStr: string) {
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function SettingSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-300"}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`}
      />
    </button>
  );
}

export default function HrmsNotificationBell({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "preferences">("list");
  const [notifications, setNotifications] = useState<HrmsNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prefs, setPrefs] = useState<HrmsNotificationPreferences | null>(null);
  const [whatsappNote, setWhatsappNote] = useState("");
  const [prefsError, setPrefsError] = useState("");

  const load = useCallback(
    () =>
      hrmsNotificationService
        .list()
        .then((data) => {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        })
        // Trainee / CA-proxy sessions can't read notifications — just show none.
        .catch(() => {}),
    []
  );

  useEffect(() => {
    load();
    const interval = setInterval(load, 120000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => load();
    socket.on("notification:new", handler);
    return () => {
      socket.off("notification:new", handler);
    };
  }, [socket, load]);

  async function openItem(n: HrmsNotification) {
    if (!n.isRead) {
      await hrmsNotificationService.markRead(n._id).catch(() => {});
      load();
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  async function markAll() {
    await hrmsNotificationService.markAllRead().catch(() => {});
    load();
  }

  async function openPreferences() {
    setView("preferences");
    setPrefsError("");
    try {
      const data = await hrmsNotificationService.getPreferences();
      setPrefs(data.preferences);
      setWhatsappNote(
        !data.whatsappConfigured
          ? "Starts once WhatsApp is connected by your administrator"
          : !data.hasMobile
            ? "Add a mobile number to your profile to receive WhatsApp updates"
            : ""
      );
    } catch {
      setPrefsError("Could not load your preferences.");
    }
  }

  async function toggle(key: keyof HrmsNotificationPreferences, value: boolean) {
    if (!prefs) return;
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value });
    setPrefsError("");
    try {
      await hrmsNotificationService.updatePreferences({ [key]: value });
    } catch {
      setPrefs(previous);
      setPrefsError("Could not save — please try again.");
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setView("list");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Notifications"
          aria-label="Notifications"
          className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${className}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          {view === "preferences" ? (
            <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm font-semibold hover:text-blue-600">
              <ArrowLeft className="h-3.5 w-3.5" /> Notification settings
            </button>
          ) : (
            <p className="text-sm font-semibold">Notifications</p>
          )}
          {view === "list" && (
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button onClick={markAll} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
              <button onClick={openPreferences} title="Notification settings" aria-label="Notification settings" className="text-gray-500 hover:text-gray-800">
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {view === "preferences" ? (
          <div className="flex flex-col gap-1 px-4 py-3">
            <p className="pb-2 text-xs text-muted-foreground">Choose how you want to receive HR updates.</p>
            {!prefs && !prefsError && <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>}
            {prefs &&
              CHANNELS.map((c) => (
                <div key={c.key} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.key === "whatsapp" && whatsappNote ? whatsappNote : c.hint}</p>
                  </div>
                  <SettingSwitch checked={prefs[c.key]} onChange={(v) => toggle(c.key, v)} />
                </div>
              ))}
            {prefsError && <p className="pt-1 text-xs text-red-600">{prefsError}</p>}
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => openItem(n)}
                  className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 ${
                    n.isRead ? "" : "bg-blue-50/60 dark:bg-blue-500/10"
                  }`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-gray-300" : TYPE_DOT[n.type] || "bg-blue-500"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{n.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{n.message}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
