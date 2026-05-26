"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  createAppointment,
  updateAppointmentStatus,
} from "../../home/clinician-actions";

type Appointment = {
  id: string;
  patient_id: string;
  clinician_id: string;
  scheduled_at: string;
  status: string;
  patient_name: string | null;
  clinician_name: string | null;
  patient_avatar?: string | null;
};

type Patient = {
  id: string;
  full_name: string | null;
};

type Props = {
  appointments: Appointment[];
  patients: Patient[];
};

const PlusIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ListViewIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const GridViewIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const UserIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

type CalendarProps = {
  month: Date;
  selected: Date | null;
  onMonthChange: (d: Date) => void;
  onSelect: (d: Date) => void;
};

function Calendar({ month, selected, onMonthChange, onSelect }: CalendarProps) {
  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  const firstDayOfMonth = new Date(year, monthIdx, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const today = new Date();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthIdx, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="w-full rounded-lg border border-slate-300 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(new Date(year, monthIdx - 1, 1))}
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
          aria-label="Previous month"
        >
          <ChevronLeftIcon />
        </button>
        <div className="text-sm font-medium text-slate-900">
          {MONTH_NAMES[monthIdx]} {year}
        </div>
        <button
          type="button"
          onClick={() => onMonthChange(new Date(year, monthIdx + 1, 1))}
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
          aria-label="Next month"
        >
          <ChevronRightIcon />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-1 font-medium">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const isSelected = selected && isSameDay(cell, selected);
          const isToday = isSameDay(cell, today);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(cell)}
              className={`h-7 rounded-md text-xs transition ${
                isSelected
                  ? "bg-[#1F5F2E] font-semibold text-white"
                  : isToday
                  ? "bg-slate-100 font-semibold text-[#1F5F2E] hover:bg-slate-200"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {cell.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const getInitials = (name: string | null): string => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed": return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
    case "cancelled": return "bg-red-50 text-red-700 ring-1 ring-red-600/20";
    case "scheduled": return "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20";
    case "no_show": return "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20";
    default: return "bg-slate-100 text-slate-600";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "completed": return "Completed";
    case "cancelled": return "Canceled";
    case "scheduled": return "Scheduled";
    case "no_show": return "No show";
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

type AppointmentCardProps = {
  apt: Appointment;
  onStatus: (id: string, status: "completed" | "no_show" | "cancelled") => void;
  pendingId: string | null;
};

function AppointmentCard({ apt, onStatus, pendingId }: AppointmentCardProps) {
  const date = new Date(apt.scheduled_at);
  const isToday = date.toDateString() === new Date().toDateString();
  const isPast = date < new Date() && apt.status === "scheduled";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-[#1F5F2E]/30 hover:shadow-md">
      {isToday && apt.status === "scheduled" && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-[#1F5F2E] px-3 py-1.5 text-xs font-semibold text-white">
          Today
        </div>
      )}
      {isPast && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white">
          Past
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {apt.patient_avatar ? (
              <img src={apt.patient_avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-slate-400">
                {getInitials(apt.patient_name)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {apt.patient_name ?? "Patient"}
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
              <UserIcon />
              {apt.clinician_name ?? "Clinician"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1F5F2E]/10 text-[#1F5F2E]">
            <CalendarIcon />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </p>
            <p className="text-sm text-slate-500">
              {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(apt.status)}`}>
            {getStatusText(apt.status)}
          </span>
          <span className="text-xs text-slate-400">#{apt.id.slice(0, 8)}</span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          {apt.status === "scheduled" && (
            <>
              <button
                type="button"
                onClick={() => onStatus(apt.id, "completed")}
                disabled={pendingId !== null && pendingId !== apt.id}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pendingId === apt.id ? (
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ...
                  </span>
                ) : (
                  "Complete"
                )}
              </button>
              <button
                type="button"
                onClick={() => onStatus(apt.id, "no_show")}
                disabled={pendingId !== null && pendingId !== apt.id}
                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                No show
              </button>
              <button
                type="button"
                onClick={() => onStatus(apt.id, "cancelled")}
                disabled={pendingId !== null && pendingId !== apt.id}
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
          <Link
            href={`/clinician-portal/appointments/${apt.id}`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[#1F5F2E] transition hover:bg-[#1F5F2E]/5"
          >
            View details
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AppointmentsList({ appointments, patients }: Props) {
  const [creating, setCreating] = useState(false);
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [appointmentType, setAppointmentType] = useState("consultation");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const itemsPerPage = 12;
  const hasPatients = patients.length > 0;
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setShowStatusDropdown(false);
      }
    }

    if (showStatusDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showStatusDropdown]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!scheduledDate) {
      setError("Please select a date.");
      return;
    }
    const [hh, mm] = scheduledTime.split(":").map(Number);
    const combined = new Date(scheduledDate);
    combined.setHours(hh, mm, 0, 0);
    setCreating(true);
    const result = await createAppointment(patientId, combined.toISOString());
    setCreating(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setScheduledDate(null);
    setScheduledTime("09:00");
    setShowCreateForm(false);
  }

  async function handleStatus(appointmentId: string, status: "completed" | "no_show" | "cancelled") {
    setPendingId(appointmentId);
    setError(null);
    await updateAppointmentStatus(appointmentId, status);
    setPendingId(null);
  }

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    if (searchQuery) {
      filtered = filtered.filter(
        (apt) =>
          apt.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apt.clinician_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (dateFilter) {
      filtered = filtered.filter((apt) => {
        const d = new Date(apt.scheduled_at);
        return d.toISOString().slice(0, 10) === dateFilter;
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    return filtered;
  }, [appointments, searchQuery, dateFilter, statusFilter]);

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "scheduled", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Canceled" },
    { value: "no_show", label: "No Show" },
  ];

  const selectedStatusLabel = statusOptions.find((opt) => opt.value === statusFilter)?.label ?? "All Status";

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {hasPatients && (
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1F5F2E] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#174a23]"
            >
              <PlusIcon />
              New appointment
            </button>
          )}
          <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm">
            <CalendarIcon />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <div className="relative min-w-[180px] flex-1 sm:max-w-[240px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search patient or clinician..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#1F5F2E] focus:outline-none focus:ring-1 focus:ring-[#1F5F2E]"
            />
          </div>
          <div className="relative" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              aria-expanded={showStatusDropdown}
              aria-haspopup="true"
            >
              <span>{selectedStatusLabel}</span>
              <ChevronDownIcon />
            </button>
            {showStatusDropdown && (
              <div className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(option.value);
                      setCurrentPage(1);
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition ${
                      statusFilter === option.value
                        ? "bg-[#1F5F2E] text-white"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-md p-2 transition ${
                viewMode === "list" ? "bg-[#1F5F2E] text-white" : "text-slate-400 hover:text-slate-700"
              }`}
              aria-label="List view"
            >
              <ListViewIcon />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-2 transition ${
                viewMode === "grid" ? "bg-[#1F5F2E] text-white" : "text-slate-400 hover:text-slate-700"
              }`}
              aria-label="Grid view"
            >
              <GridViewIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Create Appointment Form */}
      {showCreateForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-slate-900">Create new appointment</h3>
          <form onSubmit={handleCreate} className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label htmlFor="patient" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Patient
                </label>
                <select
                  id="patient"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[#1F5F2E] focus:outline-none focus:ring-1 focus:ring-[#1F5F2E]"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name ?? p.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Date</label>
                <Calendar
                  month={calendarMonth}
                  selected={scheduledDate}
                  onMonthChange={setCalendarMonth}
                  onSelect={(d) => {
                    setScheduledDate(d);
                    setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="scheduled_time" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Time
                </label>
                <input
                  id="scheduled_time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[#1F5F2E] focus:outline-none focus:ring-1 focus:ring-[#1F5F2E]"
                />
              </div>
              <div>
                <label htmlFor="appointment_type" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Appointment Type
                </label>
                <select
                  id="appointment_type"
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-[#1F5F2E] focus:outline-none focus:ring-1 focus:ring-[#1F5F2E]"
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="check_up">Check-up</option>
                  <option value="screening">Screening</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="telehealth">Telehealth</option>
                </select>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Selected</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-sm text-slate-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1F5F2E]/10 text-[#1F5F2E]">
                      <CalendarIcon />
                    </span>
                    <span className={scheduledDate ? "font-medium" : "italic text-slate-400"}>
                      {scheduledDate
                        ? scheduledDate.toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "No date selected"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-slate-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1F5F2E]/10 text-[#1F5F2E]">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className="font-medium">{scheduledTime}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <div className="mt-auto flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1F5F2E] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#174a23] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusIcon />
                      Create appointment
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setError(null);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Appointments */}
      <div className="space-y-6">
        {paginatedAppointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <CalendarIcon />
            </div>
            <p className="mt-4 text-base font-medium text-slate-900">No appointments found</p>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery || statusFilter !== "all" || dateFilter
                ? "Try adjusting your search, date, or status filter."
                : "Create a new appointment to get started."}
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                : "grid gap-4 sm:grid-cols-1 lg:max-w-2xl"
            }
          >
            {paginatedAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                apt={apt}
                onStatus={handleStatus}
                pendingId={pendingId}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{startIndex + 1}</span>&ndash;
              <span className="font-medium text-slate-900">{Math.min(endIndex, filteredAppointments.length)}</span> of{" "}
              <span className="font-medium text-slate-900">{filteredAppointments.length}</span> appointments
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        currentPage === pageNum
                          ? "bg-[#1F5F2E] text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                      aria-label={`Go to page ${pageNum}`}
                      aria-current={currentPage === pageNum ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
