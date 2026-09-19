import { useEffect, useRef, useState } from "react";
import { Bell, AlertTriangle, CheckCheck } from "lucide-react";
import * as notificationApi from "../../api/notification.api.js";

const TYPE_DOT = {
  expiry: "bg-warning",
  warning: "bg-warning",
  ticket: "bg-brand",
  maintenance: "bg-danger",
  system: "bg-teal",
  info: "bg-brand",
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
  const ref = useRef(null);

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
  }

  async function handleMarkAllRead() {
    await notificationApi.markAllNotificationsRead();
    load();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
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
            <p className="text-sm font-semibold text-heading">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
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
        </div>
      )}
    </div>
  );
}
