"use client";

/**
 * ForecastSection.tsx
 *
 * Top-level container for the forecast step of the report stepper.
 * Renders two columns (היום | מחר), each with a load-forecast card and
 * a weather card. In `readOnly` mode it doubles as the read-only display
 * used by the report detail page and the review step.
 */

import { useCallback } from "react";
import { CalendarDays, MapPin, Moon, Sun, TrendingUp } from "lucide-react";
import { useWeatherForecast } from "@/hooks/useWeatherForecast";
import { LoadForecastCard } from "./LoadForecastCard";
import { WeatherCard } from "./WeatherCard";
import { emptyForecast } from "./forecast-defaults";
import type {
  ForecastBlock,
  LoadForecastDay,
  WeatherDay,
  WeatherSource,
} from "@/types/report";

export interface ForecastSectionProps {
  value: ForecastBlock | undefined;
  onChange?: (next: ForecastBlock) => void;
  readOnly?: boolean;
  /** Optional flat error map produced from `forecastSchema.safeParse`. */
  errors?: Record<string, string>;
}

const REGION = "gush-dan";

/** Per-day theme — single accent color, no gradients. */
const DAY_THEMES = {
  today: {
    icon: Sun,
    label: "היום",
    eyebrow: "יום נוכחי",
    iconBg: "bg-orange-500",
    iconText: "text-white",
    headerBg: "bg-white",
    headerBorder: "border-orange-200",
    rail: "bg-orange-500",
    loadAccent: "orange" as const,
    weatherAccent: "orange" as const,
  },
  tomorrow: {
    icon: Moon,
    label: "מחר",
    eyebrow: "יום הבא",
    iconBg: "bg-orange-50",
    iconText: "text-orange-600",
    headerBg: "bg-white",
    headerBorder: "border-slate-200",
    rail: "bg-slate-300",
    loadAccent: "slate" as const,
    weatherAccent: "slate" as const,
  },
};

export function ForecastSection({ value, onChange, readOnly, errors }: ForecastSectionProps) {
  const block = value ?? emptyForecast(REGION);

  const { forecast, isLoading, error } = useWeatherForecast(
    block.weather.region || REGION,
    !readOnly,
  );

  const setLoadDay = useCallback(
    (day: "today" | "tomorrow", next: LoadForecastDay) => {
      if (!onChange) return;
      onChange({
        ...block,
        load: { ...block.load, [day]: next },
      });
    },
    [block, onChange],
  );

  const setWeatherDay = useCallback(
    (day: "today" | "tomorrow", next: WeatherDay, nextSource: WeatherSource) => {
      if (!onChange) return;
      onChange({
        ...block,
        weather: {
          ...block.weather,
          [day]: next,
          source: { ...block.weather.source, [day]: nextSource },
          fetchedAt: forecast?.fetchedAt ?? block.weather.fetchedAt,
        },
      });
    },
    [block, onChange, forecast?.fetchedAt],
  );

  const loadErrors = (day: "today" | "tomorrow") =>
    errors
      ? {
          value:           errors[`load.${day}.value`],
          peakHour:        errors[`load.${day}.peakHour`],
          minReserveValue: errors[`load.${day}.minReserveValue`],
          minReserveHour:  errors[`load.${day}.minReserveHour`],
        }
      : undefined;

  const weatherErrors = (day: "today" | "tomorrow") =>
    errors
      ? {
          temperatureC: errors[`weather.${day}.temperatureC`],
          feelsLikeC:   errors[`weather.${day}.feelsLikeC`],
          humidityPct:  errors[`weather.${day}.humidityPct`],
          description:  errors[`weather.${day}.description`],
        }
      : undefined;

  const renderColumn = (day: "today" | "tomorrow") => {
    const theme = DAY_THEMES[day];
    const Icon = theme.icon;
    return (
      <div className="space-y-4">
        <div
          className={`relative overflow-hidden rounded-xl ${theme.headerBg} border ${theme.headerBorder} px-5 py-4 shadow-sm`}
        >
          <span className={`absolute inset-y-0 right-0 w-1 ${theme.rail}`} />
          <div className="flex items-center gap-3 pr-2">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${theme.iconBg} ${theme.iconText} ring-1 ring-orange-100`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-orange-600">{theme.eyebrow}</p>
              <h3 className="text-lg font-bold leading-tight text-slate-900">{theme.label}</h3>
              <p className="mt-0.5 text-sm text-slate-500">תחזית עומס ומזג אוויר</p>
            </div>
          </div>
        </div>

        <LoadForecastCard
          dayLabel={theme.label}
          value={block.load[day]}
          accent={theme.loadAccent}
          onChange={readOnly ? undefined : (next) => setLoadDay(day, next)}
          readOnly={readOnly}
          errors={loadErrors(day)}
        />
        <WeatherCard
          dayLabel={theme.label}
          value={block.weather[day]}
          source={block.weather.source[day]}
          accent={theme.weatherAccent}
          dbSnapshot={forecast?.[day] ?? null}
          isLoading={isLoading}
          hasError={!!error}
          onChange={readOnly ? undefined : (next, src) => setWeatherDay(day, next, src)}
          readOnly={readOnly}
          errors={weatherErrors(day)}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {!readOnly && (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-orange-600">שלב תחזית</p>
                <h2 className="text-lg font-bold leading-tight text-slate-900">תחזית להיום ולמחר</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  תחזית עומס ומזג אוויר. הנתונים נטענים מהמערכת וניתנים לעריכה ידנית לפני שמירה.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-100 bg-orange-50 px-3 py-1.5 text-orange-700">
                <MapPin className="h-3.5 w-3.5" />
                גוש דן
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">
                <CalendarDays className="h-3.5 w-3.5" />
                היום ומחר
              </span>
            </div>
          </div>
        </div>
      )}

      {readOnly && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">תחזית להיום ולמחר</h2>
            <p className="mt-0.5 text-sm text-slate-500">תחזית עומס ומזג אוויר</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {renderColumn("today")}
        {renderColumn("tomorrow")}
      </div>
    </div>
  );
}
