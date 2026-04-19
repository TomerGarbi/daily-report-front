"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldMultiSelectProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  options: SelectOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  className?: string;
  /** Custom background class for the trigger (default: "bg-white") */
  bgColor?: string;
}

export function FieldMultiSelect({
  label,
  error,
  hint,
  required,
  placeholder = "×‘×—×¨ ××¤×©×¨×•×™×•×ªâ€¦",
  options,
  value = [],
  onChange,
  disabled,
  className,
  bgColor = "bg-white",
}: FieldMultiSelectProps) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allValues = options.map((o) => o.value);
  const allChecked = value.length === options.length && options.length > 0;
  const someChecked = value.length > 0 && !allChecked;

  function toggleOption(val: string) {
    if (!onChange) return;
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  }

  function toggleAll() {
    if (!onChange) return;
    onChange(allChecked ? [] : allValues);
  }

  function removeChip(val: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange?.(value.filter((v) => v !== val));
  }

  const selectedOptions = options.filter((o) => value.includes(o.value));

  return (
    <div className={cn("relative flex flex-col gap-1.5", className)} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ms-0.5 text-orange-500">*</span>}
        </label>
      )}

      {/* Trigger â€” fixed height, chips scroll horizontally */}
      <button
        id={id}
        type="button"
        dir="rtl"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          `flex h-[42px] w-full items-center rounded-xl border ${bgColor} px-3 shadow-sm outline-none text-sm`,
          "transition-colors duration-150",
          open
            ? "border-orange-400 ring-2 ring-orange-100"
            : error
            ? "border-rose-400"
            : "border-slate-200 hover:border-slate-300",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        {/* Scrollable chip row */}
        <div className="flex flex-1 items-center gap-1.5 overflow-x-auto min-w-0 [&::-webkit-scrollbar]:hidden">
          {allChecked ? (
            <span className="flex shrink-0 items-center rounded-lg bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              הכל
            </span>
          ) : value.length === 0 ? (
            <span className="text-slate-400 whitespace-nowrap">{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700"
              >
                {opt.label}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => removeChip(opt.value, e)}
                  onKeyDown={(e) => e.key === "Enter" && removeChip(opt.value, e as any)}
                  className="rounded-full hover:bg-orange-200 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          )}
        </div>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            "ms-2 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
          {/* Select-all row */}
          <button
            type="button"
            dir="rtl"
            onClick={toggleAll}
            className="flex w-full items-center gap-2 rounded-t-xl border-b border-slate-100 px-3 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-50"
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                allChecked
                  ? "border-orange-500 bg-orange-500"
                  : someChecked
                  ? "border-orange-400 bg-orange-100"
                  : "border-slate-300 bg-white"
              )}
            >
              {allChecked && <Check className="h-3 w-3 text-white" />}
              {someChecked && <span className="h-0.5 w-2 rounded bg-orange-500" />}
            </span>
            {allChecked ? "בטל בחירה" : "בחר הכל"}
          </button>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto p-1">
            {options.map((opt) => {
              const checked = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  dir="rtl"
                  onClick={() => toggleOption(opt.value)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700",
                    checked && "bg-orange-50 font-medium text-orange-700"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      checked ? "border-orange-500 bg-orange-500" : "border-slate-300 bg-white"
                    )}
                  >
                    {checked && <Check className="h-3 w-3 text-white" />}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-500">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
