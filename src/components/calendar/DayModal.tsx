"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { CalEvent, STATUS_META, toKey } from "@/components/calendar/calendar.types";
import {
  CalendarDays,
  Plus,
  X,
  Clock,
  User2,
  Tag,
} from "lucide-react";

interface DayModalProps {
  date: Date;
  events: CalEvent[];
  onClose: () => void;
  onAdd: (dateStr: string) => void;
  onNavigate: (id: string) => void;
}

export function DayModal({ date, events, onClose, onAdd, onNavigate }: DayModalProps) {
  const key = toKey(date);
  const sorted = [...events].sort((a, b) => a.time.localeCompare(b.time));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-2xl shadow-orange-900/10">
          {/* Header */}
          <div className="relative flex items-start justify-between overflow-hidden border-b border-orange-100 bg-white px-6 pb-5 pt-0">
            {/* Thin orange accent bar at top */}
            <div className="absolute inset-x-0 top-0 h-1 bg-orange-500" />
            {/* Large watermark day number */}
            <span className="pointer-events-none absolute -bottom-3 left-2 select-none text-[110px] font-black leading-none text-orange-50">
              {date.getDate()}
            </span>

            {/* Left: date badge + text */}
            <div className="relative z-10 mt-5 flex items-center gap-4">
              {/* Orange date badge */}
              <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-400/40">
                <span className="text-2xl font-black leading-none">{date.getDate()}</span>
                <span className="mt-0.5 text-[10px] font-semibold opacity-80">
                  {date.toLocaleDateString("he-IL", { month: "short" })}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-400">
                  {date.toLocaleDateString("he-IL", { weekday: "long" })}
                </p>
                <h2 className="text-xl font-bold text-slate-800">
                  {date.toLocaleDateString("he-IL", { month: "long", year: "numeric" })}
                </h2>
                {sorted.length > 0 && (
                  <p className="mt-0.5 text-xs text-slate-400">{sorted.length} דוחות ביום זה</p>
                )}
              </div>
            </div>

            {/* Right: actions */}
            <div className="relative z-10 mt-5 flex items-center gap-2">
              <button
                onClick={() => {
                  onAdd(key);
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-orange-400/30 hover:bg-orange-600 transition-colors"
              >
                <Plus size={13} /> דוח חדש
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-orange-50 hover:text-orange-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <CalendarDays size={44} className="mb-3 text-orange-200" />
              <p className="text-sm font-medium text-slate-600">אין דוחות ליום זה</p>
              <p className="mt-1 text-xs text-slate-400">לחצו על ״דוח חדש״ ליצירה</p>
            </div>
          ) : (
            <ul className="max-h-[55vh] divide-y divide-orange-50 overflow-y-auto">
              {sorted.map((ev) => (
                <li
                  key={ev.id}
                  onClick={() => {
                    if (ev.reportId) {
                      onNavigate(ev.reportId);
                      onClose();
                    }
                  }}
                  className={cn(
                    "flex items-start gap-3 px-6 py-4 transition-colors",
                    ev.reportId ? "cursor-pointer hover:bg-orange-50/60" : "cursor-default"
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full",
                      STATUS_META[ev.status].dot
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800">{ev.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {ev.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <User2 size={11} />
                        {ev.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag size={11} />
                        {ev.category}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "mt-0.5 flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      STATUS_META[ev.status].badge
                    )}
                  >
                    {STATUS_META[ev.status].label}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Footer */}
          <div className="border-t border-orange-100 bg-orange-50/60 px-6 py-3 flex items-center justify-between">
            <span className="text-xs text-orange-400">לחץ על דוח לפתיחה</span>
            <button
              onClick={onClose}
              className="rounded-lg border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-50 transition-colors"
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
