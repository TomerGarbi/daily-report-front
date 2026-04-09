import * as React from "react";
import { cn } from "@/lib/utils";

export interface FieldTextProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Lucide icon rendered inside the start (right) of the input */
  startIcon?: React.ReactNode;
}

const FieldText = React.forwardRef<HTMLInputElement, FieldTextProps>(
  ({ label, error, hint, startIcon, className, id, required, ...props }, ref) => {
    const inputId = id ?? React.useId();

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
            {required && <span className="ms-0.5 text-orange-500">*</span>}
          </label>
        )}

        <div className="relative">
          {startIcon && (
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400">
              {startIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none",
              "placeholder:text-slate-400",
              "transition-colors duration-150",
              "focus:border-orange-400 focus:ring-2 focus:ring-orange-100",
              error
                ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100"
                : "border-slate-200 hover:border-slate-300",
              startIcon && "pe-9",
              className
            )}
            {...props}
          />
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}
        {!error && hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    );
  }
);

FieldText.displayName = "FieldText";
export { FieldText };
