"use client";

/**
 * WeatherCard.tsx
 *
 * Renders a single day's weather (temperature, feels-like, humidity).
 * In editable mode it auto-fills from `useWeatherForecast` once on first
 * render when the day's source is `"db"` and the snapshot is available.
 * Any manual edit flips the day's source to `"manual"` and stops the
 * auto-fill. The "טען מחדש מהמערכת" button reverts to the DB value.
 */

import { useEffect, useRef } from "react";
import { CloudSun, RefreshCw, Thermometer, Wind, Droplets } from "lucide-react";
import { FieldText } from "@/components/inputs/FieldText";
import { Button } from "@/components/ui/button";
import type { WeatherDay, WeatherSource } from "@/types/report";
import type { WeatherSnapshot } from "@/types/weather";

export type WeatherAccent = "sky" | "cyan";

const ACCENTS: Record<
  WeatherAccent,
  {
    headerBg: string;
    iconGradient: string;
    stripe: string;
    statBg: string;
    statRing: string;
    statValue: string;
  }
> = {
  sky: {
    headerBg:    "bg-gradient-to-l from-sky-50 via-blue-50 to-cyan-50",
    iconGradient:"bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-500",
    stripe:      "bg-gradient-to-l from-sky-400 via-blue-400 to-cyan-400",
    statBg:      "bg-sky-50/60",
    statRing:    "ring-sky-100",
    statValue:   "text-sky-700",
  },
  cyan: {
    headerBg:    "bg-gradient-to-l from-cyan-50 via-teal-50 to-emerald-50",
    iconGradient:"bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500",
    stripe:      "bg-gradient-to-l from-cyan-400 via-teal-400 to-emerald-400",
    statBg:      "bg-cyan-50/60",
    statRing:    "ring-cyan-100",
    statValue:   "text-cyan-700",
  },
};

export interface WeatherCardProps {
  dayLabel: string;
  value:    WeatherDay;
  source:   WeatherSource;
  accent?:  WeatherAccent;
  /** DB snapshot for this day, or `null` when none was returned. */
  dbSnapshot: WeatherSnapshot | null;
  /** True while the forecast endpoint is loading. */
  isLoading?: boolean;
  /** Whether `useWeatherForecast` returned an error. */
  hasError?: boolean;
  onChange?: (next: WeatherDay, nextSource: WeatherSource) => void;
  readOnly?: boolean;
  errors?: Partial<Record<keyof WeatherDay, string>>;
}

const sourceLabel = (s: WeatherSource): string => (s === "db" ? "מהמערכת" : "ידני");
const sourceClass = (s: WeatherSource): string =>
  s === "db"
    ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
    : "bg-amber-100 text-amber-700 ring-amber-200";

