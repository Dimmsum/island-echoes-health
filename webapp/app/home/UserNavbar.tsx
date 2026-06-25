"use client";

import Link from "next/link";
import { useState } from "react";
import { clearAllNotifications, markNotificationRead } from "./actions";

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
  fullName: string | null;
  notifications: Notification[];
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserNavbar({ fullName, notifications: initial }: Props) {
  const [notifications, setNotifications] = useState(initial);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function markRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  }

  async function handleClearAll() {
    setClearing(true);
    const result = await clearAllNotifications();
    setClearing(false);
    if (!result.error) setNotifications([]);
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const initials = getInitials(fullName);

  return (
    <header
      className="flex items-center justify-between border-b border-[#EBF0EB] bg-white px-7 py-4"
      style={{ fontFamily: "var(--font-hanken, 'Hanken Grotesk', sans-serif)" }}
    >
      {/* Left: logo + nav links */}
      <div className="flex items-center gap-9">
        <Link href="/home" className="flex items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#1F8A5B] text-[13px] font-extrabold text-white">
            IE
          </div>
          <span className="text-[16px] font-bold tracking-[-0.01em] text-[#16241D]">
            Island Echoes <span className="text-[#1F8A5B]">Health</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/home"
            className="rounded-[9px] bg-[#EFF6F1] px-3.5 py-2 text-[14px] font-semibold text-[#13643F]"
          >
            Home
          </Link>
          <Link
            href="/home"
            className="rounded-[9px] px-3.5 py-2 text-[14px] font-medium text-[#5a6a60] transition hover:bg-[#F4F7F3]"
          >
            Patients
          </Link>
          <Link
            href="/appointments"
            className="rounded-[9px] px-3.5 py-2 text-[14px] font-medium text-[#5a6a60] transition hover:bg-[#F4F7F3]"
          >
            Appointments
          </Link>
          <Link
            href="/home/profile"
            className="rounded-[9px] px-3.5 py-2 text-[14px] font-medium text-[#5a6a60] transition hover:bg-[#F4F7F3]"
          >
            Profile
          </Link>
        </nav>
      </div>

      {/* Right: search + notifications + avatar */}
      <div className="flex items-center gap-3.5">
        {/* Search (decorative) */}
        <div className="flex w-48 items-center gap-2 rounded-[10px] border border-[#E6EBE6] px-3.5 py-2 text-[13px] text-[#9aa89f]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#9aa89f" strokeWidth="1.4" />
            <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="#9aa89f" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Search
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifsOpen(!notifsOpen)}
            className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-[#E6EBE6] transition hover:bg-[#F4F7F3]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2.2c-2 0-3.4 1.5-3.4 3.5 0 3-1.3 4-1.3 4h9.4s-1.3-1-1.3-4c0-2-1.4-3.5-3.4-3.5z"
                stroke="#5a6a60"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <circle cx="8" cy="13" r="1.2" fill="#5a6a60" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute right-[9px] top-[8px] h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-[#F4C541]" />
            )}
          </button>

          {notifsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotifsOpen(false)}
                aria-hidden
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      disabled={clearing}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
                    >
                      {clearing ? "Clearing…" : "Clear all"}
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">No notifications.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {notifications.map((n) => (
                        <li key={n.id} className={`p-4 ${!n.read_at ? "bg-[#1F8A5B]/5" : ""}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-slate-900">{n.title}</p>
                              {n.body && (
                                <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">
                                  {n.body}
                                </p>
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
              </div>
            </>
          )}
        </div>

        {/* User avatar */}
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#DCEFE3] text-[14px] font-bold text-[#13643F]">
          {initials}
        </div>
      </div>
    </header>
  );
}
