"use client";

import { cn } from "@/lib/utils";
import {
  DisplayStatus,
  ViewMode,
  STATUS_META,
  ALL_STATUSES,
} from "@/components/calendar/calendar.types";
import {
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Search,
  User2,
  Tag,
  LayoutList,
  Grid3x3,
  CalendarRange,
  CalendarClock,
  Filter,
  X,
} from "lucide-react";

interface CalendarToolbarProps {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  periodLabel: string;
  activeCount: number;
  search: string;
  onSearchChange: (v: string) => void;
  visibleStatuses: Set<DisplayStatus>;
  onToggleStatus: (s: DisplayStatus) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  authorFilter: string;
  onAuthorFilterChange: (v: string) => void;
  allAuthors: string[];
  categoryFilter: string;
  onCategoryFilterChange: (v: string) => void;
  allCategories: string[];
  onClearAttributeFilters: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarToolbar({
  view,
  onViewChange,
  periodLabel,
  activeCount,
  search,
  onSearchChange,
  visibleStatuses,
  onToggleStatus,
  showFilters,
  onToggleFilters,
  authorFilter,
  onAuthorFilterChange,
  allAuthors,
  categoryFilter,
  onCategoryFilterChange,
  allCategories,
  onClearAttributeFilters,
  onPrev,
  onNext,
  onToday,
}: CalendarToolbarProps) {
  const VIEW_OPTIONS = [
    { id: "month" as const, icon: Grid3x3, label: "חודש" },
    { id: "week" as const, icon: CalendarRange, label: "שבוע" },
    { id: "day" as const, icon: CalendarClock, label: "יום" },
    { id: "agenda" as const, icon: LayoutList, label: "רשימה" },
  ];

  return (
    <div className="sticky top-[7rem] z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      {/* Row 1 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-orange-500" />
          <h1 className="hidden text-base font-bold text-slate-800 sm:block">לוח שנה</h1>
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
            {activeCount}
          </span>
        </div>

        {/* prev / label / next */}
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <span className="min-w-[12rem] text-center text-sm font-semibold text-slate-700">
            {periodLabel}
          </span>
          <button
            onClick={onNext}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        <button
          onClick={onToday}
          className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition-colors"
        >
          היום
        </button>

        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-0.5">
          {VIEW_OPTIONS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                view === id
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: search + filter toggle + legend */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[160px] max-w-xs flex-1">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="חיפוש דוח…"
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-8 pl-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <button
          onClick={onToggleFilters}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            showFilters
              ? "border-orange-300 bg-orange-50 text-orange-600"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <Filter size={13} /> סינון
          {(authorFilter !== "all" || categoryFilter !== "all") && (
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          )}
        </button>

        {/* Clickable legend */}
        <div className="flex flex-wrap gap-1.5">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => onToggleStatus(s)}
              title={visibleStatuses.has(s) ? `הסתר ${STATUS_META[s].label}` : `הצג ${STATUS_META[s].label}`}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all",
                visibleStatuses.has(s)
                  ? `${STATUS_META[s].badge} border-transparent shadow-sm`
                  : "border-slate-200 bg-white text-slate-400 line-through"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  visibleStatuses.has(s) ? STATUS_META[s].dot : "bg-slate-300"
                )}
              />
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded attribute filters */}
      {showFilters && (
        <div className="mt-2 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <User2 size={13} className="text-slate-400" />
            <label className="text-xs text-slate-500">מגיש:</label>
            <select
              value={authorFilter}
              onChange={(e) => onAuthorFilterChange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {allAuthors.map((a) => (
                <option key={a} value={a}>
                  {a === "all" ? "הכל" : a}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Tag size={13} className="text-slate-400" />
            <label className="text-xs text-slate-500">קטגוריה:</label>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "הכל" : c}
                </option>
              ))}
            </select>
          </div>
          {(authorFilter !== "all" || categoryFilter !== "all") && (
            <button
              onClick={onClearAttributeFilters}
              className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700"
            >
              <X size={12} /> נקה סינון
            </button>
          )}
        </div>
      )}
    </div>
  );
}
