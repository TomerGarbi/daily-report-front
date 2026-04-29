/**
 * forecast-defaults.ts
 *
 * Empty-state factory for the forecast block. Used when initialising a
 * new report or when an existing report has no forecast yet.
 */

import type { ForecastBlock, LoadForecastDay, WeatherDay } from "@/types/report";

const emptyLoadDay = (): LoadForecastDay => ({
  value:           0,
  peakHour:        "",
  minReserveValue: 0,
  minReserveHour:  "",
});

const emptyWeatherDay = (): WeatherDay => ({
  temperatureC: 0,
  feelsLikeC:   0,
  humidityPct:  0,
});

export const emptyForecast = (region: string = "gush-dan"): ForecastBlock => ({
  load: {
    today:    emptyLoadDay(),
    tomorrow: emptyLoadDay(),
  },
  weather: {
    region,
    today:     emptyWeatherDay(),
    tomorrow:  emptyWeatherDay(),
    source: {
      today:    "manual",
      tomorrow: "manual",
    },
  },
});
