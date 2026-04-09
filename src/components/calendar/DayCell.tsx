"use client";

import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import {
  CalEvent,
  DisplayStatus,
  STATUS_META,
  toKey,
  densityClass,
} from "@/components/calendar/calendar.types";

interface DayCellProps {
  date: Date;
  events: CalEvent[];
  isToday: boolean;
  isCurrentMonth: boolean;
  visibleStatuses: Set<DisplayStatus>;
  onAdd: (dateStr: string) => void;
  onNavigate: (id: string) => void;
  onDayClick: (key: string) => void;
}

export function DayCell({
  date,
  events,
  isToday,
  isCurrentMonth,
  visibleStatuses,
  onAdd,
  onNavigate,
  onDayClick,
}: DayCellProps) {
  const visible = events.filter((e) => visibleStatuses.has(e.status));
  const key = toKey(date);

  return (
    <div
      onClick={() => onDayClick(key)}
      className={cn(
        "group relative flex min-h-[90px] cursor-pointer flex-col border-b border-r border-slate-200 p-1.5 transition-colors hover:bg-orange-50/30",
        isCurrentMonth ? "bg-white" : "bg-slate-50/60",
        isToday && "bg-orange-50/60 hover:bg-orange-50",
        densityClass(visible.length)
      )}
    >
      {/* Day number row */}
      <div className="mb-1 flex items-center justify-between">
        <span
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
            isToday
              ? "bg-orange-500 text-white"
              : isCurrentMonth
                ? "text-slate-700"
                : "text-slate-300"
          )}
        >
          {date.getDate()}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd(key);
          }}
          className="hidden h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-500 hover:bg-orange-200 group-hover:flex transition-colors"
          title="צור דוח ליום זה"
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Density dots */}
      <div className="mb-1 flex flex-wrap gap-0.5">
        {visible.slice(0, 6).map((ev) => (
          <span
            key={ev.id}
            className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", STATUS_META[ev.status].dot)}
          />
        ))}
        {visible.length > 6 && (
          <span className="text-[9px] leading-none text-slate-400">+{visible.length - 6}</span>
        )}
      </div>

      {/* Event pills */}
      <div className="space-y-0.5 overflow-hidden">
        {visible.slice(0, 2).map((ev) => (
          <div
            key={ev.id}
            className={cn(
              "truncate rounded border px-1.5 py-0.5 text-[10px] font-medium",
              STATUS_META[ev.status].bg
            )}
            title={ev.title}
          >
            {ev.title}
          </div>
        ))}
        {visible.length > 2 && (
          <div className="px-1.5 text-[10px] text-slate-400">+{visible.length - 2} נוספים</div>
        )}
      </div>
    </div>
  );
}
