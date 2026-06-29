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

export type WeatherAccent = "orange" | "slate";

const ACCENTS: Record<
  WeatherAccent,
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
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";

export function WeatherCard({
  dayLabel,
  value,
  source,
  accent = "orange",
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
        description:  value.description ?? "",
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
        description:  value.description ?? "",
      },
      "db",
    );
  };

  const numberValue = (n: number) => (Number.isFinite(n) && n !== 0 ? String(n) : n === 0 ? "0" : "");

  const Header = (
    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${a.iconBg} ${a.iconText} ring-1 ring-orange-100`}>
        <CloudSun className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold ${a.eyebrow}`}>נתוני מזג אוויר</p>
        <h4 className="text-sm font-bold text-slate-900">מזג אוויר — {dayLabel}</h4>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${sourceClass(source)}`}>
          {sourceLabel(source)}
        </span>
        {!readOnly && dbSnapshot && source === "manual" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={reloadFromDb}
            className="h-8 gap-1.5 border-orange-200 bg-white text-xs text-orange-700 hover:bg-orange-50 hover:text-orange-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            טען מחדש מהמערכת
          </Button>
        )}
      </div>
    </div>
  );

  if (readOnly) {
    const stat = (
      Icon: typeof Thermometer,
      label: string,
      val: string | number,
      suffix?: string,
    ) => (
      <div className="flex min-h-[5.5rem] items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-orange-500 ring-1 ring-slate-200">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-xs font-medium leading-5 text-slate-500">{label}</div>
          <div className={`mt-0.5 text-lg font-bold tabular-nums ${a.statValue}`}>
            {val}
            {suffix && <span className="text-xs font-normal text-slate-500"> {suffix}</span>}
          </div>
        </div>
      </div>
    );
    return (
      <section className={`overflow-hidden rounded-xl border ${a.border} bg-white shadow-sm`} dir="rtl">
        {Header}
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          {stat(Thermometer, "טמפרטורה",          value.temperatureC, "°C")}
          {stat(Wind,        "טמפרטורה מורגשת",   value.feelsLikeC,   "°C")}
          {stat(Droplets,    "לחות",              value.humidityPct,  "%")}
        </div>
        {value.description && (
          <div className="border-t border-slate-100 px-4 pb-4 pt-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm leading-6 text-slate-700">
              {value.description}
            </div>
          </div>
        )}
      </section>
    );
  }

  const showNotFoundHint = !isLoading && !hasError && !dbSnapshot && source === "db";

  return (
    <section className={`overflow-hidden rounded-xl border ${a.border} bg-white shadow-sm`} dir="rtl">
      {Header}

      <div className="p-5 space-y-4">
        {showNotFoundHint && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
            לא נמצא מידע לתאריך זה — ניתן להזין ידנית.
          </p>
        )}
        {hasError && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">
            שגיאה בטעינת תחזית מזג האוויר — ניתן להזין ידנית.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FieldText
            label="טמפרטורה (°C)"
            labelClassName={FIELD_LABEL_CLASS}
            startIcon={<Thermometer className="h-4 w-4 text-slate-400" />}
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
            labelClassName={FIELD_LABEL_CLASS}
            startIcon={<Wind className="h-4 w-4 text-slate-400" />}
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
            labelClassName={FIELD_LABEL_CLASS}
            startIcon={<Droplets className="h-4 w-4 text-slate-400" />}
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

        <FieldText
          label="תיאור מזג האוויר"
          startIcon={<CloudSun className="h-4 w-4 text-slate-400" />}
          type="text"
          maxLength={200}
          value={value.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          error={errors?.description}
        />
      </div>
    </section>
  );
}
