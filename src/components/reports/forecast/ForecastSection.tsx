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
import { Sun, Moon, TrendingUp } from "lucide-react";
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
    iconBg: "bg-orange-500",
    headerBg: "bg-orange-50",
    headerBorder: "border-orange-100",
    loadAccent: "orange" as const,
    weatherAccent: "orange" as const,
  },
  tomorrow: {
    icon: Moon,
    label: "מחר",
    iconBg: "bg-slate-700",
    headerBg: "bg-slate-50",
    headerBorder: "border-slate-200",
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
        }
      : undefined;

  const renderColumn = (day: "today" | "tomorrow") => {
    const theme = DAY_THEMES[day];
    const Icon = theme.icon;
    return (
      <div className="space-y-4">
        <div
          className={`rounded-2xl ${theme.headerBg} border ${theme.headerBorder} px-4 py-3`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.iconBg} text-white shadow-sm`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-800">{theme.label}</h3>
              <p className="text-xs text-slate-500">תחזית עומס ומזג אוויר</p>
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
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shrink-0">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-800">תחזית להיום ולמחר</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                תחזית עומס ומזג אוויר (אזור גוש דן). הנתונים נטענים אוטומטית מהמערכת
                וניתן לערוך אותם ידנית לפני שמירה.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {renderColumn("today")}
        {renderColumn("tomorrow")}
      </div>
    </div>
  );
}
