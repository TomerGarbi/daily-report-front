"use client";

import { cn } from "@/lib/utils";
import {
  CalEvent,
  DisplayStatus,
  STATUS_META,
  toKey,
} from "@/components/calendar/calendar.types";
import { CalendarDays, Plus } from "lucide-react";

interface AgendaViewProps {
  year: number;
  month: number;
  eventsByDate: Map<string, CalEvent[]>;
  visibleStatuses: Set<DisplayStatus>;
  onAdd: (dateStr: string) => void;
  onNavigate: (id: string) => void;
}

export function AgendaView({
  year,
  month,
  eventsByDate,
  visibleStatuses,
  onAdd,
  onNavigate,
}: AgendaViewProps) {
  const todayKey = toKey(new Date());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    const key = toKey(d);
    const evs = (eventsByDate.get(key) ?? []).filter((e) => visibleStatuses.has(e.status));
    return { date: d, key, evs };
  }).filter((d) => d.evs.length > 0);

  if (days.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-slate-400">
        <CalendarDays size={40} className="mb-3 opacity-20" />
        <p className="text-sm">אין דוחות בחודש זה</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {days.map(({ date, key, evs }) => (
        <div key={key}>
          <div className="mb-2 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                key === todayKey ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600"
              )}
            >
              {date.getDate()}
            </span>
            <span className="text-sm font-semibold text-slate-600">
              {date.toLocaleDateString("he-IL", { weekday: "short", month: "short" })}
            </span>
            <span className="text-xs text-slate-400">{evs.length} דוחות</span>
            <button
              onClick={() => onAdd(key)}
              className="mr-auto flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-400 hover:border-orange-400 hover:text-orange-500 transition-colors"
            >
              <Plus size={11} /> הוסף
            </button>
          </div>
          <div className="space-y-1.5 pr-10">
            {evs
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => ev.reportId && onNavigate(ev.reportId)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-all hover:shadow-sm",
                    STATUS_META[ev.status].bg
                  )}
                >
                  <span className={cn("h-2 w-2 flex-shrink-0 rounded-full", STATUS_META[ev.status].dot)} />
                  <span className="flex-1 truncate font-medium text-slate-700">{ev.title}</span>
                  <span className="text-xs text-slate-400">{ev.time}</span>
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", STATUS_META[ev.status].badge)}>
                    {STATUS_META[ev.status].label}
                  </span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
