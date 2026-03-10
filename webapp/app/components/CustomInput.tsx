"use client";

import { forwardRef } from "react";

const baseInputClass =
  "block w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-[#1F5F2E] focus:outline-none focus:ring-2 focus:ring-[#1F5F2E]/20 [appearance:auto]";

type CustomInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label?: string;
  id?: string;
  containerClassName?: string;
};

export const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ label, id, containerClassName = "", ...props }, ref) => {
    const inputId = id ?? (label ? label.replace(/\s+/g, "-").toLowerCase() : undefined);
    return (
      <div className={containerClassName}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium uppercase tracking-wider text-slate-500">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${baseInputClass} ${label ? "mt-1.5" : ""}`}
          {...props}
        />
      </div>
    );
  }
);
CustomInput.displayName = "CustomInput";
