"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { clearAllNotifications, markNotificationRead } from "./actions";

const BellIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const UserIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

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

export function UserNavbar({
  fullName,
  notifications: initial,
}: Props) {
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
    if (!result.error) {
      setNotifications([]);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/home" className="flex items-center gap-3">
        <Image
          src="/island-echoes-health.svg"
          alt="Island Echoes Health"
          width={140}
          height={50}
          priority
        />
      </Link>

      <nav className="flex items-center gap-2 sm:gap-4">
        <Link
          href="/about"
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
        >
          About
        </Link>
        <Link
          href="/pricing"
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
        >
          Pricing
        </Link>

        {/* Notifications dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifsOpen(!notifsOpen)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#1F5F2E] px-2 py-0.5 text-xs font-medium text-white">
                {unreadCount}
              </span>
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
                        <li
                          key={n.id}
                          className={`p-4 ${!n.read_at ? "bg-[#1F5F2E]/5" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-slate-900">{n.title}</p>
                              {n.body && (
                                <p className="mt-0.5 text-sm text-slate-600 line-clamp-2">
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

        {/* Profile link */}
        <Link
          href="/home/profile"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
        >
          <UserIcon />
          <span className="hidden text-sm font-medium sm:inline">
            {fullName ?? "Profile"}
          </span>
        </Link>
      </nav>
    </header>
  );
}
