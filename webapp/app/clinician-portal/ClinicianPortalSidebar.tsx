"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export const sans = { fontFamily: "var(--font-hanken, 'Hanken Grotesk', sans-serif)" };
export const mono = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };

function CalendarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function UsersIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ShieldIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" />
    </svg>
  );
}

function ChevronIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function initialsFor(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/clinician-portal", icon: CalendarIcon },
  { key: "patients", label: "Patients", href: "/clinician-portal/patients", icon: UsersIcon },
  { key: "appointments", label: "Appointments", href: "/clinician-portal/appointments", icon: CalendarIcon },
] as const;

export type SidebarActiveKey = "dashboard" | "patients" | "appointments" | "admin";

type Props = {
  fullName: string | null;
  avatarUrl: string | null;
  role: "admin" | "clinician";
  activeKey: SidebarActiveKey;
};

/**
 * The collapsible icon rail shared across clinician-portal pages (design 5b's nav rail).
 * Kept as a standalone component — as of this page's build, three pages mount it, which is
 * the point past which copy-pasting this stateful block per page stops paying for itself.
 */
export function ClinicianPortalSidebar({ fullName, avatarUrl, role, activeKey }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const roleLabel = role === "clinician" ? "Clinician" : "Admin";
  const navLinks = role === "admin" ? [...NAV_ITEMS, { key: "admin", label: "Admin", href: "/admin", icon: ShieldIcon }] : NAV_ITEMS;

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-none flex-col gap-6 overflow-y-auto bg-[#0f3d2b] py-5 transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-[76px] px-3" : "w-[220px] px-4"
      }`}
      style={sans}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(18,61,43,.14)] bg-white text-[#0f5132] shadow-sm transition-transform duration-300 hover:bg-[#f4f6f4]"
      >
        <ChevronIcon className={`h-3.5 w-3.5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
      </button>

      <Link
        href="/clinician-portal"
        className={`flex items-center overflow-hidden ${collapsed ? "justify-center gap-0" : "gap-2.5"}`}
      >
        <Image
          src="/island-echoes-icon.svg"
          alt="Island Echoes Health"
          width={28}
          height={28}
          priority
          className="h-7 w-7 shrink-0 brightness-0 invert"
        />
        <div
          className={`whitespace-nowrap text-[9px] font-bold uppercase leading-tight tracking-wide text-white transition-[opacity,width] duration-200 ${
            collapsed ? "pointer-events-none w-0 opacity-0" : "w-auto opacity-100"
          }`}
        >
          Island
          <br />
          Echoes
          <br />
          <span className="font-normal text-[#8fb5a0]">Health</span>
        </div>
      </Link>

      <nav className="flex flex-col gap-1">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === activeKey;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center overflow-hidden rounded-[9px] py-2.5 text-[12.5px] font-medium transition ${
                collapsed ? "justify-center gap-0 px-0" : "gap-2.5 px-2.5"
              } ${isActive ? "bg-white/12 text-white" : "text-[#a9c6b7] hover:bg-white/8 hover:text-white"}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span
                className={`whitespace-nowrap transition-[opacity,width] duration-200 ${
                  collapsed ? "pointer-events-none w-0 opacity-0" : "w-auto opacity-100"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <Link
        href="/clinician-portal/profile"
        title={collapsed ? "Profile" : undefined}
        className={`flex items-center overflow-hidden rounded-[11px] bg-white/8 p-2.5 transition hover:bg-white/12 ${
          collapsed ? "justify-center gap-0" : "gap-2.5"
        }`}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dff0e4] text-[11px] font-semibold text-[#0f5132]">
            {initialsFor(fullName)}
          </div>
        )}
        <div
          className={`min-w-0 whitespace-nowrap transition-[opacity,width] duration-200 ${
            collapsed ? "pointer-events-none w-0 opacity-0" : "w-auto opacity-100"
          }`}
        >
          <div className="truncate text-[11.5px] font-semibold text-white">{fullName ?? roleLabel}</div>
          <div className="text-[10px] text-[#8fb5a0]">{roleLabel}</div>
        </div>
      </Link>
    </aside>
  );
}
