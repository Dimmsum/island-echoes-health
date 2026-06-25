"use client";

import { useState, useRef, useEffect } from "react";
import { AppointmentSelect } from "./AppointmentSelect";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const HOURS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

const MINUTES = [
  { value: "00", label: ":00" },
  { value: "15", label: ":15" },
  { value: "30", label: ":30" },
  { value: "45", label: ":45" },
];

const AMPM = [
  { value: "AM", label: "AM" },
  { value: "PM", label: "PM" },
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function buildISO(date: Date, hour: string, minute: string, ampm: string): string {
  let h = parseInt(hour, 10);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  const d = new Date(date);
  d.setHours(h, parseInt(minute, 10), 0, 0);
  return d.toISOString();
}

function formatDisplay(date: Date, hour: string, minute: string, ampm: string): string {
  const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return `${dateStr} · ${hour}:${minute} ${ampm}`;
}

type Props = {
  value: string; // ISO string or ""
  onChange: (iso: string) => void;
  id?: string;
};

export function DateTimePicker({ value, onChange, id }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [hour, setHour] = useState("9");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmpm] = useState("AM");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleOutside);
      return () => document.removeEventListener("mousedown", handleOutside);
    }
  }, [open]);

  function handleDayClick(day: number) {
    const date = new Date(viewYear, viewMonth, day);
    date.setHours(0, 0, 0, 0);
    if (date < today) return; // past date — blocked
    setSelectedDate(date);
    onChange(buildISO(date, hour, minute, ampm));
  }

  function handleTimeChange(h: string, m: string, ap: string) {
    setHour(h);
    setMinute(m);
    setAmpm(ap);
    if (selectedDate) onChange(buildISO(selectedDate, h, m, ap));
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const isPrevBlocked =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth <= today.getMonth());

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startOffset = firstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const displayValue =
    selectedDate && value
      ? formatDisplay(selectedDate, hour, minute, ampm)
      : "";

  return (
    <div ref={ref} className="relative mt-1.5">
      {/* Trigger */}
      <button
        type="button"
        id={id}
        onClick={() => setOpen((p) => !p)}
        className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-left text-[14px] transition-colors ${
          open
            ? "border-[#1F8A5B] ring-1 ring-[#1F8A5B]/10"
            : "border-[#E9EEE9] hover:border-[#C9E6D5]"
        }`}
      >
        <span className={displayValue ? "text-[#16241D]" : "text-[#c0c8c3]"}>
          {displayValue || "Select date & time…"}
        </span>
        {/* Calendar icon */}
        <svg className="h-4 w-4 shrink-0 text-[#8a988f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={1.8} strokeLinecap="round" />
          <path d="M16 2v4M8 2v4M3 10h18" strokeWidth={1.8} strokeLinecap="round" />
        </svg>
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute z-30 mt-2 w-72 rounded-2xl border border-[#E9EEE9] bg-white p-4 shadow-xl">
          {/* Month navigation */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              disabled={isPrevBlocked}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#8a988f] transition hover:bg-[#F4F7F3] disabled:cursor-not-allowed disabled:opacity-30"
            >
              ‹
            </button>
            <span className="text-[14px] font-bold text-[#16241D]">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#8a988f] transition hover:bg-[#F4F7F3]"
            >
              ›
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {DAYS.map((d) => (
              <span key={d} className="text-[10px] font-semibold uppercase tracking-wider text-[#8a988f]">
                {d}
              </span>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5 text-center">
            {cells.map((day, i) => {
              if (!day) return <span key={`empty-${i}`} />;

              const cellDate = new Date(viewYear, viewMonth, day);
              cellDate.setHours(0, 0, 0, 0);
              const isPast = cellDate < today;
              const isToday = cellDate.getTime() === today.getTime();
              const isSelected =
                selectedDate &&
                selectedDate.getFullYear() === viewYear &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getDate() === day;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleDayClick(day)}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-medium transition ${
                    isSelected
                      ? "bg-[#1F8A5B] text-white"
                      : isPast
                      ? "cursor-not-allowed text-[#d0d8d3]"
                      : isToday
                      ? "font-bold text-[#1F8A5B] hover:bg-[#EFF6F1]"
                      : "text-[#16241D] hover:bg-[#F4F7F3]"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time selectors — shown after a day is picked */}
          {selectedDate && (
            <div className="mt-4 border-t border-[#F0F4F0] pt-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#8a988f]">
                Time
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <AppointmentSelect
                    value={hour}
                    onChange={(h) => handleTimeChange(h, minute, ampm)}
                    options={HOURS}
                  />
                </div>
                <div className="flex-1">
                  <AppointmentSelect
                    value={minute}
                    onChange={(m) => handleTimeChange(hour, m, ampm)}
                    options={MINUTES}
                  />
                </div>
                <div className="w-20">
                  <AppointmentSelect
                    value={ampm}
                    onChange={(ap) => handleTimeChange(hour, minute, ap)}
                    options={AMPM}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-3 w-full rounded-[10px] bg-[#1F8A5B] py-2 text-[13px] font-semibold text-white hover:bg-[#17764e]"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
