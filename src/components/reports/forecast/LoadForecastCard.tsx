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
    border: string;
    eyebrow: string;
    iconBg: string;
    iconText: string;
    statValue: string;
  }
> = {
  orange: {
    border:    "border-orange-100",
    eyebrow:   "text-orange-600",
    iconBg:    "bg-orange-500",
    iconText:  "text-white",
    statValue: "text-slate-900",
  },
  slate: {
    border:    "border-slate-200",
    eyebrow:   "text-slate-500",
    iconBg:    "bg-orange-50",
    iconText:  "text-orange-600",
    statValue: "text-slate-900",
  },
};

const FIELD_LABEL_CLASS = "flex min-h-10 items-end leading-5";

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
    <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.iconBg} ${a.iconText} ring-1 ring-orange-100`}>
        <TrendingUp className="h-4 w-4" />
      </span>
      <div>
        <p className={`text-xs font-semibold ${a.eyebrow}`}>נתוני עומס</p>
        <h4 className="text-sm font-bold text-slate-900">תחזית עומס — {dayLabel}</h4>
      </div>
    </div>
  );

  if (readOnly) {
    const stat = (
      Icon: typeof Flame,
      label: string,
      val: string | number,
    ) => (
      <div className="flex min-h-[5.5rem] items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-orange-500 ring-1 ring-slate-200">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-xs font-medium leading-5 text-slate-500">{label}</div>
          <div className={`mt-0.5 text-lg font-bold tabular-nums ${a.statValue}`}>{val}</div>
        </div>
      </div>
    );

    return (
      <section className={`overflow-hidden rounded-xl border ${a.border} bg-white shadow-sm`} dir="rtl">
        {Header}
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          {stat(Flame,      "תחזית עומס (MW)",               value.value)}
          {stat(Clock,      "שעת שיא",                        value.peakHour || "—")}
          {stat(Activity,   "עומס בשעת רזרבה מינימלית (MW)", value.minReserveValue)}
          {stat(AlarmClock, "שעת רזרבה מינימלית",            value.minReserveHour || "—")}
        </div>
      </section>
    );
  }

  return (
    <section className={`overflow-hidden rounded-xl border ${a.border} bg-white shadow-sm`} dir="rtl">
      {Header}

      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <FieldText
          label="תחזית עומס (MW)"
          labelClassName={FIELD_LABEL_CLASS}
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
          labelClassName={FIELD_LABEL_CLASS}
          startIcon={<Clock className="h-4 w-4 text-slate-400" />}
          type="time"
          required
          value={value.peakHour}
          onChange={(e) => set("peakHour", e.target.value)}
          error={errors?.peakHour}
        />
        <FieldText
          label="עומס בשעת רזרבה מינימלית (MW)"
          labelClassName={FIELD_LABEL_CLASS}
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
          labelClassName={FIELD_LABEL_CLASS}
          startIcon={<AlarmClock className="h-4 w-4 text-slate-400" />}
          type="time"
          required
          value={value.minReserveHour}
          onChange={(e) => set("minReserveHour", e.target.value)}
          error={errors?.minReserveHour}
        />
      </div>
    </section>
  );
}
