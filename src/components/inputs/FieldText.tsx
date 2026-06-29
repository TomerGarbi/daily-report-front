import * as React from "react";
import { cn } from "@/lib/utils";

export interface FieldTextProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Lucide icon rendered inside the start (right) of the input */
  startIcon?: React.ReactNode;
  /** Custom class for the label element */
  labelClassName?: string;
  /** Custom background class for the input (default: "bg-white") */
  bgColor?: string;
}

const FieldText = React.forwardRef<HTMLInputElement, FieldTextProps>(
  ({ label, error, hint, startIcon, labelClassName, bgColor = "bg-white", className, id, required, dir, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const describedBy = error ? errorId : hint ? hintId : undefined;

    return (
      <div className="flex flex-col gap-0.5" dir={dir}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn("text-sm font-medium text-slate-700", labelClassName)}
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
            dir={dir}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-required={required || undefined}
            className={cn(
              `w-full rounded-xl border ${bgColor} px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none`,
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

        {error && <p id={errorId} className="text-xs text-rose-500">{error}</p>}
        {!error && hint && <p id={hintId} className="text-xs text-slate-400">{hint}</p>}
      </div>
    );
  }
);

FieldText.displayName = "FieldText";
export { FieldText };
