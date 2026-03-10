"use client";

const baseClass =
  "block w-full min-w-0 resize-y rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-[#1F5F2E] focus:outline-none focus:ring-2 focus:ring-[#1F5F2E]/20 min-h-[80px]";

type CustomTextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  id?: string;
  containerClassName?: string;
};

export function CustomTextArea({
  label,
  id,
  containerClassName = "",
  className = "",
  ...props
}: CustomTextAreaProps) {
  const inputId = id ?? (label ? label.replace(/\s+/g, "-").toLowerCase() : undefined);
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`${baseClass} ${label ? "mt-1.5" : ""} ${className}`}
        {...props}
      />
    </div>
  );
}
