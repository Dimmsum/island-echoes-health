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
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const ListViewIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const GridViewIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
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

const getInitials = (name: string | null): string => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getStatusDot = (status: string) => {
  switch (status) {
    case "completed":
      return <span className="h-2 w-2 rounded-full bg-blue-500" />;
    case "cancelled":
      return <span className="h-2 w-2 rounded-full bg-red-500" />;
    case "scheduled":
      return <span className="h-2 w-2 rounded-full bg-[#1F5F2E]" />;
    case "no_show":
      return <span className="h-2 w-2 rounded-full bg-amber-500" />;
    default:
      return <span className="h-2 w-2 rounded-full bg-slate-400" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "completed":
      return "Completed";
    case "cancelled":
      return "Canceled";
    case "scheduled":
      return "Scheduled";
    case "no_show":
      return "No show";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "cancelled":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "scheduled":
      return "bg-[#1F5F2E]/30 text-[#9CCB4A] border-[#1F5F2E]/40";
    case "no_show":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
};

const ArrowRightIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

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
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1a1f26] transition hover:border-[#1F5F2E]/40 hover:shadow-lg hover:shadow-[#1F5F2E]/5">
      {isToday && apt.status === "scheduled" && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-[#1F5F2E] px-3 py-1.5 text-xs font-semibold text-white">
          Today
        </div>
      )}
      {isPast && (
        <div className="absolute right-0 top-0 rounded-bl-xl bg-amber-500/90 px-3 py-1.5 text-xs font-semibold text-white">
          Past
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/5">
            {apt.patient_avatar ? (
              <img src={apt.patient_avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                {getInitials(apt.patient_name)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-white">
              {apt.patient_name ?? "Patient"}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
              <UserIcon />
              {apt.clinician_name ?? "Clinician"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="rounded-lg bg-[#1F5F2E]/20 p-2 text-[#9CCB4A]">
            <CalendarIcon />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-sm text-slate-400">
              {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusStyles(apt.status)}`}
          >
            {getStatusDot(apt.status)}
            {getStatusText(apt.status)}
          </span>
          <span className="text-xs text-slate-500">#{apt.id.slice(0, 8)}</span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          {apt.status === "scheduled" && (
            <>
              <button
                type="button"
                onClick={() => onStatus(apt.id, "completed")}
                disabled={pendingId !== null && pendingId !== apt.id}
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pendingId === apt.id ? (
                  <span className="flex items-center gap-1">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
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
                className="rounded-lg bg-amber-500/20 px-3 py-2 text-xs font-medium text-amber-400 transition hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                No show
              </button>
              <button
                type="button"
                onClick={() => onStatus(apt.id, "cancelled")}
                disabled={pendingId !== null && pendingId !== apt.id}
                className="rounded-lg bg-red-500/20 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </>
          )}
          <Link
            href={`/clinician-portal/appointments/${apt.id}`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#1F5F2E]/20 px-3 py-2 text-sm font-medium text-[#9CCB4A] transition hover:bg-[#1F5F2E]/30"
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
  const [scheduledAt, setScheduledAt] = useState("");
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

  // Close dropdown when clicking outside
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
    setCreating(true);
    const result = await createAppointment(patientId, scheduledAt);
    setCreating(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setScheduledAt("");
    setShowCreateForm(false);
  }

  async function handleStatus(appointmentId: string, status: "completed" | "no_show" | "cancelled") {
    setPendingId(appointmentId);
    setError(null);
    await updateAppointmentStatus(appointmentId, status);
    setPendingId(null);
  }

  // Filter and search appointments
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

  // Pagination
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
    <div className="space-y-8">
      {/* Toolbar: New appointment + filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {hasPatients && (
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1F5F2E] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1F5F2E]/25 transition hover:bg-[#174622] hover:shadow-[#1F5F2E]/30"
            >
              <PlusIcon />
              New appointment
            </button>
          )}
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2">
            <CalendarIcon />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border-none bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none [color-scheme:dark]"
            />
          </div>
          <div className="relative flex-1 min-w-[180px] sm:max-w-[240px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
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
              className="w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#1F5F2E] focus:outline-none focus:ring-1 focus:ring-[#1F5F2E]"
            />
          </div>
          <div className="relative" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              aria-expanded={showStatusDropdown}
              aria-haspopup="true"
            >
              <span>{selectedStatusLabel}</span>
              <ChevronDownIcon />
            </button>
            {showStatusDropdown && (
              <div className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-white/15 bg-[#1a1f26] shadow-xl">
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
                        : "text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-lg p-2 transition ${
                viewMode === "list" ? "bg-[#1F5F2E] text-white" : "text-slate-400 hover:text-white"
              }`}
              aria-label="List view"
            >
              <ListViewIcon />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-2 transition ${
                viewMode === "grid" ? "bg-[#1F5F2E] text-white" : "text-slate-400 hover:text-white"
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
        <div className="rounded-2xl border border-white/10 bg-[#1a1f26] p-6 shadow-xl">
          <h3 className="mb-6 text-lg font-semibold text-white">Create new appointment</h3>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="patient" className="mb-2 block text-sm font-medium text-slate-300">
                  Patient
                </label>
                <select
                  id="patient"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#1F5F2E] focus:outline-none focus:ring-1 focus:ring-[#1F5F2E]"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#1a1f26] text-white">
                      {p.full_name ?? p.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="scheduled_at" className="mb-2 block text-sm font-medium text-slate-300">
                  Date & time
                </label>
                <input
                  id="scheduled_at"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#1F5F2E] focus:outline-none focus:ring-1 focus:ring-[#1F5F2E] [color-scheme:dark]"
                />
              </div>
            </div>
            {error && (
              <div className="rounded-xl bg-red-500/15 border border-red-500/30 p-3 text-sm text-red-300">{error}</div>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1F5F2E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#174622] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appointments cards */}
      <div className="space-y-6">
        {paginatedAppointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-16 text-center">
            <span className="inline-flex rounded-full bg-white/10 p-5 text-slate-500">
              <CalendarIcon />
            </span>
            <p className="mt-4 text-base font-medium text-white">No appointments found</p>
            <p className="mt-1 text-sm text-slate-400">
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
          <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#1a1f26] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">
              Showing <span className="font-medium text-white">{startIndex + 1}</span>–
              <span className="font-medium text-white">{Math.min(endIndex, filteredAppointments.length)}</span> of{" "}
              <span className="font-medium text-white">{filteredAppointments.length}</span> appointments
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          : "text-slate-400 hover:bg-white/10 hover:text-white"
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
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
