"use client";

import { cn } from "@/lib/utils";
import {
  CalEvent,
  DisplayStatus,
  STATUS_META,
  toKey,
} from "@/components/calendar/calendar.types";
import { CalendarDays, Plus, Clock, User2, Tag } from "lucide-react";

interface DayViewProps {
  date: Date;
  eventsByDate: Map<string, CalEvent[]>;
  visibleStatuses: Set<DisplayStatus>;
  onAdd: (dateStr: string) => void;
  onNavigate: (id: string) => void;
}

export function DayView({
  date,
  eventsByDate,
  visibleStatuses,
  onAdd,
  onNavigate,
}: DayViewProps) {
  const key = toKey(date);
  const evs = (eventsByDate.get(key) ?? []).filter((e) => visibleStatuses.has(e.status));

  return (
    <div className="flex-1 space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">
          {date.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
        </h3>
        <button
          onClick={() => onAdd(key)}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
        >
          <Plus size={14} /> צור דוח
        </button>
      </div>

      {evs.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
          <CalendarDays size={36} className="mb-2 opacity-30" />
          <p className="text-sm">אין דוחות ליום זה</p>
          <p className="mt-1 text-xs text-slate-300">לחץ על + כדי ליצור דוח חדש</p>
        </div>
      ) : (
        <div className="space-y-2">
          {evs
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((ev) => (
              <div
                key={ev.id}
                onClick={() => ev.reportId && onNavigate(ev.reportId)}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all hover:shadow-sm",
                  STATUS_META[ev.status].bg
                )}
              >
                <span className={cn("mt-1 h-3 w-3 flex-shrink-0 rounded-full", STATUS_META[ev.status].dot)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700">{ev.title}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
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
                <span className={cn("flex-shrink-0 rounded px-2 py-0.5 text-xs font-semibold", STATUS_META[ev.status].badge)}>
                  {STATUS_META[ev.status].label}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
