"use client";

/**
 * LoadForecastCard.tsx
 *
 * Editable card with the four load-forecast fields for a single day.
 * In `readOnly` mode renders the same layout as a static summary.
 */

import { TrendingUp, Flame, AlarmClock, Activity, Clock } from "lucide-react";
import { FieldText } from "@/components/inputs/FieldText";
import type { LoadForecastDay } from "@/types/report";

export type LoadAccent = "orange" | "violet";

const ACCENTS: Record<
  LoadAccent,
  {
    headerBg: string;
    iconGradient: string;
    stripe: string;
    statBg: string;
    statRing: string;
    statValue: string;
  }
> = {
  orange: {
    headerBg:    "bg-gradient-to-l from-orange-50 via-amber-50 to-rose-50",
    iconGradient:"bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500",
    stripe:      "bg-gradient-to-l from-orange-400 via-amber-400 to-rose-400",
    statBg:      "bg-orange-50/60",
    statRing:    "ring-orange-100",
    statValue:   "text-orange-700",
  },
  violet: {
    headerBg:    "bg-gradient-to-l from-violet-50 via-fuchsia-50 to-indigo-50",
    iconGradient:"bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500",
    stripe:      "bg-gradient-to-l from-violet-400 via-fuchsia-400 to-indigo-400",
    statBg:      "bg-violet-50/60",
    statRing:    "ring-violet-100",
    statValue:   "text-violet-700",
  },
};

export interface LoadForecastCardProps {
  /** Day label (e.g. "היום", "מחר"). */
  dayLabel: string;
  value:    LoadForecastDay;
  accent?:  LoadAccent;
  onChange?: (next: LoadForecastDay) => void;
  readOnly?: boolean;
  /** Optional flat field-error map keyed by `value | peakHour | minReserveValue | minReserveHour`. */
  errors?: Partial<Record<keyof LoadForecastDay, string>>;
}

export function LoadForecastCard({
  dayLabel,
  value,
  accent = "orange",
  onChange,
  readOnly,
  errors,
}: LoadForecastCardProps) {
  const a = ACCENTS[accent];

  const set = <K extends keyof LoadForecastDay>(k: K, v: LoadForecastDay[K]) => {
    if (!onChange) return;
    onChange({ ...value, [k]: v });
  };

  const numberValue = (n: number) => (Number.isFinite(n) && n !== 0 ? String(n) : n === 0 ? "0" : "");

  const Header = (
    <div className={`flex items-center gap-2 px-5 pt-4 pb-3 ${a.headerBg} border-b border-slate-100`}>
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.iconGradient} text-white shadow`}>
        <TrendingUp className="h-4 w-4" />
      </span>
      <h4 className="text-sm font-semibold text-slate-800">תחזית עומס — {dayLabel}</h4>
    </div>
  );

  if (readOnly) {
    const stat = (
      Icon: typeof Flame,
      label: string,
      val: string | number,
      tone: string,
    ) => (
      <div className={`rounded-xl ${a.statBg} ring-1 ${a.statRing} p-3 flex items-start gap-3`}>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone} text-white shadow-sm shrink-0`}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className={`text-base font-bold ${a.statValue}`}>{val}</div>
        </div>
      </div>
    );

    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" dir="rtl">
        <div className={`absolute inset-x-0 top-0 h-1 ${a.stripe}`} />
        {Header}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
          {stat(Flame,      "תחזית עומס (MW)",               value.value,                       "bg-rose-500")}
          {stat(Clock,      "שעת שיא",                        value.peakHour || "—",             "bg-amber-500")}
          {stat(Activity,   "עומס בשעת רזרבה מינימלית (MW)", value.minReserveValue,             "bg-emerald-500")}
          {stat(AlarmClock, "שעת רזרבה מינימלית",            value.minReserveHour || "—",       "bg-sky-500")}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" dir="rtl">
      <div className={`absolute inset-x-0 top-0 h-1 ${a.stripe}`} />
      {Header}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
        <FieldText
          label="תחזית עומס (MW)"
          startIcon={<Flame className="h-4 w-4 text-rose-500" />}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          required
          value={numberValue(value.value)}
          onChange={(e) => set("value", e.target.value === "" ? 0 : Number(e.target.value))}
          error={errors?.value}
        />
        <FieldText
          label="שעת שיא"
          startIcon={<Clock className="h-4 w-4 text-amber-500" />}
          type="time"
          required
          value={value.peakHour}
          onChange={(e) => set("peakHour", e.target.value)}
          error={errors?.peakHour}
        />
        <FieldText
          label="עומס בשעת רזרבה מינימלית (MW)"
          startIcon={<Activity className="h-4 w-4 text-emerald-500" />}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          required
          value={numberValue(value.minReserveValue)}
          onChange={(e) => set("minReserveValue", e.target.value === "" ? 0 : Number(e.target.value))}
          error={errors?.minReserveValue}
        />
        <FieldText
          label="שעת רזרבה מינימלית"
          startIcon={<AlarmClock className="h-4 w-4 text-sky-500" />}
          type="time"
          required
          value={value.minReserveHour}
          onChange={(e) => set("minReserveHour", e.target.value)}
          error={errors?.minReserveHour}
        />
      </div>
    </div>
  );
}
