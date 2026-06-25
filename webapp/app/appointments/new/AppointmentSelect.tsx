"use client";

import { useState, useRef, useEffect } from "react";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  id?: string;
};

export function AppointmentSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Select…",
  id,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleOutside);
      return () => document.removeEventListener("mousedown", handleOutside);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative mt-1.5">
      <button
        type="button"
        id={id}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((p) => !p)}
        className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-left text-[14px] transition-colors ${
          open
            ? "border-[#1F8A5B] ring-1 ring-[#1F8A5B]/10"
            : "border-[#E9EEE9] hover:border-[#C9E6D5]"
        }`}
      >
        <span className={selected ? "text-[#16241D]" : "text-[#c0c8c3]"}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-[#8a988f] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-[#E9EEE9] bg-white py-1 shadow-lg"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`cursor-pointer px-4 py-2.5 text-[14px] transition-colors ${
                  isSelected
                    ? "bg-[#EFF6F1] font-semibold text-[#1F8A5B]"
                    : "text-[#16241D] hover:bg-[#F4F7F3]"
                }`}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
