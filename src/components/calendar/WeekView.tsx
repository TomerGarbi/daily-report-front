"use client";

import { cn } from "@/lib/utils";
import {
  CalEvent,
  DisplayStatus,
  STATUS_META,
  toKey,
} from "@/components/calendar/calendar.types";
import { DayCell } from "@/components/calendar/DayCell";

interface WeekViewProps {
  weekStart: Date;
  eventsByDate: Map<string, CalEvent[]>;
  visibleStatuses: Set<DisplayStatus>;
  onAdd: (dateStr: string) => void;
  onNavigate: (id: string) => void;
  onDayClick: (key: string) => void;
}

export function WeekView({
  weekStart,
  eventsByDate,
  visibleStatuses,
  onAdd,
  onNavigate,
  onDayClick,
}: WeekViewProps) {
  const todayKey = toKey(new Date());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="grid flex-1 grid-cols-7 border-l border-t border-slate-100">
      {days.map((d) => {
        const key = toKey(d);
        return (
          <DayCell
            key={key}
            date={d}
            events={eventsByDate.get(key) ?? []}
            isToday={key === todayKey}
            isCurrentMonth
            visibleStatuses={visibleStatuses}
            onAdd={onAdd}
            onNavigate={onNavigate}
            onDayClick={onDayClick}
          />
        );
      })}
    </div>
  );
}
