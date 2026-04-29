/**
 * useWeatherForecast.ts
 *
 * SWR-backed hook that returns today/tomorrow weather snapshots for a
 * region. Used by the forecast section to auto-fill the weather card.
 */

import { useMemo } from "react";
import type { WeatherForecastResponse } from "@/types/weather";
import { buildWeatherForecastUrl } from "@/lib/weather-api";
import { useAuthSWR } from "@/hooks/useAuthSWR";

export interface UseWeatherForecastReturn {
  forecast: WeatherForecastResponse | null;
  isLoading: boolean;
  error: Error | undefined;
}

export function useWeatherForecast(
  region: string = "gush-dan",
  enabled: boolean = true,
): UseWeatherForecastReturn {
  const url = useMemo(
    () => (enabled ? buildWeatherForecastUrl(region) : null),
    [region, enabled],
  );

  const { data, isLoading, error } = useAuthSWR<WeatherForecastResponse>(url);

  return {
    forecast: data ?? null,
    isLoading,
    error: error as Error | undefined,
  };
}
