import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, CheckCheck, Settings2, ArrowLeft } from "lucide-react";
import * as notificationApi from "../../api/notification.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import Switch from "../ui/Switch.jsx";

// Per-channel opt-out (Module Scope doc, Section 6.1: "Notification preference
// management — opt-out per channel").
const CHANNELS = [
  { key: "inApp", label: "In-app", hint: "Alerts in this bell" },
  { key: "email", label: "Email", hint: "Reminders and updates by email" },
  { key: "whatsapp", label: "WhatsApp", hint: "Reminders and updates on WhatsApp" },
];

const TYPE_DOT = {
  expiry: "bg-warning",
  warning: "bg-warning",
  ticket: "bg-brand",
  maintenance: "bg-danger",
  system: "bg-teal",
  info: "bg-brand",
  reminder: "bg-warning",
  task: "bg-teal",
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [view, setView] = useState("list");
  const [prefs, setPrefs] = useState(null);
  const [whatsappConfigured, setWhatsappConfigured] = useState(true);
  const [prefsError, setPrefsError] = useState("");
  const ref = useRef(null);
  const navigate = useNavigate();
  const { basePath } = useAuth();

  async function openPreferences() {
    setView("preferences");
    setPrefsError("");
    try {
      const { data } = await notificationApi.getNotificationPreferences();
      setPrefs(data.data.preferences);
      setWhatsappConfigured(data.data.whatsappConfigured);
    } catch {
      setPrefsError("Could not load your preferences.");
    }
  }

  async function togglePreference(key, value) {
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value });
    setPrefsError("");
    try {
      await notificationApi.updateNotificationPreferences({ [key]: value });
    } catch {
      setPrefs(previous);
      setPrefsError("Could not save — please try again.");
    }
  }

  async function load() {
    const { data } = await notificationApi.getMyNotifications();
    setNotifications(data.data.notifications);
    setUnreadCount(data.data.unreadCount);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleItemClick(n) {
    if (n.kind === "notification" && !n.isRead) {
      await notificationApi.markNotificationRead(n._id);
      load();
    }
    setOpen(false);
    if (n.link || n.link === "") {
      navigate(n.link ? `${basePath}/${n.link}` : basePath);
    }
  }

  async function handleMarkAllRead() {
    await notificationApi.markAllNotificationsRead();
    load();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          setView("list");
        }}
        className="relative rounded-full p-2 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-2xl border border-border bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            {view === "preferences" ? (
              <button
                onClick={() => setView("list")}
                className="flex items-center gap-1.5 text-sm font-semibold text-heading hover:text-brand"
              >
                <ArrowLeft size={14} /> Notification settings
              </button>
            ) : (
              <p className="text-sm font-semibold text-heading">Notifications</p>
            )}
            {view === "list" && (
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                  >
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
                <button
                  onClick={openPreferences}
                  className="text-text-muted hover:text-text"
                  aria-label="Notification settings"
                  title="Notification settings"
                >
                  <Settings2 size={15} />
                </button>
              </div>
            )}
          </div>
          {view === "preferences" ? (
            <div className="flex flex-col gap-1 px-4 py-3">
              <p className="pb-2 text-xs text-text-muted">Choose how you want to receive alerts. Login credentials are always sent by email.</p>
              {!prefs && !prefsError && <p className="py-4 text-center text-sm text-text-muted">Loading…</p>}
              {prefs &&
                CHANNELS.map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-heading">{c.label}</p>
                      <p className="text-xs text-text-muted">
                        {c.key === "whatsapp" && !whatsappConfigured ? "Will start once WhatsApp is connected for the platform" : c.hint}
                      </p>
                    </div>
                    <Switch checked={!!prefs[c.key]} onChange={(v) => togglePreference(c.key, v)} />
                  </div>
                ))}
              {prefsError && <p className="pt-1 text-xs text-danger">{prefsError}</p>}
            </div>
          ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-text-muted">You're all caught up.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleItemClick(n)}
                  className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-0 transition-colors hover:bg-surface-2 ${
                    n.isRead ? "" : "bg-brand-soft/40"
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-border" : TYPE_DOT[n.type] || "bg-brand"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-heading">
                      {n.kind === "alert" && <AlertTriangle size={13} className="text-warning" />}
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">{n.message}</p>
                    <p className="mt-1 text-[11px] text-text-muted">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
