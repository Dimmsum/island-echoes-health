"use client";

import { useState } from "react";
import { AppointmentSelect } from "./AppointmentSelect";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const HOURS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const MINUTES = [
  { value: "00", label: ":00" },
  { value: "15", label: ":15" },
  { value: "30", label: ":30" },
  { value: "45", label: ":45" },
];
const AMPM = [{ value: "AM", label: "AM" }, { value: "PM", label: "PM" }];

const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };

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

type Props = {
  onChange: (iso: string) => void;
};

export function CalendarPanel({ onChange }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hour, setHour] = useState("9");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmpm] = useState("AM");

  function handleDayClick(day: number) {
    const date = new Date(viewYear, viewMonth, day);
    date.setHours(0, 0, 0, 0);
    if (date < today) return;
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
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
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
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-2xl border border-[#E9EEE9] bg-white p-5">
      {/* Month header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          disabled={isPrevBlocked}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[16px] text-[#8a988f] transition hover:bg-[#F4F7F3] disabled:cursor-not-allowed disabled:opacity-25"
        >
          ‹
        </button>
        <span className="text-[14px] font-bold text-[#16241D]">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[16px] text-[#8a988f] transition hover:bg-[#F4F7F3]"
        >
          ›
        </button>
      </div>

      {/* Day-of-week row */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {DAYS.map((d) => (
          <span key={d} style={monoStyle} className="text-[10px] font-semibold uppercase tracking-wider text-[#8a988f]">
            {d}
          </span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {cells.map((day, i) => {
          if (!day) return <span key={`e-${i}`} />;
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
              className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-medium transition ${
                isSelected
                  ? "bg-[#1F8A5B] font-bold text-white"
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

      {/* Time selectors */}
      <div className="mt-5 border-t border-[#F0F4F0] pt-4">
        <p style={monoStyle} className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8a988f]">
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
          <div className="w-[72px]">
            <AppointmentSelect
              value={ampm}
              onChange={(ap) => handleTimeChange(hour, minute, ap)}
              options={AMPM}
            />
          </div>
        </div>

        {selectedDate && (
          <p className="mt-3 rounded-xl bg-[#EFF6F1] px-3 py-2 text-center text-[12px] font-semibold text-[#1F8A5B]">
            {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            {" · "}
            {hour}:{minute} {ampm}
          </p>
        )}
      </div>
    </div>
  );
}
