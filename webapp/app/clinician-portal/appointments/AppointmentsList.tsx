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

const FilterIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
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

const MoreVerticalIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
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
      return "Active";
    case "no_show":
      return "Upcoming";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export function AppointmentsList({ appointments, patients }: Props) {
  const [creating, setCreating] = useState(false);
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const itemsPerPage = 15;
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

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (apt) =>
          apt.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apt.clinician_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    return filtered;
  }, [appointments, searchQuery, statusFilter]);

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
    <div className="space-y-6">
      {/* Header with New Appointment Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Appointments</h2>
        </div>
        {hasPatients && (
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
          >
            <PlusIcon />
            New Appointment
          </button>
        )}
      </div>

      {/* Create Appointment Form */}
      {showCreateForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-slate-900">Create New Appointment</h3>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="patient" className="mb-2 block text-sm font-medium text-slate-700">
                  Patient
                </label>
                <select
                  id="patient"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[#1F5F2E] focus:outline-none focus:ring-2 focus:ring-[#1F5F2E]/20"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name ?? p.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="scheduled_at" className="mb-2 block text-sm font-medium text-slate-700">
                  Date & Time
                </label>
                <input
                  id="scheduled_at"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[#1F5F2E] focus:outline-none focus:ring-2 focus:ring-[#1F5F2E]/20"
                />
              </div>
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 rounded-lg bg-[#1F5F2E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#174622] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusIcon />
                    Create Appointment
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setError(null);
                }}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5">
          <CalendarIcon />
          <input
            type="date"
            className="border-none bg-transparent text-sm text-slate-700 focus:outline-none"
            onChange={(e) => {
              // Date filter logic can be added here
            }}
          />
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search appointments..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F2E] focus:outline-none focus:ring-2 focus:ring-[#1F5F2E]/20"
          />
        </div>
        {/* Custom Status Filter Dropdown */}
        <div className="relative" ref={statusDropdownRef}>
          <button
            type="button"
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:border-[#1F5F2E] focus:outline-none focus:ring-2 focus:ring-[#1F5F2E]/20"
            aria-expanded={showStatusDropdown}
            aria-haspopup="true"
          >
            <span>{selectedStatusLabel}</span>
            <ChevronDownIcon />
          </button>
          {showStatusDropdown && (
            <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
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
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:border-[#1F5F2E] focus:outline-none focus:ring-2 focus:ring-[#1F5F2E]/20"
        >
          <FilterIcon />
          Filter
        </button>
        <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white p-1">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded p-1.5 transition ${
              viewMode === "list"
                ? "bg-[#1F5F2E] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            aria-label="List view"
          >
            <ListViewIcon />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`rounded p-1.5 transition ${
              viewMode === "grid"
                ? "bg-[#1F5F2E] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            aria-label="Grid view"
          >
            <GridViewIcon />
          </button>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  ID
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Patient
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Doctor
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Time
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Status
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-500">
                    No appointments found
                  </td>
                </tr>
              ) : (
                paginatedAppointments.map((apt) => (
                  <tr key={apt.id} className="transition hover:bg-slate-50/50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {apt.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
                          {apt.patient_avatar ? (
                            <img
                              src={apt.patient_avatar}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs font-semibold text-slate-600">
                              {getInitials(apt.patient_name)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {apt.patient_name ?? "Patient"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {apt.clinician_name ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-slate-600">
                        {new Date(apt.scheduled_at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(apt.scheduled_at).toLocaleDateString("en-US", {
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusDot(apt.status)}
                        <span className="text-sm text-slate-600">{getStatusText(apt.status)}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {apt.status === "scheduled" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatus(apt.id, "completed")}
                              disabled={pendingId !== null && pendingId !== apt.id}
                              className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {pendingId === apt.id ? (
                                <span className="flex items-center gap-1">
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-green-700 border-t-transparent" />
                                  Processing...
                                </span>
                              ) : (
                                "Complete"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatus(apt.id, "no_show")}
                              disabled={pendingId !== null && pendingId !== apt.id}
                              className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {pendingId === apt.id ? "..." : "No Show"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatus(apt.id, "cancelled")}
                              disabled={pendingId !== null && pendingId !== apt.id}
                              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {pendingId === apt.id ? "..." : "Cancel"}
                            </button>
                          </>
                        )}
                        <Link
                          href={`/clinician-portal/appointments/${apt.id}`}
                          className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100"
                          aria-label="View appointment details"
                        >
                          <MoreVerticalIcon />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              Showing <span className="font-medium">{startIndex + 1}</span>-
              <span className="font-medium">{Math.min(endIndex, filteredAppointments.length)}</span> of{" "}
              <span className="font-medium">{filteredAppointments.length}</span> appointments
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        currentPage === pageNum
                          ? "bg-[#1F5F2E] text-white"
                          : "bg-white text-slate-700 hover:bg-slate-50"
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
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
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
