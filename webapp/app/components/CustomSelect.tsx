"use client";

import { useState, useRef, useEffect } from "react";

const triggerBaseClass =
  "flex w-full min-w-0 items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-left text-sm text-slate-900 shadow-sm transition-colors focus:border-[#1F5F2E] focus:outline-none focus:ring-2 focus:ring-[#1F5F2E]/20";

export type CustomSelectOption<T extends string = string> = {
  value: T;
  label: string;
};

type CustomSelectProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: CustomSelectOption<T>[];
  placeholder?: string;
  label?: string;
  id?: string;
  containerClassName?: string;
  "aria-label"?: string;
};

export function CustomSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = "Select…",
  label,
  id,
  containerClassName = "",
  "aria-label": ariaLabel,
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={ref} className={`relative ${containerClassName}`}>
      {label && (
        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        aria-label={ariaLabel ?? label ?? "Select option"}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className={`${triggerBaseClass} ${label ? "mt-1.5" : ""}`}
      >
        <span className={selected ? "text-slate-900" : "text-slate-400"}>{displayLabel}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
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
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={value === opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange(opt.value);
                  setOpen(false);
                }
              }}
              className="cursor-pointer px-4 py-2.5 text-sm text-slate-900 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
