"use client";

import { useState } from "react";
import { markNotificationRead } from "./actions";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
  reference_id: string | null;
};

type Props = {
  notifications: Notification[];
};

export function NotificationList({ notifications: initial }: Props) {
  const [notifications, setNotifications] = useState(initial);

  async function markRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  }

  const unread = notifications.filter((n) => !n.read_at);
  const unreadCount = unread.length;

  return (
    <div className="relative">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-slate-700 hover:text-slate-900">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-[#1F5F2E] px-2 py-0.5 text-xs font-medium text-white">
              {unreadCount}
            </span>
          )}
        </summary>
        <div className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No notifications.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`p-4 ${!n.read_at ? "bg-[#1F5F2E]/5" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{n.title}</p>
                      {n.body && (
                        <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!n.read_at && (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className="shrink-0 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </div>
  );
}
