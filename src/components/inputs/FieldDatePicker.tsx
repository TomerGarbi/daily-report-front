"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTHS_HE = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

// Sunday-first, matches getDay() 0..6
const WEEKDAYS_SHORT = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ---------------------------------------------------------------------------
// Internal calendar panel
// ---------------------------------------------------------------------------

type View = "cal" | "month";

function CalendarPanel({
  selected,
  onSelect,
  onClose,
}: {
  selected?: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const init = selected ?? today;

  const [view, setView] = React.useState<View>("cal");
  const [viewYear, setViewYear] = React.useState(init.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(init.getMonth());

  // Current year ± range for year dropdown
  const currentYear = today.getFullYear();
  const yearRange = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  // Build flat array of 42 cells (6 rows × 7 cols)
  function buildGrid() {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { date: Date; current: boolean }[] = [];

    // Trailing days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({
        date: new Date(viewYear, viewMonth - 1, prevMonthDays - i),
        current: false,
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(viewYear, viewMonth, d), current: true });
    }

    // Leading days from next month
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ date: new Date(viewYear, viewMonth + 1, d), current: false });
    }

    return cells;
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  return (
    <div className="w-72 select-none">
      {/* ── Header ── */}
      {/* In RTL flex: first child is rightmost. Order: [prevBtn, pills, nextBtn]
          → prevBtn on RIGHT (ChevronRight = back), nextBtn on LEFT (ChevronLeft = forward) */}
      <div className="flex items-center justify-between px-1 py-1 mb-1">
        {/* Prev month — rightmost in RTL */}
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Month + Year pills */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView((v) => (v === "month" ? "cal" : "month"))}
            className={cn(
              "rounded-lg px-2.5 py-1 text-sm font-semibold transition-colors",
              view === "month"
                ? "bg-orange-500 text-white"
                : "text-slate-700 hover:bg-orange-50 hover:text-orange-600"
            )}
          >
            {MONTHS_HE[viewMonth]}
          </button>
          <select
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 cursor-pointer transition-colors"
          >
            {yearRange.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Next month — leftmost in RTL */}
        <button
          type="button"
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* ── Calendar grid ── */}
      {view === "cal" && (
        <>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS_SHORT.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-slate-400 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {buildGrid().map((cell, i) => {
              const isToday = sameDay(cell.date, today);
              const isSelected = !!selected && sameDay(cell.date, selected);

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    // Normalize to noon to avoid UTC-offset shifting the date
                    const d = new Date(cell.date);
                    d.setHours(12, 0, 0, 0);
                    onSelect(d);
                    onClose();
                  }}
                  className={cn(
                    "mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors",
                    // Other-month days
                    !cell.current && !isSelected && "text-slate-300 hover:bg-orange-50 hover:text-orange-300",
                    // Normal current-month day
                    cell.current && !isSelected && !isToday && "text-slate-700 hover:bg-orange-50 hover:text-orange-600",
                    // Today (not selected)
                    isToday && !isSelected && "ring-2 ring-orange-400 text-orange-600 font-semibold",
                    // Selected
                    isSelected && "bg-orange-500 text-white font-bold shadow-sm ring-0",
                  )}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── Month picker ── */}
      {view === "month" && (
        <div className="grid grid-cols-3 gap-1 p-1">
          {MONTHS_HE.map((m, i) => (
            <button
              key={m}
              type="button"
              onClick={() => { setViewMonth(i); setView("cal"); }}
              className={cn(
                "rounded-lg py-2 text-sm font-medium transition-colors",
                i === viewMonth
                  ? "bg-orange-500 text-white font-bold"
                  : "text-slate-700 hover:bg-orange-50 hover:text-orange-600"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      )}

    </div>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export interface FieldDatePickerProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export function FieldDatePicker({
  label,
  error,
  hint,
  required,
  placeholder = "בחר תאריך…",
  value,
  onChange,
  disabled,
  className,
}: FieldDatePickerProps) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ms-0.5 text-orange-500">*</span>}
        </label>
      )}

      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            id={id}
            type="button"
            dir="rtl"
            disabled={disabled}
            className={cn(
              "flex h-[42px] w-full items-center justify-between rounded-xl border bg-white px-3 text-sm shadow-sm outline-none",
              "transition-colors duration-150",
              open
                ? "border-orange-400 ring-2 ring-orange-100"
                : error
                ? "border-rose-400"
                : "border-slate-200 hover:border-slate-300",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <span className={value ? "text-slate-800" : "text-slate-400"}>
              {value ? fmt(value) : placeholder}
            </span>

            <div className="flex items-center gap-1">
              {value && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onChange?.(undefined); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange?.(undefined); } }}
                  className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
              <CalendarDays className="h-4 w-4 text-slate-400" />
            </div>
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            dir="rtl"
            align="start"
            sideOffset={4}
            className="z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg outline-none"
          >
            <CalendarPanel
              selected={value}
              onSelect={(d) => onChange?.(d)}
              onClose={() => setOpen(false)}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {error && <p className="text-xs text-rose-500">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
