"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useReports } from "@/hooks/useReports";
import { OverlaySpinner } from "@/components/Spinner";

import {
  DisplayStatus,
  ViewMode,
  CalEvent,
  ALL_STATUSES,
  DAY_NAMES,
  MONTH_NAMES,
  toKey,
  reportToEvent,
} from "@/components/calendar/calendar.types";
import { CalendarToolbar } from "@/components/calendar/CalendarToolbar";
import { DayModal } from "@/components/calendar/DayModal";
import { DayCell } from "@/components/calendar/DayCell";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { AgendaView } from "@/components/calendar/AgendaView";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const router = useRouter();
  const today  = new Date();
  const todayKey = toKey(today);

  const [view, setView]         = useState<ViewMode>("month");
  const [year, setYear]         = useState(today.getFullYear());
  const [month, setMonth]       = useState(today.getMonth());
  const [focusDay, setFocusDay] = useState(today);

  const [search, setSearch]               = useState("");
  const [visibleStatuses, setVisibleStatuses] = useState<Set<DisplayStatus>>(new Set(ALL_STATUSES));
  const [authorFilter, setAuthorFilter]   = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters]     = useState(false);

  // Modal state
  const [modalDayKey, setModalDayKey] = useState<string | null>(null);

  const { reports, isLoading } = useReports({ limit: 100 });

  const allEvents = useMemo<CalEvent[]>(
    () => reports.map(reportToEvent),
    [reports],
  );

  const allAuthors    = useMemo(() => ["all", ...Array.from(new Set(allEvents.map((e) => e.author)))], [allEvents]);
  const allCategories = useMemo(() => ["all", ...Array.from(new Set(allEvents.map((e) => e.category)))], [allEvents]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allEvents.filter((ev) => {
      if (!visibleStatuses.has(ev.status)) return false;
      if (authorFilter   !== "all" && ev.author   !== authorFilter)   return false;
      if (categoryFilter !== "all" && ev.category !== categoryFilter) return false;
      if (q && !ev.title.toLowerCase().includes(q) && !ev.author.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allEvents, visibleStatuses, authorFilter, categoryFilter, search]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const ev of filteredEvents) {
      const arr = map.get(ev.dateStr) ?? [];
      arr.push(ev);
      map.set(ev.dateStr, arr);
    }
    return map;
  }, [filteredEvents]);

  // Modal derived state
  const modalDate = useMemo(() => {
    if (!modalDayKey) return null;
    const [y, m, d] = modalDayKey.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [modalDayKey]);
  const modalEvents = useMemo(
    () => (modalDayKey ? (eventsByDate.get(modalDayKey) ?? []) : []),
    [modalDayKey, eventsByDate],
  );

  // Navigation
  const goPrev = () => {
    if (view === "month" || view === "agenda") {
      if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
    } else if (view === "week") {
      const d = new Date(focusDay); d.setDate(d.getDate() - 7); setFocusDay(d); setMonth(d.getMonth()); setYear(d.getFullYear());
    } else {
      const d = new Date(focusDay); d.setDate(d.getDate() - 1); setFocusDay(d); setMonth(d.getMonth()); setYear(d.getFullYear());
    }
  };
  const goNext = () => {
    if (view === "month" || view === "agenda") {
      if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
    } else if (view === "week") {
      const d = new Date(focusDay); d.setDate(d.getDate() + 7); setFocusDay(d); setMonth(d.getMonth()); setYear(d.getFullYear());
    } else {
      const d = new Date(focusDay); d.setDate(d.getDate() + 1); setFocusDay(d); setMonth(d.getMonth()); setYear(d.getFullYear());
    }
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setFocusDay(today); };

  const handleAdd        = (dateStr: string) => router.push(`/reports/new?date=${dateStr}`);
  const handleNavigate   = (id: string)      => router.push(`/reports/${id}`);
  const handleDayClick   = (key: string)     => setModalDayKey(key);

  const toggleStatus = (s: DisplayStatus) =>
    setVisibleStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) { if (next.size > 1) next.delete(s); } else next.add(s);
      return next;
    });

  // Month grid calculations
  const firstDow    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading     = (firstDow + 1) % 7;
  const total       = leading + daysInMonth;
  const rows        = Math.ceil(total / 7);

  const weekStart = useMemo(() => {
    const d = new Date(focusDay); d.setDate(d.getDate() - d.getDay()); return d;
  }, [focusDay]);

  const periodLabel = useMemo(() => {
    if (view === "month" || view === "agenda") return `${MONTH_NAMES[month]} ${year}`;
    if (view === "week") {
      const ws = new Date(weekStart);
      const we = new Date(weekStart); we.setDate(we.getDate() + 6);
      return `${ws.getDate()} – ${we.getDate()} ${MONTH_NAMES[we.getMonth()]} ${we.getFullYear()}`;
    }
    return focusDay.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }, [view, year, month, weekStart, focusDay]);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const activeCount = filteredEvents.filter((e) =>
    view === "day" ? e.dateStr === toKey(focusDay) : e.dateStr.startsWith(monthPrefix),
  ).length;

  return (
    <div className="relative flex min-h-[calc(100vh-7rem)] flex-col bg-slate-50" dir="rtl">

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <CalendarToolbar
        view={view}
        onViewChange={setView}
        periodLabel={periodLabel}
        activeCount={activeCount}
        search={search}
        onSearchChange={setSearch}
        visibleStatuses={visibleStatuses}
        onToggleStatus={toggleStatus}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((v) => !v)}
        authorFilter={authorFilter}
        onAuthorFilterChange={setAuthorFilter}
        allAuthors={allAuthors}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        allCategories={allCategories}
        onClearAttributeFilters={() => { setAuthorFilter("all"); setCategoryFilter("all"); }}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
      />

      {/* ── Calendar body ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden px-4 pb-6 pt-4 sm:px-6">
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 shadow-sm">

        {/* Month grid */}
        {view === "month" && (
          <>
            <div className="hidden flex-1 flex-col sm:flex">
              {/* DOW header */}
              <div className="grid grid-cols-7 border-b border-orange-600 bg-orange-500">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="border-r border-orange-400/40 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-white/90 last:border-none">
                    {d}
                  </div>
                ))}
              </div>
              {/* Cells */}
              <div className="grid flex-1 grid-cols-7 border-l border-slate-200" style={{ gridTemplateRows: `repeat(${rows}, minmax(90px, 1fr))` }}>
                {Array.from({ length: leading }).map((_, i) => (
                  <div key={`b${i}`} className="border-b border-r border-slate-200 bg-slate-50/60" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = new Date(year, month, i + 1);
                  const k = toKey(d);
                  return (
                    <DayCell key={k} date={d} events={eventsByDate.get(k) ?? []} isToday={k === todayKey}
                      isCurrentMonth visibleStatuses={visibleStatuses} onAdd={handleAdd} onNavigate={handleNavigate} onDayClick={handleDayClick} />
                  );
                })}
                {Array.from({ length: rows * 7 - total }).map((_, i) => (
                  <div key={`t${i}`} className="border-b border-r border-slate-200 bg-slate-50/60" />
                ))}
              </div>
            </div>
            {/* Mobile agenda fallback */}
            <div className="flex-1 sm:hidden">
              <AgendaView year={year} month={month} eventsByDate={eventsByDate} visibleStatuses={visibleStatuses} onAdd={handleAdd} onNavigate={handleNavigate} />
            </div>
          </>
        )}

        {/* Week view */}
        {view === "week" && (
          <div className="flex flex-1 flex-col">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-white">
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date(weekStart); d.setDate(d.getDate() + i);
                const k = toKey(d);
                return (
                  <button key={k} onClick={() => { setFocusDay(d); setView("day"); }}
                    className={cn("border-r border-slate-100 py-2 text-center text-xs font-semibold transition-colors last:border-none hover:bg-orange-50", k === todayKey ? "text-orange-500" : "text-slate-500")}>
                    <span className="block text-[10px] uppercase">{DAY_NAMES[i]}</span>
                    <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold", k === todayKey && "bg-orange-500 text-white")}>
                      {d.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
            <WeekView weekStart={weekStart} eventsByDate={eventsByDate} visibleStatuses={visibleStatuses} onAdd={handleAdd} onNavigate={handleNavigate} onDayClick={handleDayClick} />
          </div>
        )}

        {/* Day view */}
        {view === "day" && (
          <DayView date={focusDay} eventsByDate={eventsByDate} visibleStatuses={visibleStatuses} onAdd={handleAdd} onNavigate={handleNavigate} />
        )}

        {/* Agenda view */}
        {view === "agenda" && (
          <AgendaView year={year} month={month} eventsByDate={eventsByDate} visibleStatuses={visibleStatuses} onAdd={handleAdd} onNavigate={handleNavigate} />
        )}
        </div>
      </div>

      {/* Loading spinner */}
      {isLoading && <OverlaySpinner label="טוען לוח שנה…" />}

      {/* Day modal */}
      {modalDayKey && modalDate && (
        <DayModal
          date={modalDate}
          events={modalEvents}
          onClose={() => setModalDayKey(null)}
          onAdd={handleAdd}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}
