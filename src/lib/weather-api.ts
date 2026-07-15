/**
 * weather-api.ts
 *
 * Read-only helpers for the `/weather` endpoint.
 *
 * All requests go through the shared `apiClient` (axios).
 */

import type { WeatherForecastResponse } from "@/types/weather";
import { apiClient, toApiError } from "@/lib/apiClient";

export function buildWeatherForecastUrl(region: string = "gush-dan"): string {
  const q = new URLSearchParams({ region });
  return `/api/v1/weather/forecast?${q.toString()}`;
}

export async function fetchWeatherForecast(
  region: string = "gush-dan",
): Promise<WeatherForecastResponse> {
  try {
    const { data } = await apiClient.get(buildWeatherForecastUrl(region));
    return data as WeatherForecastResponse;
  } catch (err) {
    throw toApiError(err, "שגיאה בטעינת תחזית מזג האוויר");
  }
}
