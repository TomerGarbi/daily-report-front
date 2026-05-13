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

export type LoadAccent = "orange" | "slate";

const ACCENTS: Record<
  LoadAccent,
  {
    headerBg: string;
    iconBg: string;
    statValue: string;
  }
> = {
  orange: {
    headerBg:  "bg-orange-50",
    iconBg:    "bg-orange-500",
    statValue: "text-orange-700",
  },
  slate: {
    headerBg:  "bg-slate-50",
    iconBg:    "bg-slate-700",
    statValue: "text-slate-700",
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
    <div className={`flex items-center gap-2 px-5 pt-4 pb-3 ${a.headerBg} border-b border-slate-200`}>
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.iconBg} text-white shadow-sm`}>
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
    ) => (
      <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-3 flex items-start gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200 text-slate-500 shrink-0">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className={`text-base font-bold ${a.statValue}`}>{val}</div>
        </div>
      </div>
    );

    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" dir="rtl">
        {Header}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
          {stat(Flame,      "תחזית עומס (MW)",               value.value)}
          {stat(Clock,      "שעת שיא",                        value.peakHour || "—")}
          {stat(Activity,   "עומס בשעת רזרבה מינימלית (MW)", value.minReserveValue)}
          {stat(AlarmClock, "שעת רזרבה מינימלית",            value.minReserveHour || "—")}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" dir="rtl">
      {Header}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
        <FieldText
          label="תחזית עומס (MW)"
          startIcon={<Flame className="h-4 w-4 text-slate-400" />}
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
          startIcon={<Clock className="h-4 w-4 text-slate-400" />}
          type="time"
          required
          value={value.peakHour}
          onChange={(e) => set("peakHour", e.target.value)}
          error={errors?.peakHour}
        />
        <FieldText
          label="עומס בשעת רזרבה מינימלית (MW)"
          startIcon={<Activity className="h-4 w-4 text-slate-400" />}
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
          startIcon={<AlarmClock className="h-4 w-4 text-slate-400" />}
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