export function WeatherCard({
  dayLabel,
  value,
  source,
  accent = "sky",
  dbSnapshot,
  isLoading,
  hasError,
  onChange,
  readOnly,
  errors,
}: WeatherCardProps) {
  const a = ACCENTS[accent];

  // Auto-fill once when the day is in `db` mode, no value yet, and the
  // snapshot just arrived. We track the last applied snapshot to avoid
  // overwriting subsequent manual edits if the SWR cache refreshes.
  const appliedRef = useRef<string | null>(null);
  useEffect(() => {
    if (readOnly || !onChange) return;
    if (source !== "db") return;
    if (!dbSnapshot) return;
    const sig = `${dbSnapshot.temperatureC}|${dbSnapshot.feelsLikeC}|${dbSnapshot.humidityPct}`;
    if (appliedRef.current === sig) return;
    appliedRef.current = sig;
    onChange(
      {
        temperatureC: dbSnapshot.temperatureC,
        feelsLikeC:   dbSnapshot.feelsLikeC,
        humidityPct:  dbSnapshot.humidityPct,
      },
      "db",
    );
  }, [dbSnapshot, source, readOnly, onChange]);

  const set = <K extends keyof WeatherDay>(k: K, v: WeatherDay[K]) => {
    if (!onChange) return;
    onChange({ ...value, [k]: v }, "manual");
  };

  const reloadFromDb = () => {
    if (!onChange || !dbSnapshot) return;
    appliedRef.current = `${dbSnapshot.temperatureC}|${dbSnapshot.feelsLikeC}|${dbSnapshot.humidityPct}`;
    onChange(
      {
        temperatureC: dbSnapshot.temperatureC,
        feelsLikeC:   dbSnapshot.feelsLikeC,
        humidityPct:  dbSnapshot.humidityPct,
      },
      "db",
    );
  };

  const numberValue = (n: number) => (Number.isFinite(n) && n !== 0 ? String(n) : n === 0 ? "0" : "");

  const Header = (
    <div className={`flex items-center gap-2 px-5 pt-4 pb-3 ${a.headerBg} border-b border-slate-100`}>
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.iconGradient} text-white shadow`}>
        <CloudSun className="h-4 w-4" />
      </span>
      <h4 className="text-sm font-semibold text-slate-800">מזג אוויר — {dayLabel}</h4>
      <span className={`text-xs rounded-full px-2 py-0.5 ring-1 font-medium ${sourceClass(source)}`}>
        {sourceLabel(source)}
      </span>
      {!readOnly && dbSnapshot && source === "manual" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={reloadFromDb}
          className="ms-auto gap-1.5 h-7 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          טען מחדש מהמערכת
        </Button>
      )}
    </div>
  );

  if (readOnly) {
    const stat = (
      Icon: typeof Thermometer,
      label: string,
      val: string | number,
      tone: string,
      suffix?: string,
    ) => (
      <div className={`rounded-xl ${a.statBg} ring-1 ${a.statRing} p-3 flex items-start gap-3`}>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone} text-white shadow-sm shrink-0`}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className={`text-base font-bold ${a.statValue}`}>
            {val}
            {suffix && <span className="text-xs font-normal text-slate-500"> {suffix}</span>}
          </div>
        </div>
      </div>
    );
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" dir="rtl">
        <div className={`absolute inset-x-0 top-0 h-1 ${a.stripe}`} />
        {Header}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
          {stat(Thermometer, "טמפרטורה",          value.temperatureC, "bg-rose-500",    "°C")}
          {stat(Wind,        "טמפרטורה מורגשת",   value.feelsLikeC,   "bg-orange-500",  "°C")}
          {stat(Droplets,    "לחות",              value.humidityPct,  "bg-blue-500",    "%")}
        </div>
      </div>
    );
  }

  const showNotFoundHint = !isLoading && !hasError && !dbSnapshot && source === "db";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" dir="rtl">
      <div className={`absolute inset-x-0 top-0 h-1 ${a.stripe}`} />
      {Header}

      <div className="p-5 space-y-4">
        {showNotFoundHint && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            לא נמצא מידע לתאריך זה — ניתן להזין ידנית.
          </p>
        )}
        {hasError && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            שגיאה בטעינת תחזית מזג האוויר — ניתן להזין ידנית.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldText
            label="טמפרטורה (°C)"
            startIcon={<Thermometer className="h-4 w-4 text-rose-500" />}
            type="number"
            inputMode="decimal"
            step="any"
            min={-50}
            max={60}
            required
            value={numberValue(value.temperatureC)}
            onChange={(e) => set("temperatureC", e.target.value === "" ? 0 : Number(e.target.value))}
            error={errors?.temperatureC}
          />
          <FieldText
            label="טמפרטורה מורגשת (°C)"
            startIcon={<Wind className="h-4 w-4 text-orange-500" />}
            type="number"
            inputMode="decimal"
            step="any"
            min={-50}
            max={60}
            required
            value={numberValue(value.feelsLikeC)}
            onChange={(e) => set("feelsLikeC", e.target.value === "" ? 0 : Number(e.target.value))}
            error={errors?.feelsLikeC}
          />
          <FieldText
            label="לחות (%)"
            startIcon={<Droplets className="h-4 w-4 text-blue-500" />}
            type="number"
            inputMode="numeric"
            step="any"
            min={0}
            max={100}
            required
            value={numberValue(value.humidityPct)}
            onChange={(e) => set("humidityPct", e.target.value === "" ? 0 : Number(e.target.value))}
            error={errors?.humidityPct}
          />
        </div>
      </div>
    </div>
  );
}
