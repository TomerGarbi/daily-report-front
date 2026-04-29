/**
 * weather-api.ts
 *
 * Read-only helpers for the `/weather` endpoint.
 */

import type { WeatherForecastResponse } from "@/types/weather";

type AuthFetchFn = (input: string | URL, init?: RequestInit) => Promise<Response>;

export function buildWeatherForecastUrl(region: string = "gush-dan"): string {
  const q = new URLSearchParams({ region });
  return `/api/v1/weather/forecast?${q.toString()}`;
}

export async function fetchWeatherForecast(
  authFetch: AuthFetchFn,
  region: string = "gush-dan",
): Promise<WeatherForecastResponse> {
  const res = await authFetch(buildWeatherForecastUrl(region));
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { message?: string }).message ?? `שגיאה בטעינת תחזית מזג האוויר (${res.status})`;
    throw new Error(msg);
  }
  return (await res.json()) as WeatherForecastResponse;
}
